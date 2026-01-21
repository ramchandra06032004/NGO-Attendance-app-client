import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { AttendanceContext } from '../../context/AttendanceContext';
import { NavigationContext } from '../../context/NavigationContext';
import { useTheme } from '../../context/ThemeContext';

export default function EventDetailScreen({ eventId }) {
  const { events, markAttendance } = useContext(AttendanceContext);
  const { goBack } = useContext(NavigationContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  const event = events.find(e => e.id === eventId) || { title: '', students: [] };

  return (
    <View className="flex-1 p-5" style={{ backgroundColor: (colors.backgroundColors && colors.backgroundColors[0]) || '#fff7ed' }}>
      <View className="flex-row items-center mb-3">
        <TouchableOpacity onPress={goBack} className="pr-3"><Text style={{color: colors.textPrimary}}>Back</Text></TouchableOpacity>
        <Text className="text-2xl font-bold" style={{ color: colors.header }}>{event.title}</Text>
      </View>

      <FlatList
        data={event.students}
        keyExtractor={s => s.id}
        renderItem={({ item }) => (
          <View className="p-3 rounded-xl mb-2.5 flex-row items-center" style={{ backgroundColor: colors.cardBg }}>
            <View className="flex-1">
              <Text className="text-base font-semibold" style={{ color: colors.textPrimary }}>{item.name}</Text>
              <Text className="mt-1 text-sm" style={{ color: colors.textSecondary }}>{item.college} • {item.class}</Text>
            </View>

            <View className="flex-row">
              <TouchableOpacity className="py-2 px-2.5 rounded-lg ml-2" style={{ backgroundColor: item.status === 'present' ? '#bbf7d0' : colors.cardBg }} onPress={() => markAttendance(event.id, item.id, 'present')}>
                <Text className="text-sm" style={{ color: colors.textPrimary }}>Present</Text>
              </TouchableOpacity>
              <TouchableOpacity className="py-2 px-2.5 rounded-lg ml-2" style={{ backgroundColor: item.status === 'absent' ? '#fecaca' : colors.cardBg }} onPress={() => markAttendance(event.id, item.id, 'absent')}>
                <Text className="text-sm" style={{ color: colors.textPrimary }}>Absent</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}
