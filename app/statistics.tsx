import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../FirebaseConfig';
import { getUser } from './utils/firestoreUtils';
import { getDashboardStats, DashboardStats, CourseAnalytics } from './utils/statisticsUtils';

export default function Statistics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [, setIsAdmin] = useState(false);
  const [showAllCourses, setShowAllCourses] = useState(false);

  useEffect(() => {
    checkAdminAndFetchStats();
  }, []);

  const checkAdminAndFetchStats = async () => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          const userData = await getUser(user.uid);
          if (userData?.role === 'admin') {
            setIsAdmin(true);
            await fetchStatistics();
          } else {
            Alert.alert('אין הרשאה', 'עמוד זה זמין למנהלים בלבד');
            router.back();
          }
        } else {
          router.replace('/login');
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error checking admin status:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בטעינת הנתונים');
    }
  };

  const fetchStatistics = async () => {
    try {
      const dashboardStats = await getDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      Alert.alert('שגיאה', 'לא ניתן לטעון את הנתונים הסטטיסטיים');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStatistics();
  };

  const StatCard = ({ title, value, icon, iconFamily, color = '#1A4782' }: any) => (
    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-3 flex-1 min-w-[45%] mx-1">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-gray-600 text-sm font-heebo-regular">{title}</Text>
          <Text className="text-2xl font-heebo-bold text-gray-900 mt-1">{value}</Text>
        </View>
        <View className={`w-12 h-12 rounded-full items-center justify-center`} style={{ backgroundColor: `${color}20` }}>
          {iconFamily === 'FontAwesome' && <FontAwesome name={icon} size={20} color={color} />}
          {iconFamily === 'MaterialIcons' && <MaterialIcons name={icon} size={20} color={color} />}
          {iconFamily === 'Ionicons' && <Ionicons name={icon} size={20} color={color} />}
        </View>
      </View>
    </View>
  );

  const ProgressBar = ({ progress, color = '#1A4782' }: { progress: number; color?: string }) => (
    <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <View 
        className="h-full rounded-full" 
        style={{ 
          width: `${Math.min(progress, 100)}%`,
          backgroundColor: progress > 80 ? '#F89A1E' : color 
        }} 
      />
    </View>
  );

  const CourseCard = ({ course }: { course: CourseAnalytics }) => (
    <View className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="font-heebo-medium text-gray-900 flex-1" numberOfLines={1}>
          {course.courseName}
        </Text>
        <Text className="font-heebo-regular text-sm text-gray-600 ml-2">
          {course.totalRegistrations}/{course.maxCapacity}
        </Text>
      </View>
      <ProgressBar progress={course.fillRate} />
      <Text className="text-xs text-gray-500 mt-1 font-heebo-regular text-right">
        {course.fillRate.toFixed(0)}% תפוסה
      </Text>
    </View>
  );

  const TrendIndicator = ({ value, type }: { value: number; type: string }) => {
    const isPositive = value >= 0;
    const color = isPositive ? '#10b981' : '#ef4444';
    const icon = isPositive ? 'trending-up' : 'trending-down';
    
    return (
      <View className="flex-row items-center">
        <MaterialIcons name={icon} size={16} color={color} />
        <Text style={{ color }} className="font-heebo-medium text-sm ml-1">
          {Math.abs(value).toFixed(1)}%
        </Text>
        <Text className="text-gray-600 text-sm font-heebo-regular ml-1">{type}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#1A4782" />
        <Text className="mt-2 text-gray-600 font-heebo-regular">טוען נתונים...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-gray-600 font-heebo-regular">לא נמצאו נתונים</Text>
      </View>
    );
  }

  const averageFillRate = stats.courseAnalytics.length > 0
    ? stats.courseAnalytics.reduce((sum, course) => sum + course.fillRate, 0) / stats.courseAnalytics.length
    : 0;

  const averageRegistrationsPerCourse = stats.totalCourses > 0
    ? (stats.totalRegistrations / stats.totalCourses).toFixed(1)
    : '0';

  return (
    <ScrollView 
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View className="bg-[#1A4782] px-4 pt-12 pb-6">
        <Text className="text-white text-2xl font-heebo-bold text-center">
          לוח בקרה סטטיסטי
        </Text>
        <Text className="text-white/80 text-sm font-heebo-regular text-center mt-1">
          סקירה כללית של הנתונים
        </Text>
      </View>

      <View className="px-4 -mt-0.5">
        {/* Overview Cards */}
        <Text className="text-lg font-heebo-bold text-gray-900 mb-3">סקירה כללית</Text>
        <View className="flex-row flex-wrap -mx-1">
          <StatCard 
            title="סה״כ משתמשים" 
            value={stats.totalUsers} 
            icon="users" 
            iconFamily="FontAwesome"
            color="#1A4782"
          />
          <StatCard 
            title="סה״כ קורסים" 
            value={stats.totalCourses} 
            icon="book" 
            iconFamily="FontAwesome"
            color="#10b981"
          />
          <StatCard 
            title="סה״כ רישומים לקורסים"
            value={stats.totalRegistrations} 
            icon="check-circle" 
            iconFamily="FontAwesome"
            color="#F89A1E"
          />
          <StatCard 
            title="פוסטים שפורסמו" 
            value={stats.totalPosts} 
            icon="image" 
            iconFamily="FontAwesome"
            color="#8b5cf6"
          />
        </View>

        {/* Activity Metrics */}
        <Text className="text-lg font-heebo-bold text-gray-900 mb-3 mt-6">מדדי פעילות</Text>
        <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
          <View className="mb-3">
            <Text className="text-gray-600 text-sm font-heebo-regular">רישומים לקורסים ב-30 הימים האחרונים</Text>
            <Text className="text-xl font-heebo-bold text-gray-900">{stats.newRegistrationsLast30Days}</Text>
          </View>
          <View className="mb-3">
            <Text className="text-gray-600 text-sm font-heebo-regular">משתמשים פעילים (נרשמו לאחרונה)</Text>
            <Text className="text-xl font-heebo-bold text-gray-900">{stats.activeUsers}</Text>
          </View>
          <View>
            <Text className="text-gray-600 text-sm font-heebo-regular">התראות שנשלחו החודש</Text>
            <Text className="text-xl font-heebo-bold text-gray-900">{stats.alertsSentThisMonth}</Text>
          </View>
        </View>

        {/* Course Analytics */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-heebo-bold text-gray-900">ניתוח קורסים</Text>
          <TouchableOpacity
            onPress={() => setShowAllCourses(!showAllCourses)}
            className="bg-[#1A4782] px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-heebo-medium text-sm">
              {showAllCourses ? 'הצג 5 מובילים' : 'הצג הכל'}
            </Text>
          </TouchableOpacity>
        </View>
        {(showAllCourses ? stats.courseAnalytics : stats.courseAnalytics.slice(0, 5)).map((course) => (
          <CourseCard key={course.courseId} course={course} />
        ))}

        {/* Quick Insights */}
        <Text className="text-lg font-heebo-bold text-gray-900 mb-3 mt-6">תובנות מהירות</Text>
        <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <View className="mb-4">
            <Text className="text-gray-600 text-sm font-heebo-regular">שיעור מילוי ממוצע</Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-2xl font-heebo-bold text-gray-900">{averageFillRate.toFixed(1)}%</Text>
              <View className="ml-3 flex-1">
                <ProgressBar progress={averageFillRate} color="#1A4782" />
              </View>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-gray-600 text-sm font-heebo-regular mb-2">מגמות צמיחה חודשיות</Text>
            <View className="space-y-2">
              <TrendIndicator 
                value={stats.monthlyGrowth.registrations.percentageChange} 
                type="רישומים"
              />
              <TrendIndicator 
                value={stats.monthlyGrowth.users.percentageChange} 
                type="משתמשים"
              />
            </View>
          </View>

          <View>
            <Text className="text-gray-600 text-sm font-heebo-regular">ממוצע רישומים לקורס</Text>
            <Text className="text-2xl font-heebo-bold text-gray-900 mt-1">{averageRegistrationsPerCourse}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}