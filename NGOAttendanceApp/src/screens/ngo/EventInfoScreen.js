import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useContext } from 'react';
import { AttendanceContext } from '../../context/AttendanceContext';
import { NavigationContext } from '../../context/NavigationContext';
import { useTheme } from '../../context/ThemeContext';

export default function EventInfoScreen({ eventId }) {
  const { events } = useContext(AttendanceContext);
  const { goBack, navigate } = useContext(NavigationContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  const event = events.find(e => e.id === eventId) || { title: '', students: [] };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundColors ? colors.backgroundColors[0] : '#fff' }]}>
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.header }]}>{event.title}</Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>About Event: {event.description}</Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>{event.students.length} students registered</Text>

        <TouchableOpacity style={[styles.action, { backgroundColor: colors.accent }]} onPress={() => navigate('SelectCollege', { eventId })}>
          <Text style={styles.actionText}>Mark Attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={() => goBack()}>
          <Text style={[{ color: colors.textPrimary }]}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  card: { width: '100%', maxWidth: 520, padding: 20, borderRadius: 12, borderWidth: 1 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  desc: { marginBottom: 10 },
  action: { marginTop: 16, padding: 12, borderRadius: 10, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: '700' },
  link: { marginTop: 12, alignItems: 'center' },
});
