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
  // ← new
  courseMonthlyRegistrations: CourseMonthlyRegistrations[];
  monthlyGrowth: MonthlyGrowth;
  weeklyData: WeeklyData[];
}

export interface CourseMonthlyRegistrations {
  courseId: string;
  monthlyRegistrations: number[]; // index 0 = Jan, …, 11 = Dec
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

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

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

    const totalUsers = usersSnapshot.size;
    const totalCourses = coursesSnapshot.size;
    const totalRegistrations = registrationsSnapshot.size;
    const totalPosts = postsSnapshot.size;
    const alertsSentThisMonth = alertsSnapshot.docs
      .filter(d => d.data().notificationSent === true).length;

    const newRegistrationsLast30Days = registrationsSnapshot.docs
      .filter(d => {
        const dt = d.data().registrationDate?.toDate();
        return dt && dt >= thirtyDaysAgo;
      }).length;

    const activeUsers = usersSnapshot.docs
      .filter(d => {
        const dt = d.data().createdAt?.toDate();
        return dt && dt >= thirtyDaysAgo;
      }).length;

    // 1) courseAnalytics
    const courseAnalytics = await getCourseAnalytics(coursesSnapshot, registrationsSnapshot);

    // 2) monthlyGrowth
    const monthlyGrowth = await calculateMonthlyGrowth(
      registrationsSnapshot,
      usersSnapshot,
      startOfMonth,
      startOfLastMonth,
      endOfLastMonth
    );

    // 3) weeklyData
    const weeklyData = calculateWeeklyData(registrationsSnapshot);

    // 4) courseMonthlyRegistrations
    const monthlyCounts: Record<string, number[]> = {};
    courseAnalytics.forEach(c => {
      monthlyCounts[c.courseId] = Array(12).fill(0);
    });
    registrationsSnapshot.docs.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
      const data = d.data();
      const cid = data.courseId;
      const dt = data.registrationDate?.toDate();
      if (cid && dt && monthlyCounts[cid]) {
        monthlyCounts[cid][dt.getMonth()]++;
      }
    });
    const courseMonthlyRegistrations: CourseMonthlyRegistrations[] =
      Object.entries(monthlyCounts).map(([courseId, arr]) => ({
        courseId, monthlyRegistrations: arr
      }));

    return {
      totalUsers,
      totalCourses,
      totalRegistrations,
      totalPosts,
      newRegistrationsLast30Days,
      activeUsers,
      alertsSentThisMonth,
      courseAnalytics,
      courseMonthlyRegistrations,
      monthlyGrowth,
      weeklyData
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

const getCourseAnalytics = async (
  coursesSnapshot: any,
  registrationsSnapshot: any
): Promise<CourseAnalytics[]> => {
  const map = new Map<string, CourseAnalytics>();
  coursesSnapshot.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
    const data = d.data();
    map.set(d.id, {
      courseId: d.id,
      courseName: data.name || 'Unknown Course',
      totalRegistrations: 0,
      maxCapacity: data.maxCapacity || 0,
      fillRate: 0
    });
  });
  registrationsSnapshot.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
    const cid = d.data().courseId;
    if (map.has(cid)) {
      map.get(cid)!.totalRegistrations++;
    }
  });
  const arr = Array.from(map.values());
  arr.forEach(c => {
    if (c.maxCapacity > 0) {
      c.fillRate = (c.totalRegistrations / c.maxCapacity) * 100;
    }
  });
  arr.sort((a, b) => b.fillRate - a.fillRate);
  return arr;
};

const calculateMonthlyGrowth = async (
  regSnap: any,
  userSnap: any,
  startOfMonth: Date,
  startOfLastMonth: Date,
  endOfLastMonth: Date
): Promise<MonthlyGrowth> => {
  const regsThis = regSnap.docs.filter((d: any) => {
    const dt = d.data().registrationDate?.toDate();
    return dt && dt >= startOfMonth;
  }).length;
  const regsLast = regSnap.docs.filter((d: any) => {
    const dt = d.data().registrationDate?.toDate();
    return dt && dt >= startOfLastMonth && dt <= endOfLastMonth;
  }).length;
  const usersThis = userSnap.docs.filter((d: any) => {
    const dt = d.data().createdAt?.toDate();
    return dt && dt >= startOfMonth;
  }).length;
  const usersLast = userSnap.docs.filter((d: any) => {
    const dt = d.data().createdAt?.toDate();
    return dt && dt >= startOfLastMonth && dt <= endOfLastMonth;
  }).length;

  const pct = (curr: number, prev: number) =>
    prev > 0 ? ((curr - prev) / prev) * 100 : 0;

  return {
    registrations: {
      current: regsThis,
      previous: regsLast,
      percentageChange: pct(regsThis, regsLast)
    },
    users: {
      current: usersThis,
      previous: usersLast,
      percentageChange: pct(usersThis, usersLast)
    }
  };
};

const calculateWeeklyData = (regSnap: any): WeeklyData[] => {
  const days = ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'];
  const today = new Date();
  const week: WeeklyData[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    week.push({ day: days[d.getDay()], registrations: 0 });
  }
  regSnap.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
    const dt = d.data().registrationDate?.toDate();
    if (dt) {
      const diff = Math.floor((today.getTime() - dt.getTime()) / (1000*60*60*24));
      if (diff >= 0 && diff < 7) {
        week[6 - diff].registrations++;
      }
    }
  });
  return week;
};
