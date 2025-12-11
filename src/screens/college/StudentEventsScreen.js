import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContext } from '../../context/NavigationContext';
import { useTheme } from '../../context/ThemeContext';

export default function StudentEventsScreen({ college, studentId }) {
  const { goBack } = useContext(NavigationContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;
  const [events, setEvents] = useState([]);
  const [student, setStudent] = useState({ name: 'Student', id: studentId, attendedEvents: [] });
  const [className, setClassName] = useState('');

  useEffect(() => {
    // Find the student from college.classes.students
    const foundStudent = college.classes.flatMap(c => c.students).find(s => s._id.toString() === studentId) || { name: 'Student', id: studentId, attendedEvents: [] };
    setStudent(foundStudent);

    // Find the class name
    const foundClass = college.classes.find(c => c.students.some(s => s._id.toString() === studentId));
    setClassName(foundClass ? foundClass.className : '');

    // Get attended events with event date, location and attendance date
    const attendedEvents = foundStudent.attendedEvents?.map(att => ({
      eventName: att.eventId?.aim || 'N/A',
      ngoName: att.eventId?.createdBy?.name || 'N/A',
      eventLocation: att.eventId?.location || 'N/A',
      eventDate: att.eventId?.eventDate ? new Date(att.eventId.eventDate).toDateString() : 'N/A',
      attendedDate: att.attendanceMarkedAt ? new Date(att.attendanceMarkedAt).toDateString() : 'N/A',
    })) || [];

    setEvents(attendedEvents);
  }, [studentId]);

  const renderTableHeader = () => (
    <View style={[styles.headerRow, { backgroundColor: colors.accent }]}>
      <Text style={[styles.headerCell, { flex: 1.2 }]}>Event</Text>
      <Text style={[styles.headerCell, { flex: 1 }]}>Event Venue</Text>
      <Text style={[styles.headerCell, { flex: 1 }]}>NGO</Text>
      <Text style={[styles.headerCell, { flex: 1 }]}>Event Date</Text>
      <Text style={[styles.headerCell, { flex: 1 }]}>Attended Date</Text>
    </View>
  );

  const renderEvent = ({ item, index }) => (
    <View style={[styles.eventRow, { 
      backgroundColor: index % 2 === 0 ? colors.cardBg : colors.backgroundColors?.[1] || '#f9f9f9',
      borderColor: colors.border 
    }]}>
      <Text style={[styles.cell, { color: colors.textPrimary, flex: 1.2 }]} numberOfLines={1}>
        {item.eventName}
      </Text>
      <Text style={[styles.cell, { color: colors.textSecondary, flex: 1 }]} numberOfLines={1}>
        {item.eventLocation}
      </Text>
      <Text style={[styles.cell, { color: colors.textSecondary, flex: 1 }]} numberOfLines={1}>
        {item.ngoName}
      </Text>
      
      <Text style={[styles.cell, { color: colors.textSecondary, flex: 1 }]} numberOfLines={1}>
        {item.eventDate}
      </Text>
      <Text style={[styles.cell, { color: colors.textSecondary, flex: 1 }]} numberOfLines={1}>
        {item.attendedDate}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundColors ? colors.backgroundColors[0] : '#fff' }]}>
      <Text style={[styles.title, { color: colors.header }]}>{student.name}</Text>
      <Text style={[styles.infoText, { color: colors.textSecondary }]}>PRN: {student.prn}</Text>
      <Text style={[styles.infoText, { color: colors.textSecondary }]}>Department: {student.department}</Text>
      <Text style={[styles.infoText, { color: colors.textSecondary }]}>Class: {className}</Text>
      
      {events.length === 0 ? (
        <Text style={[styles.noEvents, { color: colors.textSecondary }]}>No events attended.</Text>
      ) : (
        <View style={styles.tableWrapper}>
          {renderTableHeader()}
          {events.map((event, index) => renderEvent({ item: event, index }))}
        </View>
      )}

      <TouchableOpacity style={{ marginTop: 12 }} onPress={() => goBack()}>
        <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600' }}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  infoText: { marginBottom: 6, fontSize: 15 },
  tableWrapper: { width: '100%' },
  headerRow: { flexDirection: 'row', padding: 10, borderRadius: 5, marginBottom: 2 },
  headerCell: { fontWeight: '700', color: '#fff', textAlign: 'center', paddingHorizontal: 4, fontSize: 14 },
  eventRow: { flexDirection: 'row', padding: 10, borderRadius: 5, marginBottom: 2, borderWidth: 1 },
  cell: { textAlign: 'center', fontSize: 14, paddingHorizontal: 4 },
  noEvents: { textAlign: 'center', marginTop: 20, fontSize: 18 },
});
