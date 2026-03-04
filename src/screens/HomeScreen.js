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
} from 'lucide-react-native';
import { NavigationContext } from '../context/NavigationContext'; // ✅ imported navigation context
import { AuthContext } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

// --- Card Component ---
const LoginCard = ({ icon: Icon, title, subtitle, iconColor, onPress, darkMode, disabled }) => {
  const colors = darkMode ? darkTheme : lightTheme;
  return (
    <Pressable
      onPress={disabled ? null : onPress}
      className={`p-5 border rounded-2xl ${disabled ? '' : 'active:shadow-xl'}`}
      style={{
        backgroundColor: darkMode ? '#1e3a5fff' : '#ffffff',
        borderColor: colors.border,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        opacity: disabled ? 0.5 : 1,
      }}
      onPressIn={(pressed) => { }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="p-3 rounded-full" style={{ backgroundColor: colors.iconBg }}>
            <Icon color={iconColor} size={32} strokeWidth={2.5} />
          </View>
          <View className="flex-1 ml-4">
            <Text className="text-lg font-bold leading-5" style={{ color: colors.textPrimary }}>{title}</Text>
            <Text className="text-xs mt-1.5 leading-[16px]" style={{ color: colors.textSecondary }}>{subtitle}</Text>
          </View>
        </View>
        <View className="ml-2">
          <ChevronRight color={colors.accent} size={24} />
        </View>
      </View>
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

  const iconColors = {
    ngo: darkMode ? '#f97316' : '#ea580c',
    college: darkMode ? '#3b82f6' : '#2563eb',
    admin: darkMode ? '#22c55e' : '#16a34a',
    student: darkMode ? '#a855f7' : '#9333ea',
  };

  return (
    <LinearGradient
      colors={colors.backgroundColors}
      start={colors.backgroundStart}
      end={colors.backgroundEnd}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 40, paddingBottom: 32, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="w-full flex-row justify-between items-center border-b pb-2 mb-8" style={{ borderBottomColor: colors.border }}>
            <View className="flex-row items-center gap-3">
              <View>
                <Image
                  source={require('../../assets/CODER_HIVE_logo.png')}
                  style={{ width: 80, height: 80 }}
                  resizeMode="contain"
                />
              </View>
              <View>
                <View className="flex-row items-center gap-1">
                  <Text className="text-2xl font-black leading-7" style={{ color: colors.header }}>MarkIn

                  </Text>
                  <BadgeCheck color={colors.accent} size={24} />
                </View>

                <Text className="text-xs font-medium leading-4" style={{ color: colors.textSecondary }}>
                  Seamlessly Mark • Track • Verify Attendance
                </Text>
              </View>


            </View>
            <Pressable
              onPress={() => setTheme(!darkMode)}
              className="p-3 border rounded-full active:scale-95"
              style={{ backgroundColor: colors.toggleBg, borderColor: colors.border }}
            >
              {darkMode ? <Sun size={24} color="#facc15" strokeWidth={2} /> : <Moon size={24} color="#1e293b" strokeWidth={2} />}
            </Pressable>

          </View>

          {/* Role Section */}
          <Text className="text-2xl font-black mb-6 self-start leading-7" style={{ color: colors.header }}>Select Your Role</Text>

          <View className="w-full gap-5">
            <LoginCard
              icon={HeartHandshake}
              title="NGO Login"
              subtitle="Manage events and mark attendance"
              iconColor={iconColors.ngo}
              darkMode={darkMode}
              onPress={() => navigate('NgoLogin')} // ✅ navigation added
              disabled={isAuthenticated && userType !== 'ngo'}
            />

            <LoginCard
              icon={School}
              title="College Login"
              subtitle="View student attendance records"
              iconColor={iconColors.college}
              darkMode={darkMode}
              onPress={() => navigate('CollegeLogin')} // ✅ navigation added
              disabled={isAuthenticated && userType !== 'college'}
            />

            <LoginCard
              icon={ShieldUser}
              title="Admin Login"
              subtitle="Manage colleges and NGOs"
              iconColor={iconColors.admin}
              darkMode={darkMode}
              onPress={() => navigate('AdminLogin')} // ✅ navigation added
              disabled={isAuthenticated && userType !== 'admin'}
            />

            <LoginCard
              icon={GraduationCap}
              title="Student Login"
              subtitle="View and register for events"
              iconColor={iconColors.student}
              darkMode={darkMode}
              onPress={() => navigate('StudentLogin')} // ✅ navigation added
              disabled={isAuthenticated && userType !== 'student'}
            />
          </View>

          {/* Footer */}
          <View className="border-t pt-7 mt-12 items-center px-4 mb-4" style={{ borderTopColor: colors.border }}>
            <Text className="text-xs font-medium tracking-wide mb-2" style={{ color: colors.textSecondary }}>
              Developed by Team
            </Text>
            <Image
              source={darkMode ? require('../../assets/coderzhive-dark.png') : require('../../assets/coderzhive-light.png')}
              style={{ height: 30 }}
              resizeMode="contain"
            />
          </View>
        </ScrollView>

        {/* Help Button - Fixed at bottom-left */}
        <Pressable
          onPress={() => {
            const helpUrl = 'https://ngo-website-1-d3az.onrender.com/'; // Replace this URL with your actual help page link
            Linking.openURL(helpUrl).catch(err => console.error('Failed to open URL:', err));
          }}
          className="px-4 py-2 rounded-full flex-row active:opacity-70"
          style={{
            position: 'absolute',
            bottom: 35,
            left: 20,
            backgroundColor: colors.iconBg,
            borderColor: colors.border,
            borderWidth: 1,
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <HelpCircle size={18} color={colors.accent} strokeWidth={2} />
          <Text className="ml-2 text-sm font-semibold" style={{ color: colors.textPrimary }}>
            Help ?
          </Text>
        </Pressable>

        {/* Report/Mail Bugs Button - Fixed at bottom-right */}
        <Pressable
          onPress={() => {
            // On web, open Gmail compose directly; on mobile, use mailto
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
          className="px-4 py-2 rounded-full flex-row active:opacity-70"
          style={{
            position: 'absolute',
            bottom: 35,
            right: 20,
            backgroundColor: colors.iconBg,
            borderColor: colors.border,
            borderWidth: 1,
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <Mail size={18} color={colors.accent} strokeWidth={2} />
          <Text className="ml-2 text-sm font-semibold" style={{ color: colors.textPrimary }}>
            Report Bug
          </Text>
        </Pressable>
      </SafeAreaView>
    </LinearGradient>
  );
}



// --- Themes ---
const lightTheme = {
  backgroundColors: ['#ffffff', '#cde4fbff'],
  backgroundStart: [0, 0],
  backgroundEnd: [1, 1],
  cardBg: '#f0f9ffff',
  border: '#bfdbfeff',
  textPrimary: '#2c3e50',
  textSecondary: '#7f8c8d',
  accent: '#1abc9c',
  header: '#296e9cff',
  iconBg: '#e0f2feff',
  toggleBg: '#dbeafe',
};

const darkTheme = {
  backgroundColors: ['#122d42ff', '#041728ff'],
  backgroundStart: [0, 0],
  backgroundEnd: [1, 1],
  background: '#091828ff',
  cardBg: '#1e3a5fff',
  border: '#3b5998ff',
  textPrimary: '#ecf0f1',
  textSecondary: '#bdc3c7',
  accent: '#1abc9c',
  header: '#5dadec',
  iconBg: '#2d5a8cff',
  toggleBg: '#1e3a5fff',
};
