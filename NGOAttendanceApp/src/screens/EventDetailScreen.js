import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { AttendanceContext } from '../context/AttendanceContext';
import { NavigationContext } from '../context/NavigationContext';

export default function EventDetailScreen({ eventId }) {
  const { events, markAttendance } = useContext(AttendanceContext);
  const { goBack } = useContext(NavigationContext);

  const event = events.find(e => e.id === eventId) || { title: '', students: [] };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}><Text style={{color:'#1f2937'}}>Back</Text></TouchableOpacity>
        <Text style={styles.title}>{event.title}</Text>
      </View>

      <FlatList
        data={event.students}
        keyExtractor={s => s.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.college} • {item.class}</Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={[styles.markBtn, item.status === 'present' && styles.activePresent]} onPress={() => markAttendance(event.id, item.id, 'present')}>
                <Text style={styles.markText}>Present</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.markBtn, item.status === 'absent' && styles.activeAbsent]} onPress={() => markAttendance(event.id, item.id, 'absent')}>
                <Text style={styles.markText}>Absent</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff7ed' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backBtn: { paddingRight: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#0b1220' },
  row: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '600', color: '#0b1220' },
  meta: { color: '#475569', marginTop: 4 },
  actions: { flexDirection: 'row' },
  markBtn: { padding: 8, borderRadius: 8, backgroundColor: '#e6e7eb', marginLeft: 8 },
  markText: { color: '#0b1220' },
  activePresent: { backgroundColor: '#bbf7d0' },
  activeAbsent: { backgroundColor: '#fecaca' },
});
