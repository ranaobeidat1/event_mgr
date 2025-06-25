// app/(tabs)/classes.tsx
import React, { useEffect, useState } from "react";
import { 
  ScrollView, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity,
  TextInput,
  I18nManager,
  Platform
} from "react-native";
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../../FirebaseConfig";
import { getUser } from "../utils/firestoreUtils";
import { useAuth } from "../_layout";
import { ClassListSkeleton } from "../components/SkeletonLoader";
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  interpolate,
  FadeIn,
  FadeInDown,
  FadeOut,
  ZoomIn,
  runOnJS,
  Extrapolation
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { ModernEditButton, ModernDeleteButton } from '../components/ModernActionButtons';

// Force RTL layout
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);


// Define interface for user data
interface UserData {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  createdAt?: any;
}

interface ClassData {
  id: string;
  name: string;
  description?: string;
  location?: string;
  schedule?: string;
  payment?: string;
  maxCapacity?: number;
}

// Modern gradient color schemes
const GRADIENT_COLORS = [
 
  ['#1A4782', '#1A4782'] as const, // Blue-cyan
 
] as const;

// Modern card component with glassmorphism
const ModernClassCard = ({ cls, index, onPress, isAdmin, onEdit, onDelete }: { 
  cls: ClassData; 
  index: number; 
  onPress: () => void;
  isAdmin: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) => {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const translateY = useSharedValue(0);
  
  const gradientColors = GRADIENT_COLORS[index % GRADIENT_COLORS.length];

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotate.value}deg` },
        { translateY: translateY.value }
      ],
    };
  });

  const handlePressIn = () => {
    'worklet';
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    rotate.value = withSpring(-1, { damping: 15, stiffness: 300 });
    translateY.value = withSpring(2, { damping: 15, stiffness: 300 });
    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    'worklet';
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    rotate.value = withSpring(0, { damping: 15, stiffness: 300 });
    translateY.value = withSpring(0, { damping: 15, stiffness: 300 });
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      style={[animatedStyle, { marginBottom: 16 }]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          borderRadius: 24,
          overflow: 'hidden',
          backgroundColor: 'white',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 12,
        }}
      >
        {/* Gradient Background */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            opacity: 0.08,
          }}
        />
        
        {/* Glass effect overlay */}
        {Platform.OS === 'ios' && (
          <BlurView
            intensity={20}
            tint="light"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            }}
          />
        )}
        
        <View style={{ 
          padding: 24,
          backgroundColor: Platform.OS === 'ios' ? '#1A4782' : '#1A4782',
        }}>
          {/* Admin buttons */}
          {isAdmin && (
            <View style={{
              position: 'absolute',
              top: 16,
              right: 16,
              flexDirection: 'row',
              gap: 8,
              zIndex: 10,
            }}>
              <ModernEditButton 
                onPress={onEdit || (() => {})} 
                size="small"
              />
              <ModernDeleteButton 
                onPress={onDelete || (() => {})} 
                size="small"
              />
            </View>
          )}
          
          <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-start' }}>
            {/* Gradient Icon Circle */}
     
            
        
            
            {/* Content */}
            <View style={{ flex: 1 }}>
              {/* Course Name with gradient text effect */}
              <Text 
                style={{
                  fontSize: 30,
                  fontWeight: '800',
                  color: 'white',
                  textAlign: 'left',
                  marginBottom: 8,
                  fontFamily: 'Heebo-ExtraBold',
                  letterSpacing: -0.5,
                }}
              >
                {cls.name}
              </Text>
              
              {/* Description with modern styling */}
              {cls.description && (
                <Text 
                  style={{
                    fontSize: 22,
                    color: 'white',
                    textAlign: 'left',
                    marginBottom: 16,
                    marginRight: 1,
                    lineHeight: 24,
                    fontFamily: 'Heebo-Regular',
                  }}
                  numberOfLines={2}
                >
                  {cls.description}
                </Text>
              )}
              
              {/* Modern Tags with glassmorphism */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {cls.location && (
                  <View 
                    style={{
                      backgroundColor: 'white',
                      borderRadius: 20,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#1A4782',
                    }}
                  >
                    <Text 
                      style={{
                        color: '#1A4782',
                        fontWeight: '600',
                        fontSize: 14,
                        marginLeft: 6,
                        fontFamily: 'Heebo-SemiBold',
                      }}
                    >
                      {cls.location}
                    </Text>
                    <Ionicons name="location" size={16} color="#1A4782" />
                  </View>
                )}
                
           
              </View>
            </View>
            
            {/* Arrow with animation */}
            <Animated.View
              style={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: [{ translateY: -12 }],
              }}
            >
              <View 
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: 'white',
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="chevron-back" size={20} color="#4a5568" />
              </View>
            </Animated.View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function Index() {
  const { isGuest } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ClassData[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Animation values - must be at top level
  const scrollY = useSharedValue(0);
  const fabScale = useSharedValue(0);

  // Animation effects
  useEffect(() => {
    fabScale.value = withSpring(1, { damping: 15, stiffness: 150 });
  }, [fabScale]);

  const fabAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: fabScale.value },
        { translateY: interpolate(
          scrollY.value,
          [0, 100],
          [0, -10],
          Extrapolation.CLAMP
        )}
      ],
    };
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollY.value,
        [0, 50],
        [1, 0.8],
        Extrapolation.CLAMP
      ),
      transform: [{
        translateY: interpolate(
          scrollY.value,
          [0, 100],
          [0, -20],
          Extrapolation.CLAMP
        )
      }]
    };
  });

  // Filter classes based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredClasses(classes);
    } else {
      const filtered = classes.filter(cls => {
        const nameMatch = cls.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const descriptionMatch = cls.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const locationMatch = cls.location?.toLowerCase().includes(searchQuery.toLowerCase());
        const scheduleMatch = cls.schedule?.toLowerCase().includes(searchQuery.toLowerCase());
        return nameMatch || descriptionMatch || locationMatch || scheduleMatch;
      });
      setFilteredClasses(filtered);
    }
  }, [classes, searchQuery]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if current user is admin (only for authenticated users, not guests)
        if (!isGuest) {
          const user = auth.currentUser;
          if (user) {
            const userData = await getUser(user.uid) as UserData;
            setIsAdmin(userData?.role === "admin");
          }
        }

        // Fetch classes from Firestore (both guests and authenticated users can see classes)
        const querySnapshot = await getDocs(collection(db, "courses"));
        const coursesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          description: doc.data().description,
          location: doc.data().location,
          schedule: doc.data().schedule,
          payment: doc.data().payment,
          maxCapacity: doc.data().maxCapacity,
        }));
        
        setClasses(coursesList);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isGuest]);

  if (loading) {
    return (
      <LinearGradient
        colors={['#f8fafc', '#f1f5f9', '#e2e8f0']}
        style={{ flex: 1, direction: 'rtl' }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>

            
            <View style={{ marginBottom: 24 }}>
              <View 
                style={{
                  backgroundColor: '#1A4782',
                  borderRadius: 24,
                  height: 60,
                  borderWidth: 1,
                  borderColor: 'rgba(0,0,0,0.05)',
                }}
              />
            </View>
            
            <ClassListSkeleton />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#f8fafc', '#f1f5f9', '#e2e8f0']}
      style={{ flex: 1, direction: 'rtl' }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {isAdmin && (
          <Animated.View
            style={[
              fabAnimatedStyle,
              {
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 10,
              }
            ]}
          >
            <TouchableOpacity
              className="w-14 h-14 bg-[#1A4782] rounded-full items-center justify-center"
              style={{
                shadowColor: '#1A4782',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 8,
              }}
              onPress={() => router.push("/add-class")}
              activeOpacity={0.8}
            >
              <Text className="text-white text-3xl font-heebo-bold">+</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View className="pt-6 pb-4">
          <Text className="text-3xl font-heebo-bold text-center mt-5 text-primary">
            חוגים
          </Text>
        </View>
              
   

        <Animated.ScrollView 
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          onScroll={(event) => {
            scrollY.value = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
      

          {/* Modern Search Box with Glassmorphism */}
          <Animated.View 
            entering={FadeInDown.delay(200).springify()}
            style={{ marginBottom: 24 }}
          >
            <View 
              style={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: 24,
                borderWidth: 1,
                borderColor: 'rgba(0,0,0,0.05)',
                overflow: 'hidden',
              }}
            >
              {Platform.OS === 'ios' && (
                <BlurView
                  intensity={80}
                  tint="light"
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                  }}
                />
              )}
              
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 }}>
                <TextInput
                  placeholder="חפש חוגים..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={{ 
                    flex: 1,
                    paddingVertical: 18,
                    fontSize: 17,
                    color: '#1e293b',
                    textAlign: 'right',
                    fontFamily: 'Heebo-Regular',
                  }}
                />
                
                <View style={{ marginRight: 12 }}>
                  <Ionicons name="search" size={22} color="#64748b" />
                </View>
                
                {searchQuery.trim() !== "" && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery("");
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={{
                      position: 'absolute',
                      left: 20,
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: 'rgba(0,0,0,0.05)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="close" size={18} color="#64748b" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Animated.View>

          {/* Search Results Counter with Animation */}
          {searchQuery.trim() !== "" && (
            <Animated.View 
              entering={FadeIn}
              exiting={FadeOut}
              style={{ marginBottom: 16 }}
            >
              <Text 
                style={{
                  fontSize: 15,
                  color: '#64748b',
                  fontFamily: 'Heebo-Medium',
                  textAlign: 'left',
                }}
              >
                נמצאו {filteredClasses.length} חוגים
              </Text>
            </Animated.View>
          )}

          {/* Classes List with Modern Cards */}
          <View>
            {filteredClasses.length > 0 ? (
              filteredClasses.map((cls, index) => (
                <ModernClassCard
                  key={cls.id}
                  cls={cls}
                  index={index}
                  onPress={() => router.push(`/classes/${cls.id}`)}
                  isAdmin={isAdmin}
                  onEdit={() => {
                    // TODO: Navigate to edit page
                    router.push(`/edit-class/${cls.id}`);
                  }}
                  onDelete={() => {
                    // TODO: Implement delete functionality
                    console.log('Delete class:', cls.id);
                  }}
                />
              ))
            ) : (
              <Animated.View
                entering={ZoomIn.springify()}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 24,
                  padding: 48,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.08,
                  shadowRadius: 16,
                  elevation: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(0,0,0,0.05)',
                }}
              >
                {/* Animated Empty State Icon */}
                <Animated.View
                  entering={FadeInDown.delay(200).springify()}
                  style={{
                    width: 100,
                    height: 100,
                    marginBottom: 24,
                  }}
                >
                  <LinearGradient
                    colors={['#e0e7ff', '#c7d2fe']}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 50,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="school-outline" size={48} color="#6366f1" />
                  </LinearGradient>
                </Animated.View>
                
                <Animated.Text 
                  entering={FadeInDown.delay(300).springify()}
                  style={{
                    fontSize: 24,
                    fontWeight: '800',
                    color: '#1e293b',
                    marginBottom: 12,
                    textAlign: 'center',
                    fontFamily: 'Heebo-ExtraBold',
                  }}
                >
                  {searchQuery.trim() !== "" ? "לא נמצאו תוצאות" : "אין חוגים זמינים"}
                </Animated.Text>
                
                <Animated.Text 
                  entering={FadeInDown.delay(400).springify()}
                  style={{
                    fontSize: 16,
                    color: '#64748b',
                    textAlign: 'center',
                    lineHeight: 24,
                    fontFamily: 'Heebo-Regular',
                    paddingHorizontal: 20,
                  }}
                >
                  {searchQuery.trim() !== "" 
                    ? "נסה לחפש במילים אחרות או נקה את החיפוש"
                    : "חוגים חדשים יתווספו בקרוב"
                  }
                </Animated.Text>
                
                {searchQuery.trim() !== "" && (
                  <Animated.View entering={FadeInDown.delay(500).springify()}>
                    <TouchableOpacity
                      onPress={() => {
                        setSearchQuery("");
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={{ marginTop: 24 }}
                    >
                      <LinearGradient
                        colors={['#1A4782', '#2563eb']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          paddingHorizontal: 28,
                          paddingVertical: 14,
                          borderRadius: 16,
                          shadowColor: '#1A4782',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.2,
                          shadowRadius: 8,
                          elevation: 6,
                        }}
                      >
                        <Text style={{
                          color: 'white',
                          fontSize: 16,
                          fontWeight: '600',
                          fontFamily: 'Heebo-SemiBold',
                        }}>
                          נקה חיפוש
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </Animated.View>
            )}
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}