import { db } from '../../FirebaseConfig';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';

export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalRegistrations: number;
  totalPosts: number;
  newRegistrationsLast30Days: number;
  activeUsers: number;
  alertsSentThisMonth: number;
  courseAnalytics: CourseAnalytics[];
  monthlyGrowth: MonthlyGrowth;
  weeklyData: WeeklyData[];
}

export interface WeeklyData {
  day: string;
  registrations: number;
}

export interface CourseAnalytics {
  courseId: string;
  courseName: string;
  totalRegistrations: number;
  maxCapacity: number;
  fillRate: number;
}

export interface MonthlyGrowth {
  registrations: GrowthData;
  users: GrowthData;
}

export interface GrowthData {
  current: number;
  previous: number;
  percentageChange: number;
}

// Get all dashboard statistics
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Get current date and dates for calculations
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Fetch all data in parallel
    const [
      usersSnapshot,
      coursesSnapshot,
      registrationsSnapshot,
      postsSnapshot,
      alertsSnapshot
    ] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'courses')),
      getDocs(collection(db, 'Registrations')),
      getDocs(collection(db, 'posts')),
      getDocs(query(
        collection(db, 'alerts'),
        where('createdAt', '>=', Timestamp.fromDate(startOfMonth))
      ))
    ]);

    // Calculate basic stats
    const totalUsers = usersSnapshot.size;
    const totalCourses = coursesSnapshot.size;
    const totalRegistrations = registrationsSnapshot.size;
    const totalPosts = postsSnapshot.size;
    const alertsSentThisMonth = alertsSnapshot.docs.filter(doc => 
      doc.data().notificationSent === true
    ).length;

    // Calculate new registrations in last 30 days
    const newRegistrationsLast30Days = registrationsSnapshot.docs.filter(doc => {
      const registrationDate = doc.data().registrationDate?.toDate();
      return registrationDate && registrationDate >= thirtyDaysAgo;
    }).length;

    // Calculate active users (users created in last 30 days)
    const activeUsers = usersSnapshot.docs.filter(doc => {
      const createdAt = doc.data().createdAt?.toDate();
      return createdAt && createdAt >= thirtyDaysAgo;
    }).length;

    // Course Analytics
    const courseAnalytics = await getCourseAnalytics(coursesSnapshot, registrationsSnapshot);

    // Monthly Growth
    const monthlyGrowth = await calculateMonthlyGrowth(
      registrationsSnapshot,
      usersSnapshot,
      startOfMonth,
      startOfLastMonth,
      endOfLastMonth
    );

    // Weekly Data
    const weeklyData = calculateWeeklyData(registrationsSnapshot);

    return {
      totalUsers,
      totalCourses,
      totalRegistrations,
      totalPosts,
      newRegistrationsLast30Days,
      activeUsers,
      alertsSentThisMonth,
      courseAnalytics,
      monthlyGrowth,
      weeklyData
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

// Get course analytics with registration progress
const getCourseAnalytics = async (
  coursesSnapshot: any,
  registrationsSnapshot: any
): Promise<CourseAnalytics[]> => {
  const courseMap = new Map();
  
  // Initialize course data
  coursesSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
    const data = doc.data();
    courseMap.set(doc.id, {
      courseId: doc.id,
      courseName: data.name || 'Unknown Course',
      totalRegistrations: 0,
      maxCapacity: data.maxCapacity || 0,
      fillRate: 0
    });
  });

  // Count registrations per course
  registrationsSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
    const courseId = doc.data().courseId;
    if (courseMap.has(courseId)) {
      const course = courseMap.get(courseId);
      course.totalRegistrations++;
    }
  });

  // Calculate fill rates
  const courseAnalytics: CourseAnalytics[] = [];
  courseMap.forEach((course) => {
    if (course.maxCapacity > 0) {
      course.fillRate = (course.totalRegistrations / course.maxCapacity) * 100;
    }
    courseAnalytics.push(course);
  });

  // Sort by fill rate (most popular first)
  courseAnalytics.sort((a, b) => b.fillRate - a.fillRate);

  return courseAnalytics;
};

// Calculate monthly growth trends
const calculateMonthlyGrowth = async (
  registrationsSnapshot: any,
  usersSnapshot: any,
  startOfMonth: Date,
  startOfLastMonth: Date,
  endOfLastMonth: Date
): Promise<MonthlyGrowth> => {
  // Count registrations this month
  const registrationsThisMonth = registrationsSnapshot.docs.filter((doc: QueryDocumentSnapshot<DocumentData>) => {
    const registrationDate = doc.data().registrationDate?.toDate();
    return registrationDate && registrationDate >= startOfMonth;
  }).length;

  // Count registrations last month
  const registrationsLastMonth = registrationsSnapshot.docs.filter((doc: QueryDocumentSnapshot<DocumentData>) => {
    const registrationDate = doc.data().registrationDate?.toDate();
    return registrationDate && 
           registrationDate >= startOfLastMonth && 
           registrationDate <= endOfLastMonth;
  }).length;

  // Count users this month
  const usersThisMonth = usersSnapshot.docs.filter((doc: QueryDocumentSnapshot<DocumentData>) => {
    const createdAt = doc.data().createdAt?.toDate();
    return createdAt && createdAt >= startOfMonth;
  }).length;

  // Count users last month
  const usersLastMonth = usersSnapshot.docs.filter((doc: QueryDocumentSnapshot<DocumentData>) => {
    const createdAt = doc.data().createdAt?.toDate();
    return createdAt && 
           createdAt >= startOfLastMonth && 
           createdAt <= endOfLastMonth;
  }).length;

  // Calculate percentage changes
  const registrationChange = registrationsLastMonth > 0 
    ? ((registrationsThisMonth - registrationsLastMonth) / registrationsLastMonth) * 100 
    : 0;

  const userChange = usersLastMonth > 0 
    ? ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100 
    : 0;

  return {
    registrations: {
      current: registrationsThisMonth,
      previous: registrationsLastMonth,
      percentageChange: registrationChange
    },
    users: {
      current: usersThisMonth,
      previous: usersLastMonth,
      percentageChange: userChange
    }
  };
};

// Get top courses by registration count
export const getTopCourses = async (limit: number = 5): Promise<CourseAnalytics[]> => {
  try {
    const stats = await getDashboardStats();
    return stats.courseAnalytics.slice(0, limit);
  } catch (error) {
    console.error('Error fetching top courses:', error);
    return [];
  }
};

// Get average fill rate across all courses
export const getAverageFillRate = async (): Promise<number> => {
  try {
    const stats = await getDashboardStats();
    const coursesWithCapacity = stats.courseAnalytics.filter(c => c.maxCapacity > 0);
    
    if (coursesWithCapacity.length === 0) return 0;
    
    const totalFillRate = coursesWithCapacity.reduce((sum, course) => sum + course.fillRate, 0);
    return totalFillRate / coursesWithCapacity.length;
  } catch (error) {
    console.error('Error calculating average fill rate:', error);
    return 0;
  }
};

// Calculate weekly registration data for the last 7 days
const calculateWeeklyData = (registrationsSnapshot: any): WeeklyData[] => {
  const weeklyData: WeeklyData[] = [];
  const daysOfWeek = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  const today = new Date();
  
  // Initialize data for last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dayIndex = date.getDay();
    
    weeklyData.push({
      day: daysOfWeek[dayIndex],
      registrations: 0
    });
  }
  
  // Count registrations per day
  registrationsSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
    const registrationDate = doc.data().registrationDate?.toDate();
    if (registrationDate) {
      const daysDiff = Math.floor((today.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff >= 0 && daysDiff < 7) {
        const index = 6 - daysDiff;
        if (weeklyData[index]) {
          weeklyData[index].registrations++;
        }
      }
    }
  });
  
  return weeklyData;
};