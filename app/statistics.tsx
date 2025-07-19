import React, { useEffect, useState, useCallback } from 'react';
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
import { FontAwesome } from '@expo/vector-icons';
import { auth } from '../FirebaseConfig';
import { getUser } from './utils/firestoreUtils';
import {
  getDashboardStats,
  DashboardStats,
  CourseAnalytics
} from './utils/statisticsUtils';
import { CourseDistributionChart, MonthlyRegistrationChart } from './components/StatisticsCharts';
import { Picker } from '@react-native-picker/picker';

export default function Statistics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // --- CHANGE #1: Proper useEffect for auth and initial data fetching ---
  useEffect(() => {
    // Set up the listener and clean it up when the component unmounts
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        if (user) {
          const userData = await getUser(user.uid);
          if (userData?.role === 'admin') {
            await fetchStatistics(); // Initial fetch
          } else {
            Alert.alert('גישה נדחתה', 'רק מנהלים רשאים לצפות בדף זה');
            router.replace('/(tabs)');
          }
        } else {
          router.replace('/login');
        }
      } catch (error) {
        console.error("Error during auth check:", error);
        Alert.alert('שגיאה', 'אירעה שגיאה באימות המשתמש.');
        setLoading(false);
      }
    });

    // Cleanup function: this is called when the component is unmounted
    return () => unsubscribe();
  }, []);

  // --- CHANGE #2: Safer way to set the initial picker value ---
  useEffect(() => {
    // Set the selected course ID only if it hasn't been set yet and stats are available
    if (!selectedCourseId && stats?.courseAnalytics && stats.courseAnalytics.length > 0) {
      setSelectedCourseId(stats.courseAnalytics[0].courseId);
    }
  }, [stats, selectedCourseId]);

  const fetchStatistics = async () => {
    try {
      const dashboardStats = await getDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      Alert.alert('שגיאה', 'לא ניתן לטעון את הנתונים הסטטיסטיים');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Use useCallback to memoize the onRefresh function
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStatistics();
  }, []);

  const StatCard = ({ title, value, icon, color = '#1A4782' }: any) => (
    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-3 flex-1 min-w-[45%] mx-1">
      <View className="flex-row-reverse items-center justify-between">
        <View className="flex-1">
          <Text className="text-gray-600 text-sm font-heebo-regular">{title}</Text>
          <Text className="text-2xl font-heebo-bold text-gray-900 mt-1">{value}</Text>
        </View>
        <View
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <FontAwesome name={icon} size={20} color={color} />
        </View>
      </View>
    </View>
  );

  const ProgressBar = ({ progress, color = '#1A4782' }: { progress: number; color?: string }) => (
    <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <View
        className="h-full rounded-full"
        style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: color }}
      />
    </View>
  );

  const CourseCard = ({ course }: { course: CourseAnalytics }) => (
    <View className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row-reverse justify-between items-center mb-2">
        <Text className="font-heebo-medium text-gray-900 flex-1 text-right" numberOfLines={1}>
          {course.courseName}
        </Text>
        <Text className="font-heebo-regular text-sm text-gray-600 mr-2">
          {course.totalRegistrations}/{course.maxCapacity}
        </Text>
      </View>
      <ProgressBar progress={course.fillRate} />
      <Text className="text-xs text-gray-500 mt-1 font-heebo-regular text-right">
        {course.fillRate.toFixed(0)}% תפוסה
      </Text>
    </View>
  );

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
      <View className="flex-1 bg-gray-50 justify-center items-center p-4">
        <Text className="text-gray-600 font-heebo-regular text-center">לא נמצאו נתונים סטטיסטיים.</Text>
        <Text className="text-gray-500 font-heebo-regular text-center mt-2">נסה לרענן את הדף על ידי גרירה למטה.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1A4782"]} tintColor={"#1A4782"}/>}
    >
      <View className="bg-[#1A4782] px-4 pt-12 pb-6">
        <Text className="text-white text-2xl font-heebo-bold text-center">
          לוח בקרה סטטיסטי
        </Text>
        <Text className="text-white/80 text-sm font-heebo-regular text-center mt-1">
          סקירה כללית של הנתונים
        </Text>
      </View>

      <View className="p-4">
        <Text className="text-lg font-heebo-bold text-gray-900 mb-3 text-right">סקירה כללית</Text>
        <View className="flex-row-reverse flex-wrap -mx-1">
          <StatCard title="סה״כ משתמשים" value={stats.totalUsers} icon="users" color="#1A4782" />
          <StatCard title="סה״כ קורסים" value={stats.totalCourses} icon="book" color="#10b981" />
          <StatCard
            title="סה״כ רישומים"
            value={stats.totalRegistrations}
            icon="check-circle"
            color="#F89A1E"
          />
          <StatCard title="פוסטים שפורסמו" value={stats.totalPosts} icon="image" color="#8b5cf6" />
        </View>

        <View className="flex-row-reverse justify-between items-center mb-3 mt-6">
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
        {(showAllCourses ? stats.courseAnalytics : stats.courseAnalytics.slice(0, 5)).map(c => (
          <CourseCard key={c.courseId} course={c} />
        ))}

        <CourseDistributionChart courses={stats.courseAnalytics} />

        <View className="mt-6">
          <Text className="text-lg font-heebo-bold text-gray-900 mb-2 text-right">
            רישומים חודשיים
          </Text>
          {selectedCourseId && (
            <>
              <View className="bg-white rounded-lg mb-4 border border-gray-100">
                <Picker
                  selectedValue={selectedCourseId}
                  onValueChange={(itemValue) => setSelectedCourseId(itemValue)}
                  mode="dropdown"
                >
                  {stats.courseAnalytics.map(c => (
                    <Picker.Item
                      key={c.courseId}
                      label={c.courseName}
                      value={c.courseId}
                    />
                  ))}
                </Picker>
              </View>
              <MonthlyRegistrationChart
                monthlyData={
                  stats.courseMonthlyRegistrations.find(r => r.courseId === selectedCourseId)
                    ?.monthlyRegistrations || Array(12).fill(0)
                }
              />
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}