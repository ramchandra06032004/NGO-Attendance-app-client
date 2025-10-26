import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { AttendanceContext } from '../../context/AttendanceContext';
import { NavigationContext } from '../../context/NavigationContext';
import { useTheme } from '../../context/ThemeContext';

export default function AdminPanelScreen() {
  const { addCollege, addNgo, colleges, ngos } = useContext(AttendanceContext);
  const { navigate } = useContext(NavigationContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;
  const [newCollege, setNewCollege] = useState('');
  const [newNgo, setNewNgo] = useState('');

  return (
    <View style={[styles.container, { backgroundColor: (colors.backgroundColors && colors.backgroundColors[0]) || styles.container.backgroundColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.header }]}>Admin Panel</Text>
        <TouchableOpacity onPress={() => navigate('Home')}><Text style={{ color: colors.textPrimary }}>Home</Text></TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Colleges</Text>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.accent }]} onPress={() => navigate('AddCollege')}><Text style={{ color: '#fff' }}>+ Add</Text></TouchableOpacity>
        </View>

        <FlatList data={colleges} keyExtractor={i => i} renderItem={({ item }) => <Text style={{ paddingVertical: 6, color: colors.textPrimary }}>{item}</Text>} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>NGOs</Text>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.accent }]} onPress={() => navigate('AddNgo')}><Text style={{ color: '#fff' }}>+ Add</Text></TouchableOpacity>
        </View>

        <FlatList data={ngos} keyExtractor={i => i} renderItem={({ item }) => <Text style={{ paddingVertical: 6, color: colors.textPrimary }}>{item}</Text>} />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f0fdf4' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#065f46' },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 12 },
  cardTitle: { fontWeight: '700', marginBottom: 8 },
  input: { flex: 1, backgroundColor: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ecfccb' },
  addBtn: { backgroundColor: '#10b981', padding: 10, borderRadius: 8, marginLeft: 8, justifyContent: 'center' },
});
