import React, { useContext, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, BackHandler } from "react-native";
import HomeScreen from "./screens/HomeScreen";
import NgoEventsScreen from "./screens/ngo/NgoEventsScreen";
import EventDetailScreen from "./screens/ngo/EventDetailScreen";
import EventInfoScreen from "./screens/ngo/EventInfoScreen";
import SelectCollegeScreen from "./screens/ngo/SelectCollegeScreen";
import StudentsListScreen from "./screens/ngo/StudentsListScreen";
import CollegeClassesScreen from "./screens/college/CollegeClassesScreen";
import ClassStudentsScreen from "./screens/college/ClassStudentsScreen";
import StudentEventsScreen from "./screens/college/StudentEventsScreen";
import NgoLoginScreen from "./screens/ngo/NgoLoginScreen";
import CollegeLoginScreen from "./screens/college/CollegeLoginScreen";
import AdminLoginScreen from "./screens/admin/AdminLoginScreen";
import AdminPanelScreen from "./screens/admin/AdminPanelScreen";
import RegisterAdminScreen from "./screens/admin/RegisterAdminScreen";
import AddClassScreen from "./screens/college/AddClassScreen";
import AddStudentScreen from "./screens/college/AddStudentScreen";
import AddCollegeScreen from "./screens/admin/AddCollegeScreen";
import AddNgoScreen from "./screens/admin/AddNgoScreen";
import AddEventScreen from "./screens/ngo/AddEventScreen";
import AttendanceRecords from "./screens/ngo/AttendanceRecords";
import EntityDetailScreen from "./screens/admin/EntityDetailScreen";
import { NavigationContext } from "./context/NavigationContext";
import { AuthContext } from "./context/AuthContext";
import Toast from "react-native-toast-message";

export default function AppContainer() {

  const { route, navigate, goBack } = useContext(NavigationContext);
  console.log("AppContainer render, current route:", route.name);
  const { loading, isAuthenticated, userType, user } = useContext(AuthContext);

  // Auto-redirect ONLY on app startup when loading changes
  useEffect(() => {
    if (!loading && isAuthenticated && route.name === "Home") {
      // Only redirect if user is authenticated AND on Home page
      if (userType === "ngo") {
        navigate("NgoEvents", { ngo: user });
      } else if (userType === "college") {
        navigate("CollegeClasses", { college: user });
      } else if (userType === "admin") {
        navigate("AdminPanel");
      }
    }
  }, [loading]); // Only depend on loading, not on route changes

  // Handle Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // If we're on the Home screen, allow default behavior (exit app)
      if (route.name === 'Home') {
        return false; // Let the system handle it (exit app)
      }

      // Otherwise, navigate back within the app
      goBack();
      return true; // Prevent default behavior (don't exit app)
    });

    // Cleanup listener on unmount
    return () => backHandler.remove();
  }, [route.name, goBack]); // Re-register when route changes

  // Show loading screen while validating token
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#0ea5a4" />
      </View>
    );
  }

  // Block access to login screens if already authenticated
  if (isAuthenticated && (route.name === "NgoLogin" || route.name === "CollegeLogin" || route.name === "AdminLogin")) {
    if (userType === "ngo") {
      return <NgoEventsScreen ngo={user} />;
    } else if (userType === "college") {
      return <CollegeClassesScreen college={user} />;
    } else if (userType === "admin") {
      return <AdminPanelScreen />;
    }
  }

  let Screen = null;
  switch (route.name) {
    case "Home":
      Screen = <HomeScreen />;
      break;
    case "NgoLogin":
      Screen = <NgoLoginScreen />;
      break;
    case "CollegeLogin":
      Screen = <CollegeLoginScreen />;
      break;
    case "AdminLogin":
      Screen = <AdminLoginScreen />;
      break;
    case "NgoEvents":
      Screen = <NgoEventsScreen ngo={route.params?.ngo || user} />;
      break;
    case "EventDetail":
      Screen = <EventDetailScreen eventId={route.params?.eventId} />;
      break;
    case "EventInfo":
      Screen = <EventInfoScreen event={route.params?.event} route={route} />;
      break;
    case "SelectCollege":
      Screen = <SelectCollegeScreen eventId={route.params?.eventId} />;
      break;
    case "StudentsList":
      Screen = (
        <StudentsListScreen
          eventId={route.params?.eventId}
          college={route.params?.college}
        />
      );
      break;
    case "CollegeClasses":
      Screen = <CollegeClassesScreen college={route.params?.college || user} />;
      break;
    case "AddClass":
      Screen = <AddClassScreen college={route.params?.college} />;
      break;
    case "AddStudent":
      Screen = (
        <AddStudentScreen
          college={route.params?.college}
          className={route.params?.className}
        />
      );
      break;
    case "AddCollege":
      Screen = <AddCollegeScreen />;
      break;
    case "AddNgo":
      Screen = <AddNgoScreen />;
      break;
    case "ClassStudents":
      Screen = (
        <ClassStudentsScreen
          college={route.params?.college}
          className={route.params?.className}
        />
      );
      break;
    case "StudentEvents":
      Screen = (
        <StudentEventsScreen
          college={route.params?.college}
          studentId={route.params?.studentId}
        />
      );
      break;
    case "AdminPanel":
      Screen = <AdminPanelScreen />;
      break;
    case "RegisterAdmin":
      Screen = <RegisterAdminScreen />;
      break;
    case "AddEvent":
      Screen = <AddEventScreen />;
      break;
    case "AttendanceRecords":
      Screen = <AttendanceRecords route={route} />;
      break;
    case "EntityDetail":
      Screen = <EntityDetailScreen entity={route.params?.entity} entityType={route.params?.entityType} />;
      break;
    default:
      Screen = <HomeScreen />;
  }

  return (
    <View style={styles.container}>
      {Screen}
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
});