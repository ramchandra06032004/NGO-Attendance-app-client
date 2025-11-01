import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { AttendanceContext } from '../../context/AttendanceContext';
import { NavigationContext } from '../../context/NavigationContext';
import { useTheme } from '../../context/ThemeContext';

export default function NgoEventsScreen({ ngo: loggedNgo }) {
  const { events } = useContext(AttendanceContext);
  const { navigate, goBack } = useContext(NavigationContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            (colors.backgroundColors && colors.backgroundColors[0]) ||
            styles.container.backgroundColor
        }
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Text style={{ color: colors.textPrimary }}>Back</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.header }]}>Events</Text>

        {loggedNgo ? (
          <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ marginRight: 10, fontWeight: '700', color: colors.textPrimary }}>
              {loggedNgo}
            </Text>
            <TouchableOpacity
              style={[styles.logoutBtn, { backgroundColor: colors.accent }]}
              onPress={() => navigate('Home')}
            >
              <Text style={{ color: '#fff' }}>Logout</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* Event List */}
      <FlatList
        data={events}
        keyExtractor={item => item.id}
        style={{ width: '100%' }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.eventCard,
              { backgroundColor: colors.cardBg, borderColor: colors.border }
            ]}
            onPress={() => navigate('EventInfo', { eventId: item.id })}
          >
            <Text style={[styles.eventTitle, { color: colors.textPrimary }]}>{item.title}</Text>
            <Text style={[styles.eventCount, { color: colors.textSecondary }]}>
              {item.students?.length || 0} students
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Add Event Button */}
      {loggedNgo && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.accent }]}
          onPress={() => navigate('AddEvent')}
        >
          <Text style={styles.fabText}>Add Event</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#eef2ff'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  backBtn: {
    paddingRight: 12
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a'
  },
  eventCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a'
  },
  eventCount: {
    color: '#64748b',
    marginTop: 6
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    backgroundColor: '#0ea5a4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 4
  },
  fabText: {
    color: '#fff',
    fontWeight: '700'
  },
  logoutBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8
  }
});
