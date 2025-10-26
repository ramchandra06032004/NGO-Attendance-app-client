import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { NavigationContext } from '../../context/NavigationContext';
import { AttendanceContext } from '../../context/AttendanceContext';
import { useTheme } from '../../context/ThemeContext';

export default function CollegeClassesScreen({ college }) {
  const { route, navigate, goBack } = useContext(NavigationContext);
  const { getClasses, addClass } = useContext(AttendanceContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;
  const classes = getClasses(college);
  const [newClass, setNewClass] = useState('');

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundColors ? colors.backgroundColors[0] : '#fff' }]}>
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.header }]}>Classes:</Text>

        <ScrollView style={{ maxHeight: 380 }}>
          {classes.map((c) => (
            <TouchableOpacity key={c} style={[styles.classItem, { backgroundColor: colors.iconBg, borderColor: colors.border }]} onPress={() => navigate('ClassStudents', { college, className: c })}>
              <Text style={{ color: colors.textPrimary }}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={{ marginTop: 12 }}>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.iconBg, marginTop: 8, borderWidth: 1, borderColor: colors.border }]} onPress={() => navigate('AddClass', { college })}>
            <Text style={{ color: colors.textPrimary }}>Add class (with students / upload)</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={{ marginTop: 12 }} onPress={() => goBack()}>
          <Text style={{ color: colors.textPrimary }}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  card: { padding: 16, borderRadius: 12, borderWidth: 1 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  classItem: { padding: 12, borderRadius: 8, marginBottom: 8 },
  input: { padding: 12, borderRadius: 8 },
  addBtn: { padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
});
