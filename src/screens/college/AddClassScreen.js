import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
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
    <View className="flex-1 p-5" style={{ backgroundColor: colors.backgroundColors ? colors.backgroundColors[0] : '#fff' }}>
      <View className="flex-1">
        <Text className="text-xl font-bold mb-3" style={{ color: colors.header }}>Add Class</Text>

        <Text className="text-base font-semibold mb-2" style={{ color: colors.textPrimary }}>Class name</Text>
        <TextInput
          placeholder="Class name (e.g. 2025-2026TY13)"
          placeholderTextColor={colors.textSecondary}
          value={className}
          onChangeText={setClassName}
          className="p-3 rounded-lg border mb-3"
          style={{ backgroundColor: colors.iconBg, borderColor: colors.border, color: colors.textPrimary }}
        />

        <TouchableOpacity className="p-3 rounded-lg items-center mt-3" style={{ backgroundColor: colors.accent }} onPress={onSave}>
          <Text className="text-white font-bold">Create Class</Text>
        </TouchableOpacity>

        <TouchableOpacity className="mt-3" onPress={() => goBack()}>
          <Text style={{ color: colors.textPrimary }}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
