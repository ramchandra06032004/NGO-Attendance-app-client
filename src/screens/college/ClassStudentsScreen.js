import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
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
    <View className="flex-1 p-5" style={{ backgroundColor: colors.backgroundColors ? colors.backgroundColors[0] : '#fff' }}>
      <Text className="text-lg font-black mb-3" style={{ color: colors.header }}>{className}</Text>
      <FlatList data={students} keyExtractor={s => s._id.toString()} renderItem={({ item }) => (
        <View className="p-3 rounded-2xl mb-2 flex-row items-center border" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
          <View className="flex-1">
            <Text className="font-bold" style={{ color: colors.textPrimary }}>{item.name}</Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>PRN: {item.prn}</Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>Department: {item.department}</Text>
          </View>
          <TouchableOpacity className="px-3 py-2 rounded-lg" style={{ backgroundColor: colors.accent }} onPress={() => navigate('StudentEvents', { college, studentId: item._id.toString() })}>
            <Text className="text-white font-bold">Events</Text>
          </TouchableOpacity>
        </View>
      )} />

      <TouchableOpacity className="p-3 rounded-lg items-center mt-3" style={{ backgroundColor: colors.accent }} onPress={() => navigate('AddStudent', { college, className })}>
        <Text className="text-white font-bold">Add Student</Text>
      </TouchableOpacity>

      <TouchableOpacity className="mt-3" onPress={() => goBack()}>
        <Text style={{ color: colors.textPrimary }}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}