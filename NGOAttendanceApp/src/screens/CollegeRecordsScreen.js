import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { AttendanceContext } from '../context/AttendanceContext';
import { NavigationContext } from '../context/NavigationContext';

export default function CollegeRecordsScreen({ college: initialCollege }) {
  const { getCollegeRecords, getColleges } = useContext(AttendanceContext);
  const { goBack, navigate } = useContext(NavigationContext);
  const [college, setCollege] = useState(initialCollege || 'ABC College');
  const colleges = getColleges();
  const isLoggedInCollege = Boolean(initialCollege);

  const records = getCollegeRecords(college);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}><Text style={{color:'#1f2937'}}>Back</Text></TouchableOpacity>
        <Text style={styles.title}>College Records</Text>
      </View>

      <View style={{ marginBottom: 12 }}>
        {/* If the user arrived logged-in as a specific college, don't show the dropdown; show label + logout */}
        {isLoggedInCollege ? (
          <View style={styles.loggedRow}>
            <Text style={{ fontWeight: '700', color: '#0b1220' }}>{college}</Text>
            <TouchableOpacity style={styles.logoutBtn} onPress={() => navigate('Home')}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Logout</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // simple picker
          colleges.map(c => (
            <TouchableOpacity key={c} onPress={() => setCollege(c)} style={[styles.pickerItem, c === college && styles.pickerItemActive]}>
              <Text style={{ color: c === college ? '#075985' : '#0b1220' }}>{c}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <FlatList
        data={records}
        keyExtractor={r => r.eventId}
        renderItem={({ item }) => (
          <View style={styles.eventBlock}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            {item.students.length === 0 ? (
              <Text style={{ color: '#64748b', marginTop: 8 }}>No students from this college in the event</Text>
            ) : (
              item.students.map(s => (
                <View key={s.id} style={styles.recordRow}>
                  <Text style={{ flex: 1 }}>{s.name} • {s.class}</Text>
                  <Text style={{ width: 80, textAlign: 'right' }}>{s.status || '—'}</Text>
                </View>
              ))
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#ecfeff' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backBtn: { paddingRight: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#0b1220' },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 10 },
  eventBlock: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 10 },
  eventTitle: { fontWeight: '700', marginBottom: 6 },
  recordRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  pickerItem: { padding: 10, borderRadius: 8, marginBottom: 8, backgroundColor: '#f8fafc' },
  pickerItemActive: { backgroundColor: '#ecfeff' },
  loggedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logoutBtn: { backgroundColor: '#ef4444', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
});
