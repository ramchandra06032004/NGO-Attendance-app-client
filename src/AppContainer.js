import React, { useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import NgoEventsScreen from './screens/ngo/NgoEventsScreen';
import EventDetailScreen from './screens/ngo/EventDetailScreen';
import EventInfoScreen from './screens/ngo/EventInfoScreen';
import SelectCollegeScreen from './screens/ngo/SelectCollegeScreen';
import StudentsListScreen from './screens/ngo/StudentsListScreen';
import CollegeClassesScreen from './screens/college/CollegeClassesScreen';
import ClassStudentsScreen from './screens/college/ClassStudentsScreen';
import StudentEventsScreen from './screens/college/StudentEventsScreen';
import NgoLoginScreen from './screens/ngo/NgoLoginScreen';
import CollegeLoginScreen from './screens/college/CollegeLoginScreen';
import AdminLoginScreen from './screens/admin/AdminLoginScreen';
import AdminPanelScreen from './screens/admin/AdminPanelScreen';
import AddClassScreen from './screens/college/AddClassScreen';
import AddCollegeScreen from './screens/admin/AddCollegeScreen';
import AddNgoScreen from './screens/admin/AddNgoScreen';
import { NavigationContext } from './context/NavigationContext';

export default function AppContainer() {
  console.log('AppContainer render');
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
    case 'EventInfo':
      Screen = <EventInfoScreen eventId={route.params?.eventId} />;
      break;
    case 'SelectCollege':
      Screen = <SelectCollegeScreen eventId={route.params?.eventId} />;
      break;
    case 'StudentsList':
      Screen = <StudentsListScreen eventId={route.params?.eventId} college={route.params?.college} />;
      break;
    case 'CollegeClasses':
      Screen = <CollegeClassesScreen college={route.params?.college} />;
      break;
    case 'AddClass':
      Screen = <AddClassScreen college={route.params?.college} />;
      break;
    case 'AddCollege':
      Screen = <AddCollegeScreen />;
      break;
    case 'AddNgo':
      Screen = <AddNgoScreen />;
      break;
    case 'ClassStudents':
      Screen = <ClassStudentsScreen college={route.params?.college} className={route.params?.className} />;
      break;
    case 'StudentEvents':
      Screen = <StudentEventsScreen college={route.params?.college} studentId={route.params?.studentId} />;
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
