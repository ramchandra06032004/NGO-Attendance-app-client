import React, { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import NgoEventsScreen from './screens/NgoEventsScreen';
import EventDetailScreen from './screens/EventDetailScreen';
import CollegeRecordsScreen from './screens/CollegeRecordsScreen';
import NgoLoginScreen from './screens/NgoLoginScreen';
import CollegeLoginScreen from './screens/CollegeLoginScreen';
import AdminLoginScreen from './screens/AdminLoginScreen';
import AdminPanelScreen from './screens/AdminPanelScreen';
import { NavigationContext } from './context/NavigationContext';

export default function AppContainer() {
  const { route } = useContext(NavigationContext);

  let Screen = null;
  switch (route.name) {
    case 'Home':
      Screen = <HomeScreen />;
      break;
    case 'NgoLogin':
      Screen = <NgoLoginScreen />;
      break;
    case 'CollegeLogin':
      Screen = <CollegeLoginScreen />;
      break;
    case 'NgoEvents':
      Screen = <NgoEventsScreen ngo={route.params?.ngo} />;
      break;
    case 'EventDetail':
      Screen = <EventDetailScreen eventId={route.params?.eventId} />;
      break;
    case 'CollegeRecords':
      Screen = <CollegeRecordsScreen college={route.params?.college} />;
      break;
    case 'AdminLogin':
      Screen = <AdminLoginScreen />;
      break;
    case 'AdminPanel':
      Screen = <AdminPanelScreen />;
      break;
    default:
      Screen = <HomeScreen />;
  }

  return <View style={styles.container}>{Screen}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
