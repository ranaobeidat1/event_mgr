import React from 'react';
import { View, Text, Dimensions, ScrollView } from 'react-native';
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart
} from 'react-native-chart-kit';
import { CourseAnalytics } from '../utils/statisticsUtils';

const screenWidth = Dimensions.get('window').width - 48;

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(26, 71, 130, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: { r: '6', strokeWidth: '2', stroke: '#1A4782' },
};

export const MonthlyGrowthChart = ({ monthlyData }: {
  monthlyData: { registrations: { current: number; previous: number; percentageChange: number };
                 users: { current: number; previous: number; percentageChange: number }}
}) => {
  const data = {
    labels: ['חודש קודם', 'חודש נוכחי'],
    datasets: [
      {
        data: [monthlyData.registrations.previous, monthlyData.registrations.current],
        color: (o = 1) => `rgba(248,154,30,${o})`,
        strokeWidth: 2,
      },
      {
        data: [monthlyData.users.previous, monthlyData.users.current],
        color: (o = 1) => `rgba(16,185,129,${o})`,
        strokeWidth: 2,
      },
    ],
    legend: ['רישומים', 'משתמשים'],
  };

  return (
    <View className="bg-white rounded-xl p-4 shadow-sm border-gray-100 mb-4">
      <Text className="text-lg font-heebo-bold text-gray-900 mb-3 text-right">
        מגמות צמיחה חודשיות
      </Text>
      <LineChart
        data={data}
        width={screenWidth}
        height={220}
        chartConfig={chartConfig}
        bezier
        fromZero
        style={{ marginVertical: 8, borderRadius: 16 }}
      />
    </View>
  );
};

export const CourseDistributionChart = ({ courses }: {
  courses: CourseAnalytics[]
}) => {
  const top5 = courses.slice(0, 5);
  const pieData = top5.map((c, i) => ({
    name: c.courseName.length > 15
      ? c.courseName.slice(0, 15) + '…'
      : c.courseName,
    population: c.totalRegistrations,
    color: ['#1A4782','#F89A1E','#10b981','#8b5cf6','#ef4444'][i],
    legendFontColor: '#7F7F7F',
    legendFontSize: 11
  }));

  return (
    <View className="bg-white rounded-xl p-4 shadow-sm border-gray-100 mb-4">
      <Text className="text-lg font-heebo-bold text-gray-900 mb-3 text-right">
        התפלגות רישומים לקורסים
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <PieChart
          data={pieData}
          width={screenWidth}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </ScrollView>
    </View>
  );
};

export const FillRateChart = ({ courses }: {
  courses: CourseAnalytics[]
}) => {
  const top6 = courses.slice(0, 6);
  const data = {
    labels: top6.map(c =>
      c.courseName.length > 10
        ? c.courseName.slice(0, 10) + '…'
        : c.courseName
    ),
    data: top6.map(c => c.fillRate / 100)
  };

  return (
    <View className="bg-white rounded-xl p-4 shadow-sm border-gray-100 mb-4">
      <Text className="text-lg font-heebo-bold text-gray-900 mb-3 text-right">
        שיעור תפוסה לפי קורס
      </Text>
      <ProgressChart
        data={data}
        width={screenWidth}
        height={220}
        strokeWidth={16}
        radius={32}
        chartConfig={{
          ...chartConfig,
          color: (o = 1, i?: number) => {
            if (i != null) {
              const fr = top6[i].fillRate;
              if (fr > 80) return `rgba(248,154,30,${o})`;
              if (fr > 60) return `rgba(16,185,129,${o})`;
            }
            return `rgba(26,71,130,${o})`;
          }
        }}
        hideLegend={false}
        style={{ marginVertical: 8, borderRadius: 16 }}
      />
    </View>
  );
};

export const ActivityBarChart = ({
  newRegistrations,
  activeUsers,
  alertsSent,
  totalPosts
}: {
  newRegistrations: number;
  activeUsers: number;
  alertsSent: number;
  totalPosts: number;
}) => {
  const data = {
    labels: ['רישומים', 'משתמשים', 'התראות', 'פוסטים'],
    datasets: [{ data: [newRegistrations, activeUsers, alertsSent, totalPosts] }]
  };

  return (
    <View className="bg-white rounded-xl p-4 shadow-sm border-gray-100 mb-4">
      <Text className="text-lg font-heebo-bold text-gray-900 mb-3 text-right">
        סיכום פעילות
      </Text>
      <BarChart
        data={data}
        width={screenWidth}
        height={220}
        chartConfig={{ ...chartConfig, barPercentage: 0.7 }}
        style={{ marginVertical: 8, borderRadius: 16 }}
        fromZero
        showValuesOnTopOfBars
        yAxisLabel=""
        yAxisSuffix=""
      />
    </View>
  );
};

export const WeeklyTrendChart = ({ weeklyData }: {
  weeklyData: { day: string; registrations: number }[]
}) => {
  const data = {
    labels: weeklyData.map(d => d.day),
    datasets: [{ data: weeklyData.map(d => d.registrations) }]
  };

  return (
    <View className="bg-white rounded-xl p-4 shadow-sm border-gray-100 mb-4">
      <Text className="text-lg font-heebo-bold text-gray-900 mb-3 text-right">
        רישומים לפי יום בשבוע
      </Text>
      <LineChart
        data={data}
        width={screenWidth}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={{ marginVertical: 8, borderRadius: 16 }}
        fromZero
      />
    </View>
  );
};

// ← NEW: monthly registrations chart
export const MonthlyRegistrationChart = ({ monthlyData }: {
  monthlyData: number[]
}) => {
  return (
    <View className="bg-white rounded-xl p-4 shadow-sm border-gray-100 mb-6">
      <Text className="text-lg font-heebo-bold text-gray-900 mb-3 text-right">
        רישומים חודשיים
      </Text>
      <LineChart
        data={{
          labels: ['1','2','3','4','5','6','7','8','9','10','11','12'],
          datasets: [{ data: monthlyData }],
        }}
        width={screenWidth}
        height={220}
        chartConfig={chartConfig}
        fromZero
        style={{ borderRadius: 16 }}
      />
    </View>
  );
};
