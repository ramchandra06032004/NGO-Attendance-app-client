import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { AttendanceContext } from '../../context/AttendanceContext';
import { NavigationContext } from '../../context/NavigationContext';
import { useTheme } from '../../context/ThemeContext';

export default function SelectCollegeScreen({ eventId }) {
  const { getColleges } = useContext(AttendanceContext);
  const { navigate, goBack } = useContext(NavigationContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  const colleges = getColleges();
  const [selected, setSelected] = useState(colleges[0] || '');

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundColors ? colors.backgroundColors[0] : '#fff' }]}>
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.header }]}>Select College</Text>
        <ScrollView style={[styles.picker, { backgroundColor: colors.iconBg, borderColor: colors.border }]}>
          {colleges.map(c => (
            <Pressable key={c} onPress={() => setSelected(c)} style={[styles.item, selected === c && { backgroundColor: darkMode ? '#ffffff12' : '#fef3c7' }]}>
              <Text style={{ color: colors.textPrimary }}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <TouchableOpacity style={[styles.action, { backgroundColor: colors.accent }]} onPress={() => navigate('StudentsList', { eventId, college: selected })}>
          <Text style={styles.actionText}>Get Students list</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.link} onPress={() => goBack()}>
          <Text style={{ color: colors.textPrimary }}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  card: { width: '100%', maxWidth: 520, padding: 20, borderRadius: 12, borderWidth: 1 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 10 },
  picker: { maxHeight: 240, marginBottom: 12, borderRadius: 8 },
  item: { padding: 12, borderRadius: 8 },
  action: { marginTop: 12, padding: 12, borderRadius: 10, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: '700' },
  link: { marginTop: 12 },
});
