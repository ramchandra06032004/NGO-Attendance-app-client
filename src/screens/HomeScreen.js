import React, { useContext } from 'react';
import {View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView, useColorScheme,
} from 'react-native';
import {
  Sun,
  Moon,
  HeartHandshake,
  School,
  ShieldUser,
  UsersRound,
  ChevronRight,
} from 'lucide-react-native';
import { NavigationContext } from '../context/NavigationContext'; // ✅ imported navigation context
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

// --- Card Component ---
const LoginCard = ({ icon: Icon, title, subtitle, iconColor, onPress, darkMode }) => {
  const colors = darkMode ? darkTheme : lightTheme;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.cardBg,
          borderColor: pressed ? colors.accent : colors.border,
          transform: [{ scale: pressed ? 1.02 : 1 }],
        },
      ]}
    >
      <View style={styles.cardRow}>
        <View style={styles.iconWrapper}>
          <Icon color={iconColor} size={32} strokeWidth={2.5} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        </View>
        <ChevronRight color={colors.accent} size={22} />
      </View>
    </Pressable>
  );
};

// --- Main App Component ---
export default function HomeScreen() {
  const { navigate } = useContext(NavigationContext); // ✅ integrated navigation
  const systemDark = useColorScheme() === 'dark';
  const { darkMode, setTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  const iconColors = {
    ngo: darkMode ? '#f97316' : '#ea580c',
    college: darkMode ? '#3b82f6' : '#2563eb',
    admin: darkMode ? '#22c55e' : '#16a34a',
  };

  return (
    <LinearGradient
      // Use the new properties from the theme object
      colors={colors.backgroundColors}
      start={colors.backgroundStart}
      end={colors.backgroundEnd}
      style={styles.container} // Apply the flex: 1 style here
    >
      <SafeAreaView style={styles.container}> 
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <UsersRound size={44} color={colors.accent} strokeWidth={2.2} />
            <View>
              <Text style={[styles.title, { color: colors.header }]}>NGO Attendance</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Seamlessly Manage • Track • Verify
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => setTheme(!darkMode)}
            style={[
              styles.toggleButton,
              { backgroundColor: colors.toggleBg, borderColor: colors.border },
            ]}
          >
            {darkMode ? <Sun size={22} color="#facc15" /> : <Moon size={22} color="#1e293b" />}
          </Pressable>
        </View>

        {/* Role Section */}
        <Text style={[styles.sectionTitle, { color: colors.header }]}>Select Your Role</Text>

        <View style={styles.cardsContainer}>
          <LoginCard
            icon={HeartHandshake}
            title="NGO Login"
            subtitle="Manage events and mark attendance"
            iconColor={iconColors.ngo}
            darkMode={darkMode}
            onPress={() => navigate('NgoLogin')} // ✅ navigation added
          />

          <LoginCard
            icon={School}
            title="College Login"
            subtitle="View student attendance records"
            iconColor={iconColors.college}
            darkMode={darkMode}
            onPress={() => navigate('CollegeLogin')} // ✅ navigation added
          />

          <LoginCard
            icon={ShieldUser}
            title="Admin Login"
            subtitle="Manage colleges and NGOs"
            iconColor={iconColors.admin}
            darkMode={darkMode}
            onPress={() => navigate('AdminLogin')} // ✅ navigation added
          />
        </View>

        {/* Footer */}
        <View style={[styles.footer, { borderColor: colors.border }]}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Simple • Modern • Friendly UI
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
    </LinearGradient>
  );
}

// --- Themes ---
const lightTheme = {
  backgroundColors: ['#ffffff', '#cde4fbff'], 
  backgroundStart: [0, 0], 
  backgroundEnd: [1, 1],  
  cardBg: '#ffffff',
  border: '#e0e7ee',
  textPrimary: '#2c3e50',
  textSecondary: '#7f8c8d',
  accent: '#1abc9c',
  header: '#296e9cff',
  iconBg: '#e8f6f3',
  toggleBg: '#ecf0f1',
};

const darkTheme = {
  backgroundColors: ['#122d42ff', '#041728ff'], 
  backgroundStart: [0, 0],
  backgroundEnd: [1, 1],
  background: '#091828ff',  
  cardBg: '#34495e',
  border: '#546a7b',
  textPrimary: '#ecf0f1',
  textSecondary: '#bdc3c7',
  accent: '#1abc9c',
  header: '#5dadec',
  iconBg: '#34495e',
  toggleBg: '#34495e',
};


// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 16,
    marginBottom: 30,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
  },
  toggleButton: {
    padding: 8,
    borderWidth: 1,
    borderRadius: 50,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  cardsContainer: {
    width: '100%',
    gap: 16,
  },
  card: {
    padding: 18,
    borderWidth: 1,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  iconWrapper: {
    padding: 8,
    borderRadius: 999,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 24,
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
