import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { NavigationContext } from '../../context/NavigationContext';
import { AttendanceContext } from '../../context/AttendanceContext';
import { useTheme } from '../../context/ThemeContext';

export default function ClassStudentsScreen({ college, className }) {
  const { navigate, goBack } = useContext(NavigationContext);
  const { getStudentsByCollegeAndClass } = useContext(AttendanceContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  // Find the selected class from college.classes and use its students array
  const selectedClass = college.classes.find(c => c.className === className);
  const students = selectedClass ? selectedClass.students : [];

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundColors ? colors.backgroundColors[0] : '#fff' }]}>
      <Text style={[styles.header, { color: colors.header }]}>{className}</Text>
      <FlatList data={students} keyExtractor={s => s._id.toString()} renderItem={({ item }) => (
        <View style={[styles.row, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{item.name}</Text>
            <Text style={{ color: colors.textSecondary }}>PRN: {item.prn}</Text>
            <Text style={{ color: colors.textSecondary }}>Department: {item.department}</Text>
          </View>
          <TouchableOpacity style={[styles.detailsBtn, { backgroundColor: colors.accent }]} onPress={() => navigate('StudentEvents', { college, studentId: item._id.toString() })}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Events</Text>
          </TouchableOpacity>
        </View>
      )} />

      <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.accent }]} onPress={() => navigate('AddStudent', { college, className })}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Add Student</Text>
      </TouchableOpacity>

      <TouchableOpacity style={{ marginTop: 12 }} onPress={() => goBack()}>
        <Text style={{ color: colors.textPrimary }}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  row: { padding: 12, borderRadius: 10, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  detailsBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addBtn: { padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
});
