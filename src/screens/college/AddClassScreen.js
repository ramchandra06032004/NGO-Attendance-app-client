import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NavigationContext } from '../../context/NavigationContext';
import { useTheme } from '../../context/ThemeContext';
import * as api from '../../../apis/api';

export default function AddClassScreen({ college }) {
  const { goBack } = useContext(NavigationContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  const [className, setClassName] = useState('');

  async function onSave() {
    if (!className.trim()) {
      Alert.alert('Error', 'Please enter a class name');
      return;
    }

    try {
      const response = await fetch(api.addClassAPI, {
        method: 'POST',
        credentials:'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ className: className.trim() })
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Class added successfully');
        goBack();
      } else {
        Alert.alert('Error', result.message || 'Failed to add class');
      }
    } catch (error) {
      console.error('Error adding class:', error);
      Alert.alert('Error', 'Failed to add class');
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundColors ? colors.backgroundColors[0] : '#fff' }]}>
      <View style={styles.card}>
        <Text style={[styles.title, { color: colors.header }]}>Add Class</Text>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Class name</Text>
        <TextInput
          placeholder="Class name (e.g. 2025-2026TY13)"
          placeholderTextColor={colors.textSecondary}
          value={className}
          onChangeText={setClassName}
          style={[styles.input, { backgroundColor: colors.iconBg, borderColor: colors.border, color: colors.textPrimary }]}
        />

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accent }]} onPress={onSave}>
          <Text style={{ color: '#fff' }}>Create Class</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ marginTop: 12 }} onPress={() => goBack()}>
          <Text style={{ color: colors.textPrimary }}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  card: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 12 },
  saveBtn: { padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
});
