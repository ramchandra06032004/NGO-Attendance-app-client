import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Modal, Pressable, ScrollView } from 'react-native';
import { AttendanceContext } from '../../context/AttendanceContext';
import { NavigationContext } from '../../context/NavigationContext';
import { useTheme } from '../../context/ThemeContext';

export default function NgoEventsScreen({ ngo: loggedNgo }) {
  const { events, addEvent } = useContext(AttendanceContext);
  const { navigate, goBack } = useContext(NavigationContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const { getColleges } = useContext(AttendanceContext);
  const colleges = getColleges();
  const [selectedCollege, setSelectedCollege] = useState(colleges[0] || '');

  return (
    <View style={[styles.container, { backgroundColor: (colors.backgroundColors && colors.backgroundColors[0]) || styles.container.backgroundColor }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}><Text style={{color: colors.textPrimary}}>Back</Text></TouchableOpacity>
        <Text style={[styles.title, { color: colors.header }]}>Events</Text>
        {loggedNgo ? (
          <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ marginRight: 10, fontWeight: '700', color: colors.textPrimary }}>{loggedNgo}</Text>
            <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: colors.accent }]} onPress={() => navigate('Home')}><Text style={{ color: '#fff' }}>Logout</Text></TouchableOpacity>
          </View>
        ) : null}
      </View>

      <FlatList
        data={events}
        keyExtractor={i => i.id}
        style={{ width: '100%' }}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.eventCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]} onPress={() => navigate('EventInfo', { eventId: item.id })}>
            <Text style={[styles.eventTitle, { color: colors.textPrimary }]}>{item.title}</Text>
            <Text style={[styles.eventCount, { color: colors.textSecondary }]}>{item.students.length} students</Text>
          </TouchableOpacity>
        )}
      />

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.header }]}>Add Event</Text>
            <TextInput placeholder="Event title" placeholderTextColor={colors.textSecondary} value={newTitle} onChangeText={setNewTitle} style={[styles.input, { backgroundColor: colors.iconBg, borderColor: colors.border, color: colors.textPrimary }]} />

            <TextInput placeholder="Short description" placeholderTextColor={colors.textSecondary} value={newDescription} onChangeText={setNewDescription} style={[styles.input, { backgroundColor: colors.iconBg, borderColor: colors.border, color: colors.textPrimary, marginTop: 8 }]} multiline />

            <Text style={{ marginTop: 8, marginBottom: 6, color: colors.textPrimary }}>Select college</Text>
            <ScrollView style={[styles.picker, { backgroundColor: colors.iconBg, borderColor: colors.border }]}>
              {colleges.map(c => (
                <Pressable key={c} onPress={() => setSelectedCollege(c)} style={[styles.pickerItem, selectedCollege === c && styles.pickerItemActive, selectedCollege === c && { backgroundColor: darkMode ? '#ffffff12' : '#e0f2fe' }]}>
                  <Text style={{ color: selectedCollege === c ? colors.header : colors.textPrimary }}>{c}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <TouchableOpacity style={[styles.addBtn, { flex: 1, backgroundColor: colors.accent }]} onPress={() => {
                if (newTitle.trim()) { addEvent(newTitle.trim(), selectedCollege, newDescription.trim()); setNewTitle(''); setNewDescription(''); setSelectedCollege(colleges[0] || ''); setModalVisible(false); }
              }}>
                <Text style={{ color: '#fff' }}>Create</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelBtn, { marginLeft: 10, backgroundColor: colors.cardBg }]} onPress={() => setModalVisible(false)}>
                <Text style={{ color: colors.textPrimary }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.accent }]} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+ Add Event</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#eef2ff' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backBtn: { paddingRight: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  eventCard: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10 },
  eventTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  eventCount: { color: '#64748b', marginTop: 6 },
  input: { flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 10, marginRight: 10 },
  addBtn: { backgroundColor: '#06b6d4', padding: 12, borderRadius: 10, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#fff', padding: 12, borderRadius: 10, alignItems: 'center' },
  fab: { position: 'absolute', right: 20, bottom: 24, backgroundColor: '#0ea5a4', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 30, elevation: 4 },
  fabText: { color: '#fff', fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(2,6,23,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  picker: { maxHeight: 150, backgroundColor: '#f8fafc', borderRadius: 8 },
  pickerItem: { padding: 12 },
  pickerItemActive: { backgroundColor: '#e0f2fe' },
  logoutBtn: { backgroundColor: '#ef4444', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 },
});
