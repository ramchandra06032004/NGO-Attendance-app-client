import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContext } from '../context/NavigationContext';

export default function HomeScreen() {
  const { navigate } = useContext(NavigationContext);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NGO Attendance</Text>

      <TouchableOpacity style={[styles.card, styles.ngoCard]} onPress={() => navigate('NgoLogin')}>
        <Text style={styles.cardTitle}>NGO Login</Text>
        <Text style={styles.cardSubtitle}>Manage events and mark attendance</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.card, styles.collegeCard]} onPress={() => navigate('CollegeLogin')}>
        <Text style={styles.cardTitle}>College Login</Text>
        <Text style={styles.cardSubtitle}>View student attendance records</Text>
      </TouchableOpacity>

          <TouchableOpacity style={[styles.card, styles.adminCard]} onPress={() => navigate('AdminLogin')}>
            <Text style={styles.cardTitle}>Admin Login</Text>
            <Text style={styles.cardSubtitle}>Manage colleges and NGOs</Text>
          </TouchableOpacity>

      <Text style={styles.footer}>Simple • Modern • Friendly UI</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#eef2ff', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', marginTop: 40, marginBottom: 20, color: '#0b1220' },
  card: { width: '100%', backgroundColor: '#fff', padding: 18, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#0b1220' },
  cardSubtitle: { fontSize: 13, color: '#475569', marginTop: 6 },
  ngoCard: { backgroundColor: '#fff7ed', borderColor: '#f59e0b' },
  collegeCard: { backgroundColor: '#ecfeff', borderColor: '#06b6d4' },
  adminCard: { backgroundColor: '#f0fdf4', borderColor: '#34d399' },
  footer: { marginTop: 30, color: '#64748b' },
});
