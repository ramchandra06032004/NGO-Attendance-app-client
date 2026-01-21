import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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
    <View className="flex-row p-2.5 rounded-lg mb-0.5" style={{ backgroundColor: colors.accent }}>
      <Text className="font-bold text-white text-center text-sm px-1" style={{ flex: 1.2 }}>Event</Text>
      <Text className="font-bold text-white text-center text-sm px-1" style={{ flex: 1 }}>Event Venue</Text>
      <Text className="font-bold text-white text-center text-sm px-1" style={{ flex: 1 }}>NGO</Text>
      <Text className="font-bold text-white text-center text-sm px-1" style={{ flex: 1 }}>Event Date</Text>
      <Text className="font-bold text-white text-center text-sm px-1" style={{ flex: 1 }}>Attended Date</Text>
    </View>
  );

  const renderEvent = ({ item, index }) => (
    <View className="flex-row p-2.5 rounded-lg mb-0.5 border" style={{
      backgroundColor: index % 2 === 0 ? colors.cardBg : colors.backgroundColors?.[1] || '#f9f9f9',
      borderColor: colors.border
    }}>
      <Text className="text-center text-sm px-1" style={{ color: colors.textPrimary, flex: 1.2 }} numberOfLines={1}>
        {item.eventName}
      </Text>
      <Text className="text-center text-sm px-1" style={{ color: colors.textSecondary, flex: 1 }} numberOfLines={1}>
        {item.eventLocation}
      </Text>
      <Text className="text-center text-sm px-1" style={{ color: colors.textSecondary, flex: 1 }} numberOfLines={1}>
        {item.ngoName}
      </Text>
      <Text className="text-center text-sm px-1" style={{ color: colors.textSecondary, flex: 1 }} numberOfLines={1}>
        {item.eventDate}
      </Text>
      <Text className="text-center text-sm px-1" style={{ color: colors.textSecondary, flex: 1 }} numberOfLines={1}>
        {item.attendedDate}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 p-5" style={{ backgroundColor: colors.backgroundColors ? colors.backgroundColors[0] : '#fff' }}>
      <Text className="text-xl font-black mb-2" style={{ color: colors.header }}>{student.name}</Text>
      <Text className="mb-1.5 text-base" style={{ color: colors.textSecondary }}>PRN: {student.prn}</Text>
      <Text className="mb-1.5 text-base" style={{ color: colors.textSecondary }}>Department: {student.department}</Text>
      <Text className="mb-1.5 text-base" style={{ color: colors.textSecondary }}>Class: {className}</Text>
      
      {events.length === 0 ? (
        <Text className="text-center mt-5 text-lg" style={{ color: colors.textSecondary }}>No events attended.</Text>
      ) : (
        <View className="w-full">
          {renderTableHeader()}
          {events.map((event, index) => renderEvent({ item: event, index }))}
        </View>
      )}

      <TouchableOpacity className="mt-3" onPress={() => goBack()}>
        <Text className="text-base font-semibold" style={{ color: colors.textPrimary }}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}
