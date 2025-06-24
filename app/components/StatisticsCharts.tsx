import React from 'react';
import { View, Text, Dimensions, ScrollView } from 'react-native';
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
} from 'react-native-chart-kit';
import { CourseAnalytics } from '../utils/statisticsUtils';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(26, 71, 130, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#1A4782',
  },
};

interface MonthlyGrowthChartProps {
  monthlyData: {
    registrations: { current: number; previous: number; percentageChange: number };
    users: { current: number; previous: number; percentageChange: number };
  };
}

export const MonthlyGrowthChart: React.FC<MonthlyGrowthChartProps> = ({ monthlyData }) => {
  const data = {
    labels: ['חודש קודם', 'חודש נוכחי'],
    datasets: [
      {
        data: [monthlyData.registrations.previous, monthlyData.registrations.current],
        color: (opacity = 1) => `rgba(248, 154, 30, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: [monthlyData.users.previous, monthlyData.users.current],
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ['רישומים', 'משתמשים'],
  };

  return (
    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
      <Text className="text-lg font-heebo-bold text-gray-900 mb-3">מגמות צמיחה חודשיות</Text>
      <LineChart
        data={data}
        width={screenWidth - 48}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
        fromZero
      />
    </View>
  );
};

interface CourseDistributionChartProps {
  courses: CourseAnalytics[];
}

export const CourseDistributionChart: React.FC<CourseDistributionChartProps> = ({ courses }) => {
  const topCourses = courses.slice(0, 5);
  const pieData = topCourses.map((course, index) => ({
    name: course.courseName.length > 15 ? course.courseName.substring(0, 15) + '...' : course.courseName,
    population: course.totalRegistrations,
    color: [
      '#1A4782',
      '#F89A1E',
      '#10b981',
      '#8b5cf6',
      '#ef4444'
    ][index],
    legendFontColor: '#7F7F7F',
    legendFontSize: 11,
  }));

  return (
    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
      <Text className="text-lg font-heebo-bold text-gray-900 mb-3">התפלגות רישומים לקורסים</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <PieChart
          data={pieData}
          width={screenWidth - 48}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          center={[10, 0]}
          absolute
        />
      </ScrollView>
    </View>
  );
};

interface FillRateChartProps {
  courses: CourseAnalytics[];
}

export const FillRateChart: React.FC<FillRateChartProps> = ({ courses }) => {
  const topCourses = courses.slice(0, 6);
  const data = {
    labels: topCourses.map(c => c.courseName.length > 10 ? c.courseName.substring(0, 10) + '...' : c.courseName),
    data: topCourses.map(c => c.fillRate / 100),
  };

  return (
    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
      <Text className="text-lg font-heebo-bold text-gray-900 mb-3">שיעור תפוסה לפי קורס</Text>
      <ProgressChart
        data={data}
        width={screenWidth - 48}
        height={220}
        strokeWidth={16}
        radius={32}
        chartConfig={{
          ...chartConfig,
          color: (opacity = 1, index?: number) => {
            if (typeof index === 'number' && index >= 0 && index < topCourses.length) {
              const fillRate = topCourses[index]?.fillRate || 0;
              if (fillRate > 80) return `rgba(248, 154, 30, ${opacity})`;
              if (fillRate > 60) return `rgba(16, 185, 129, ${opacity})`;
            }
            return `rgba(26, 71, 130, ${opacity})`;
          },
        }}
        hideLegend={false}
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />
    </View>
  );
};

interface ActivityBarChartProps {
  newRegistrations: number;
  activeUsers: number;
  alertsSent: number;
  totalPosts: number;
}

export const ActivityBarChart: React.FC<ActivityBarChartProps> = ({
  newRegistrations,
  activeUsers,
  alertsSent,
  totalPosts,
}) => {
  const data = {
    labels: ['רישומים', 'משתמשים', 'התראות', 'פוסטים'],
    datasets: [
      {
        data: [newRegistrations, activeUsers, alertsSent, totalPosts],
      },
    ],
  };

  return (
    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
      <Text className="text-lg font-heebo-bold text-gray-900 mb-3">סיכום פעילות</Text>
      <BarChart
        data={data}
        width={screenWidth - 48}
        height={220}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={{
          ...chartConfig,
          barPercentage: 0.7,
          decimalPlaces: 0,
        }}
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
        fromZero
        showValuesOnTopOfBars
      />
    </View>
  );
};

interface WeeklyTrendChartProps {
  weeklyData: { day: string; registrations: number }[];
}

export const WeeklyTrendChart: React.FC<WeeklyTrendChartProps> = ({ weeklyData }) => {
  const data = {
    labels: weeklyData.map(d => d.day),
    datasets: [
      {
        data: weeklyData.map(d => d.registrations),
        color: (opacity = 1) => `rgba(26, 71, 130, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  return (
    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
      <Text className="text-lg font-heebo-bold text-gray-900 mb-3">רישומים לפי יום בשבוע</Text>
      <LineChart
        data={data}
        width={screenWidth - 48}
        height={220}
        chartConfig={{
          ...chartConfig,
          backgroundColor: '#e26a00',
          backgroundGradientFrom: '#fb8c00',
          backgroundGradientTo: '#ffa726',
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
        fromZero
      />
    </View>
  );
};