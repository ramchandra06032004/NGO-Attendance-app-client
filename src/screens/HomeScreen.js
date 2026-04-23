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
  withTiming 
} from 'react-native-reanimated';

// --- Card Component ---
const LoginCard = ({ icon: Icon, title, subtitle, color = '#64748b', onPress, darkMode, disabled }) => {
  const scale = useSharedValue(1);
  const { lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;
  
  const activeColor = color || '#64748b';

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={disabled ? null : onPress}
      onPressIn={() => (scale.value = withSpring(0.97))}
      onPressOut={() => (scale.value = withSpring(1))}
      className="flex-1"
    >
      <Animated.View
        className="p-6 rounded-2xl items-center justify-center border overflow-hidden"
        style={[
          animatedStyle,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
            borderWidth: 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
            opacity: disabled ? 0.4 : 1,
            height: 160,
          },
        ]}
      >
        {/* Subtle Accent Bar */}
        <View 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            height: 4, 
            backgroundColor: activeColor,
            opacity: 0.8
          }} 
        />

        <View className="mb-4">
          <Icon color={activeColor} size={36} strokeWidth={2} />
        </View>
        
        <Text className="text-base font-bold text-center mb-1" style={{ color: colors.header }}>
          {title}
        </Text>
        <Text className="text-[11px] text-center font-medium leading-4 px-2" style={{ color: colors.textSecondary, opacity: 0.9 }}>
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
          <View style={{ position: 'absolute', top: 10, right: 20, zIndex: 10 }}>
            <Pressable
              onPress={() => setTheme(!darkMode)}
              className="p-3 rounded-full active:scale-95"
              style={{ backgroundColor: colors.toggleBg }}
            >
              {darkMode ? <Sun size={20} color="#facc15" strokeWidth={2.5} /> : <Moon size={20} color="#64748b" strokeWidth={2.5} />}
            </Pressable>
          </View>

          {/* Header Section */}
          <View className="items-center mb-10">
            <Image
              source={require('../../assets/CODER_HIVE_logo.png')}
              style={{ width: 100, height: 100 }}
              resizeMode="contain"
            />
            <View className="flex-row items-center mt-2 gap-1">
              <Text className="text-3xl font-black" style={{ color: colors.header }}>MarkIn</Text>
              <BadgeCheck color={colors.accent} size={24} />
            </View>
            <Text className="text-[13px] font-semibold mt-1" style={{ color: colors.textSecondary }}>
              Seamlessly Mark • Track • Verify Attendance
            </Text>
          </View>

          {/* Role Grid Section */}
          <View className="w-full">
            <Text className="text-sm font-bold mb-6 text-center uppercase tracking-widest opacity-60" style={{ color: colors.textSecondary }}>
              Select Your Role
            </Text>

            {/* Row 1 */}
            <View className="flex-row gap-4 mb-4">
              <LoginCard
                icon={HeartHandshake}
                title="NGO"
                subtitle="Mark attendance for events"
                color={roleColors.ngo}
                darkMode={darkMode}
                onPress={() => navigate('NgoLogin')}
                disabled={isAuthenticated && userType !== 'ngo'}
              />
              <LoginCard
                icon={School}
                title="College"
                subtitle="Monitor student records"
                color={roleColors.college}
                darkMode={darkMode}
                onPress={() => navigate('CollegeLogin')}
                disabled={isAuthenticated && userType !== 'college'}
              />
            </View>

            {/* Row 2 */}
            <View className="flex-row gap-4">
              <LoginCard
                icon={GraduationCap}
                title="Student"
                subtitle="Browse and register"
                color={roleColors.student}
                darkMode={darkMode}
                onPress={() => navigate('StudentLogin')}
                disabled={isAuthenticated && userType !== 'student'}
              />
              <LoginCard
                icon={Shield}
                title="Admin"
                subtitle="System management"
                color={roleColors.admin}
                darkMode={darkMode}
                onPress={() => navigate('AdminLogin')}
                disabled={isAuthenticated && userType !== 'admin'}
              />
            </View>
          </View>

          {/* Footer */}
          <View className="pt-12 mt-12 items-center px-4 mb-4">
            <Text className="text-[10px] font-bold uppercase tracking-[2px] mb-3 opacity-40" style={{ color: colors.textSecondary }}>
              Developed by
            </Text>
            <Image
              source={darkMode ? require('../../assets/coderzhive-dark.png') : require('../../assets/coderzhive-light.png')}
              style={{ height: 24, opacity: 0.6 }}
              resizeMode="contain"
            />
          </View>
        </ScrollView>

        {/* Help Button - Fixed at bottom-left */}
        <Pressable
          onPress={() => {
            const helpUrl = 'https://ngo-website-1-d3az.onrender.com/';
            Linking.openURL(helpUrl).catch(err => console.error('Failed to open URL:', err));
          }}
          className="px-3 py-1.5 rounded-full flex-row items-center active:opacity-70"
          style={{
            position: 'absolute',
            bottom: 25,
            left: 20,
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

        {/* Report/Mail Bugs Button - Fixed at bottom-right */}
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
            position: 'absolute',
            bottom: 25,
            right: 20,
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
