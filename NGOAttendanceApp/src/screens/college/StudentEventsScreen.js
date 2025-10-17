import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { NavigationContext } from '../../context/NavigationContext';
import { AttendanceContext } from '../../context/AttendanceContext';
import { useTheme } from '../../context/ThemeContext';

export default function StudentEventsScreen({ college, studentId }) {
  const { goBack } = useContext(NavigationContext);
  const { events } = useContext(AttendanceContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  // find events attended by studentId (status present)
  const attended = events.filter(ev => ev.students.some(s => s.id === studentId && s.status === 'present'));
  const student = events.flatMap(ev => ev.students).find(s => s.id === studentId) || { name: 'Student' };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundColors ? colors.backgroundColors[0] : '#fff' }]}>
      <Text style={[styles.title, { color: colors.header }]}>{student.name}</Text>
      <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>{student.id}</Text>

      <FlatList data={attended} keyExtractor={e => e.id} renderItem={({ item }) => (
        <View style={[styles.eventCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{item.title}</Text>
          <Text style={{ color: colors.textSecondary }}>{item.description}</Text>
        </View>
      )} />

      <TouchableOpacity style={{ marginTop: 12 }} onPress={() => goBack()}>
        <Text style={{ color: colors.textPrimary }}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  eventCard: { padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1 },
});
