import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { NavigationContext } from '../../context/NavigationContext';
import { useTheme } from '../../context/ThemeContext';

export default function StudentEventsScreen({ college, studentId }) {
  const { goBack } = useContext(NavigationContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;
  const [attended, setAttended] = useState([]);
  const [student, setStudent] = useState({ name: 'Student', id: studentId, attendedEvents: [] });

  useEffect(() => {
    // Find the student from college.classes.students
    const foundStudent = college.classes.flatMap(c => c.students).find(s => s._id.toString() === studentId) || { name: 'Student', id: studentId, attendedEvents: [] };
    setStudent(foundStudent);

    // Get attended events from student's attendedEvents array, with populated event details
    const attendedEvents = foundStudent.attendedEvents?.map(att => ({
      ...att.eventId,
      ngoName: att.eventId?.createdBy?.name,
    })) || [];
    setAttended(attendedEvents);
  }, [studentId]);

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundColors ? colors.backgroundColors[0] : '#fff' }]}>
      <Text style={[styles.title, { color: colors.header }]}>{student.name}</Text>
      <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>{student.id}</Text>

      {attended.length === 0 ? (
        <Text style={[styles.noEvents, { color: colors.textSecondary }]}>No events attended.</Text>
      ) : (
        <FlatList data={attended} keyExtractor={(e, index) => e._id || e.id || index.toString()} renderItem={({ item }) => (
          <View style={[styles.eventCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{item.aim}</Text>
            <Text style={{ color: colors.textSecondary }}>{item.description}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Date: {new Date(item.eventDate).toLocaleDateString()}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Organized by: {item.ngoName}</Text>
          </View>
        )} />
      )}

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
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noEvents: { textAlign: 'center', marginTop: 20, fontSize: 16 },
});
