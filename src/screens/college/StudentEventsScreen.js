import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SectionList } from 'react-native';
import { NavigationContext } from '../../context/NavigationContext';
import { useTheme } from '../../context/ThemeContext';

export default function StudentEventsScreen({ college, studentId }) {
  const { goBack } = useContext(NavigationContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;
  const [groupedEvents, setGroupedEvents] = useState([]);
  const [student, setStudent] = useState({ name: 'Student', id: studentId, attendedEvents: [] });
  const [className, setClassName] = useState('');

  useEffect(() => {
    // Find the student from college.classes.students
    const foundStudent = college.classes.flatMap(c => c.students).find(s => s._id.toString() === studentId) || { name: 'Student', id: studentId, attendedEvents: [] };
    setStudent(foundStudent);

    // Find the class name
    const foundClass = college.classes.find(c => c.students.some(s => s._id.toString() === studentId));
    setClassName(foundClass ? foundClass.className : '');

    // Get attended events from student's attendedEvents array, with populated event details
    const attendedEvents = foundStudent.attendedEvents?.map(att => ({
      ...att.eventId,
      ngoName: att.eventId?.createdBy?.name,
      attendanceDate: new Date(att.attendanceMarkedAt).toDateString(),
      attendanceTime: new Date(att.attendanceMarkedAt).toLocaleTimeString(),
    })) || [];

    // Group by date
    const grouped = attendedEvents.reduce((acc, event) => {
      const date = event.attendanceDate;
      if (!acc[date]) acc[date] = [];
      acc[date].push(event);
      return acc;
    }, {});

    const sections = Object.keys(grouped).map(date => ({
      title: date,
      data: grouped[date],
    }));

    setGroupedEvents(sections);
  }, [studentId]);

  const renderEvent = ({ item }) => (
    <View style={[styles.eventRow, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
      <Text style={[styles.cell, { color: colors.textPrimary, flex: 2 }]}>{item.aim}</Text>
      <Text style={[styles.cell, { color: colors.textSecondary, flex: 1 }]}>{item.ngoName}</Text>
      <Text style={[styles.cell, { color: colors.textSecondary, flex: 1 }]}>{item.attendanceTime}</Text>
    </View>
  );

  const renderTableHeader = () => (
    <View style={[styles.headerRow, { backgroundColor: colors.accent }]}>
      <Text style={[styles.headerCell, { flex: 2 }]}>Event</Text>
      <Text style={[styles.headerCell, { flex: 1 }]}>NGO</Text>
      <Text style={[styles.headerCell, { flex: 1 }]}>Time</Text>
    </View>
  );

  const renderDateHeader = ({ section: { title } }) => (
    <Text style={[styles.dateHeader, { color: colors.header }]}>{title}</Text>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundColors ? colors.backgroundColors[0] : '#fff' }]}>
      <Text style={[styles.title, { color: colors.header }]}>{student.name}</Text>
      <Text style={{ color: colors.textSecondary, marginBottom: 4 }}>PRN: {student.prn}</Text>
      <Text style={{ color: colors.textSecondary, marginBottom: 4 }}>Department: {student.department}</Text>
      <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>Class: {className}</Text>
      {groupedEvents.length === 0 ? (
        <Text style={[styles.noEvents, { color: colors.textSecondary }]}>No events attended.</Text>
      ) : (
        <SectionList
          sections={groupedEvents}
          keyExtractor={(item, index) => item._id || item.id || index.toString()}
          renderItem={renderEvent}
          renderSectionHeader={renderDateHeader}
          ListHeaderComponent={renderTableHeader}
          stickySectionHeadersEnabled={false}
        />
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
  dateHeader: { fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 8 },
  headerRow: { flexDirection: 'row', padding: 8, borderRadius: 5, marginBottom: 4 },
  headerCell: { fontWeight: '700', color: '#fff', textAlign: 'center' },
  eventRow: { flexDirection: 'row', padding: 8, borderRadius: 5, marginBottom: 2, borderWidth: 1 },
  cell: { textAlign: 'center', fontSize: 14 },
  noEvents: { textAlign: 'center', marginTop: 20, fontSize: 16 },
});
