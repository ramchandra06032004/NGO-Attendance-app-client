import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { AttendanceContext } from '../../context/AttendanceContext';
import { NavigationContext } from '../../context/NavigationContext';
import { useTheme } from '../../context/ThemeContext';

export default function StudentsListScreen({ eventId, college }) {
  const { events, markAttendance } = useContext(AttendanceContext);
  const { goBack } = useContext(NavigationContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  const event = events.find(e => e.id === eventId) || { students: [] };
  const students = event.students.filter(s => s.college === college);

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundColors ? colors.backgroundColors[0] : '#fff' }]}>
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.header }]}>Students — {college}</Text>
        <FlatList data={students} keyExtractor={s => s.id} renderItem={({ item }) => (
          <View style={[styles.row, { borderColor: colors.border }]}> 
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary }}>{item.name}</Text>
              <Text style={{ color: colors.textSecondary }}>{item.class}</Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity style={[styles.markBtn, item.status === 'present' && styles.activePresent]} onPress={() => markAttendance(event.id, item.id, 'present')}>
                <Text style={{ color: colors.textPrimary }}>Present</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.markBtn, item.status === 'absent' && styles.activeAbsent]} onPress={() => markAttendance(event.id, item.id, 'absent')}>
                <Text style={{ color: colors.textPrimary }}>Absent</Text>
              </TouchableOpacity>
            </View>
          </View>
        )} />

        <TouchableOpacity style={styles.link} onPress={() => goBack()}>
          <Text style={{ color: colors.textPrimary }}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  card: { width: '100%', maxWidth: 640, padding: 18, borderRadius: 12, borderWidth: 1 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  markBtn: { padding: 8, borderRadius: 8, marginLeft: 8, backgroundColor: 'transparent' },
  activePresent: { backgroundColor: '#bbf7d0' },
  activeAbsent: { backgroundColor: '#fecaca' },
  link: { marginTop: 12 },
});
