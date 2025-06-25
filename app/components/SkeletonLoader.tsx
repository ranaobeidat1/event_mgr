import React from 'react';
import { View, Animated } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

const SkeletonItem: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 8,
  style = {}
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E5E7EB', '#F3F4F6'],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
};

export const AlertSkeleton = () => (
  <View className="bg-[#1A4782] p-4 mx-4 rounded-2xl mb-4">
    <SkeletonItem width="40%" height={20} style={{ marginBottom: 12 }} />
    {[1, 2, 3].map((i) => (
      <View key={i} className="bg-white rounded-2xl p-4 mb-3">
        <SkeletonItem width="70%" height={16} style={{ marginBottom: 8 }} />
        <SkeletonItem width="100%" height={14} style={{ marginBottom: 4 }} />
        <SkeletonItem width="85%" height={14} />
      </View>
    ))}
  </View>
);

export const CourseCircleSkeleton = () => (
  <View className="mx-4 mb-6 mt-2 space-y-4">
    {[1, 2, 3, 4].map((i) => (
      <View key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
        <View className="flex-row items-center">
          <SkeletonItem width={64} height={64} borderRadius={12} style={{ marginRight: 16 }} />
          <View className="flex-1">
            <SkeletonItem width="60%" height={18} style={{ marginBottom: 8 }} />
            <SkeletonItem width="80%" height={14} />
          </View>
          <SkeletonItem width={32} height={32} borderRadius={16} />
        </View>
      </View>
    ))}
  </View>
);

export const ClassListSkeleton = () => (
  <View className="flex flex-col gap-8 px-5">
    {[1, 2, 3, 4, 5].map((i) => (
      <View key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 w-full" style={{ direction: 'rtl' }}>
        <View className="flex-row items-center justify-between">
          <SkeletonItem width={48} height={48} borderRadius={24} style={{ marginRight: 16 }} />
          <View className="flex-1">
            <SkeletonItem width="70%" height={20} style={{ marginBottom: 12 }} />
            <SkeletonItem width="100%" height={14} style={{ marginBottom: 12 }} />
            <View className="flex-row gap-2 justify-end">
              <SkeletonItem width={100} height={24} borderRadius={12} />
              <SkeletonItem width={80} height={24} borderRadius={12} />
            </View>
          </View>
        </View>
      </View>
    ))}
  </View>
);

export const StatsSkeleton = () => (
  <View className="px-4">
    <SkeletonItem width="60%" height={24} style={{ marginBottom: 12 }} />
    
    <View className="flex-row flex-wrap -mx-1 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <View key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-3 flex-1 min-w-[45%] mx-1">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <SkeletonItem width="80%" height={14} style={{ marginBottom: 8 }} />
              <SkeletonItem width="50%" height={24} />
            </View>
            <SkeletonItem width={48} height={48} borderRadius={24} />
          </View>
        </View>
      ))}
    </View>
    
    <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
      <SkeletonItem width="40%" height={18} style={{ marginBottom: 16 }} />
      <SkeletonItem width="100%" height={200} borderRadius={8} />
    </View>
    
    {[1, 2, 3].map((i) => (
      <View key={i} className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-100">
        <View className="flex-row justify-between items-center mb-2">
          <SkeletonItem width="60%" height={16} />
          <SkeletonItem width="30%" height={14} />
        </View>
        <SkeletonItem width="100%" height={8} borderRadius={4} style={{ marginBottom: 4 }} />
        <SkeletonItem width="20%" height={12} />
      </View>
    ))}
  </View>
);

export default SkeletonItem;