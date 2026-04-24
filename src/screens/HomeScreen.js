import React, { useContext } from 'react';
import {
  View, Text, Pressable, ScrollView, useColorScheme, Image, Linking, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Sun,
  Moon,
  HeartHandshake,
  School,
  ShieldUser,
  UsersRound,
  ChevronRight,
  HelpCircle,
  Mail,
  BadgeCheck,
  GraduationCap,
  Shield,
} from 'lucide-react-native';
import { NavigationContext } from '../context/NavigationContext';
import { AuthContext } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';

// --- Card Component ---
const LoginCard = ({ icon: Icon, title, subtitle, color = '#64748b', onPress, darkMode, disabled }) => {
  const scale = useSharedValue(1);
  const shadow = useSharedValue(0.05);
  const glow = useSharedValue(0);

  const { lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;
  const activeColor = color || '#64748b';

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: shadow.value,
    borderColor: glow.value === 0 ? colors.border : `${activeColor}66`,
    borderWidth: glow.value === 0 ? 1 : 2,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
    shadow.value = withSpring(0.15);
    glow.value = withTiming(1, { duration: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    shadow.value = withSpring(0.05);
    glow.value = withTiming(0, { duration: 200 });
  };

  return (
    <Pressable
      onPress={disabled ? null : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className="flex-1"
    >
      <Animated.View
        className="p-6 rounded-[28px] items-center justify-center overflow-hidden"
        style={[
          animatedStyle,
          {
            backgroundColor: colors.cardBg,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowRadius: 24,
            elevation: 4,
            opacity: disabled ? 0.4 : 1,
            height: 180,
          },
        ]}
      >
        {/* Modern Icon Container */}
        <View
          className="w-16 h-16 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: `${activeColor}15` }}
        >
          <Icon color={activeColor} size={32} strokeWidth={2} />
        </View>

        <Text className="text-lg font-bold text-center mb-1" style={{ color: colors.header }}>
          {title}
        </Text>
        <Text className="text-xs text-center font-medium leading-4 px-2 opacity-60" style={{ color: colors.textSecondary }}>
          {subtitle}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

// --- Main App Component ---
export default function HomeScreen() {
  const { navigate } = useContext(NavigationContext); // ✅ integrated navigation
  const { userType, isAuthenticated } = useContext(AuthContext);
  const systemDark = useColorScheme() === 'dark';
  const { darkMode, setTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;
  const roleColors = {
    ngo: '#059669',     // Emerald 600
    college: '#0284c7', // Sky 600
    admin: '#475569',   // Slate 600 (Neutral)
    student: '#7c3aed', // Violet 600
  };

  return (
    <LinearGradient
      colors={colors.backgroundColors}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Theme Toggle - Absolute top right */}
          <Animated.View 
            entering={FadeInUp.duration(600).delay(100)}
            style={{ position: 'absolute', top: 10, right: 20, zIndex: 10 }}
          >
            <Pressable
              onPress={() => setTheme(!darkMode)}
              className="p-3 rounded-full active:scale-95"
              style={{ backgroundColor: colors.toggleBg }}
            >
              {darkMode ? <Sun size={20} color="#facc15" strokeWidth={2.5} /> : <Moon size={20} color="#64748b" strokeWidth={2.5} />}
            </Pressable>
          </Animated.View>

          {/* Header Section */}
          <Animated.View 
            entering={FadeInDown.duration(600).delay(100)}
            className="items-center mb-12"
          >
            <Image
              source={require('../../assets/CODER_HIVE_logo.png')}
              style={{ width: 110, height: 110 }}
              resizeMode="contain"
            />
            <View className="flex-row items-center mt-3 gap-1.5">
              <Text className="text-3xl font-black tracking-tight" style={{ color: colors.header }}>MarkIn</Text>
              <BadgeCheck color={colors.accent} size={26} />
            </View>
            <Text className="text-sm font-semibold mt-1.5 opacity-60" style={{ color: colors.textSecondary }}>
              Seamlessly Mark • Track • Verify Attendance
            </Text>
          </Animated.View>

          {/* Role Grid Section */}
          <View className="w-full px-1">
            <Animated.Text 
              entering={FadeInDown.duration(600).delay(200)}
              className="text-lg font-bold mb-8 text-center" 
              style={{ color: colors.header }}
            >
              Choose your role
            </Animated.Text>

            {/* Row 1 */}
            <Animated.View 
              entering={FadeInDown.duration(600).delay(300)}
              className="flex-row gap-5 mb-5"
            >
              <LoginCard
                icon={HeartHandshake}
                title="NGO"
                subtitle="Manage events & mark attendance"
                color={roleColors.ngo}
                darkMode={darkMode}
                onPress={() => navigate('NgoLogin')}
                disabled={isAuthenticated && userType !== 'ngo'}
              />
              <LoginCard
                icon={School}
                title="College"
                subtitle="Monitor student attendance records"
                color={roleColors.college}
                darkMode={darkMode}
                onPress={() => navigate('CollegeLogin')}
                disabled={isAuthenticated && userType !== 'college'}
              />
            </Animated.View>

            {/* Row 2 */}
            <Animated.View 
              entering={FadeInDown.duration(600).delay(400)}
              className="flex-row justify-center"
            >
              <View style={{ width: '48%' }}>
                <LoginCard
                  icon={GraduationCap}
                  title="Student"
                  subtitle="Browse events and register yourself"
                  color={roleColors.student}
                  darkMode={darkMode}
                  onPress={() => navigate('StudentLogin')}
                  disabled={isAuthenticated && userType !== 'student'}
                />
              </View>
            </Animated.View>
          </View>

          {/* Footer */}
          <Animated.View 
            entering={FadeInDown.duration(600).delay(500)}
            className="pt-16 items-center px-4"
          >
            <Text className="text-[10px] font-extrabold uppercase tracking-[3px] mb-4 opacity-20" style={{ color: colors.textSecondary }}>
              Developed by
            </Text>
            <Image
              source={darkMode ? require('../../assets/coderzhive-dark.png') : require('../../assets/coderzhive-light.png')}
              style={{ height: 22, opacity: 0.3 }}
              resizeMode="contain"
            />
          </Animated.View>
        </ScrollView>

        {/* Help Button - Fixed at bottom-left */}
        <Animated.View 
          entering={FadeInUp.duration(600).delay(600)}
          style={{ position: 'absolute', bottom: 25, left: 20 }}
        >
          <Pressable
            onPress={() => {
              const helpUrl = 'https://ngo-website-1-d3az.onrender.com/';
              Linking.openURL(helpUrl).catch(err => console.error('Failed to open URL:', err));
            }}
            className="px-3 py-1.5 rounded-full flex-row items-center active:opacity-70"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
              borderWidth: 1,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <HelpCircle size={14} color={colors.textSecondary} strokeWidth={2.5} />
            <Text className="ml-1.5 text-[11px] font-bold" style={{ color: colors.textSecondary }}>
              Help Center
            </Text>
          </Pressable>
        </Animated.View>

        {/* Report/Mail Bugs Button - Fixed at bottom-right */}
        <Animated.View 
          entering={FadeInUp.duration(600).delay(600)}
          style={{ position: 'absolute', bottom: 25, right: 20 }}
        >
          <Pressable
            onPress={() => {
              if (Platform.OS === 'web') {
                const email = 'coderzhiveai@gmail.com';
                const subject = encodeURIComponent('Bug Report');
                const body = encodeURIComponent('Please describe the bug you encountered:');
                const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`;
                window.open(gmailUrl, '_blank');
              } else {
                const bugReportEmail = 'mailto:coderzhiveai@gmail.com?subject=Bug Report&body=Please describe the bug you encountered:';
                Linking.openURL(bugReportEmail).catch(err => console.error('Failed to open email:', err));
              }
            }}
            className="px-3 py-1.5 rounded-full flex-row items-center active:opacity-70"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
              borderWidth: 1,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Mail size={14} color={colors.textSecondary} strokeWidth={2.5} />
            <Text className="ml-1.5 text-[11px] font-bold" style={{ color: colors.textSecondary }}>
              Report Issue
            </Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// --- Themes ---
const lightTheme = {
  backgroundColors: ['#f8fafc', '#f1f5f9'],
  cardBg: '#ffffff',
  border: '#e2e8f0',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  accent: '#10b981',
  header: '#1e293b',
  toggleBg: '#f1f5f9',
};

const darkTheme = {
  backgroundColors: ['#0f172a', '#020617'],
  cardBg: '#1e293b',
  border: '#334155',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  accent: '#10b981',
  header: '#f1f5f9',
  toggleBg: '#334155',
};
