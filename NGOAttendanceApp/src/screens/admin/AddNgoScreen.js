import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { AttendanceContext } from '../../context/AttendanceContext';
import { NavigationContext } from '../../context/NavigationContext';
import { useTheme } from '../../context/ThemeContext';

export default function AddNgoScreen() {
  const { addNgo } = useContext(AttendanceContext);
  const { goBack } = useContext(NavigationContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [reg, setReg] = useState('');

  function onSubmit() {
    if (!name.trim()) return;
    addNgo(name.trim());
    goBack();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundColors ? colors.backgroundColors[0] : '#fff' }]}>
      <ScrollView contentContainerStyle={styles.card}>
        <Text style={[styles.title, { color: colors.header }]}>Add NGO</Text>
        <TextInput placeholder="Name" placeholderTextColor={colors.textSecondary} value={name} onChangeText={setName} style={[styles.input, { backgroundColor: colors.iconBg, borderColor: colors.border, color: colors.textPrimary }]} />
        <TextInput placeholder="Email" placeholderTextColor={colors.textSecondary} value={email} onChangeText={setEmail} style={[styles.input, { backgroundColor: colors.iconBg, borderColor: colors.border, color: colors.textPrimary }]} />
        <TextInput placeholder="Address" placeholderTextColor={colors.textSecondary} value={address} onChangeText={setAddress} style={[styles.input, { backgroundColor: colors.iconBg, borderColor: colors.border, color: colors.textPrimary }]} />
        <TextInput placeholder="Create Password" secureTextEntry value={password} onChangeText={setPassword} style={[styles.input, { backgroundColor: colors.iconBg, borderColor: colors.border, color: colors.textPrimary }]} />
        <TextInput placeholder="Mobile" value={mobile} onChangeText={setMobile} style={[styles.input, { backgroundColor: colors.iconBg, borderColor: colors.border, color: colors.textPrimary }]} placeholderTextColor={colors.textSecondary} />
        <TextInput placeholder="Registration No." value={reg} onChangeText={setReg} style={[styles.input, { backgroundColor: colors.iconBg, borderColor: colors.border, color: colors.textPrimary }]} placeholderTextColor={colors.textSecondary} />

        <TouchableOpacity style={[styles.submit, { backgroundColor: colors.accent }]} onPress={onSubmit}><Text style={{ color: '#fff' }}>Add NGO</Text></TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 12 }} onPress={() => goBack()}><Text style={{ color: colors.textPrimary }}>Back</Text></TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  input: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 12 },
  submit: { padding: 12, borderRadius: 8, alignItems: 'center' },
});
