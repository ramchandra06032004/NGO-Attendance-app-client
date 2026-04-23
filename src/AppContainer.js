import React, { useContext, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, BackHandler } from "react-native";
import HomeScreen from "./screens/HomeScreen";
import NgoEventsScreen from "./screens/ngo/NgoEventsScreen";
import EventDetailScreen from "./screens/ngo/EventDetailScreen";
import EventInfoScreen from "./screens/ngo/EventInfoScreen";
import NgoDashboard from "./screens/ngo/NgoDashboard";
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
import CollegeExportScreen from "./screens/college/CollegeExportScreen";
import CollegeEventAttendanceScreen from "./screens/college/CollegeEventAttendanceScreen";
import AddStudentScreen from "./screens/college/AddStudentScreen";
import AddCollegeScreen from "./screens/admin/AddCollegeScreen";
import AddNgoScreen from "./screens/admin/AddNgoScreen";
import AddEventScreen from "./screens/ngo/AddEventScreen";
import AttendanceRecords from "./screens/ngo/AttendanceRecords";
import RegisteredStudentsScreen from "./screens/ngo/RegisteredStudentsScreen";
import EntityDetailScreen from "./screens/admin/EntityDetailScreen";
import StudentLoginScreen from "./screens/student/StudentLoginScreen";
import StudentDashboardWrapper from "./screens/student/StudentDashboardWrapper";
import StudentMyEventsScreen from "./screens/student/StudentMyEventsScreen";
// Internship screens
import NgoInternshipsScreen from "./screens/ngo/internship/NgoInternshipsScreen";
import CreateInternshipScreen from "./screens/ngo/internship/CreateInternshipScreen";
import InternshipApplicantsScreen from "./screens/ngo/internship/InternshipApplicantsScreen";
import StudentWorkLogsScreen from "./screens/ngo/internship/StudentWorkLogsScreen";
import StudentInternshipsScreen from "./screens/student/internship/StudentInternshipsScreen";
import StudentMyInternshipsScreen from "./screens/student/internship/StudentMyInternshipsScreen";
import SubmitWorkLogScreen from "./screens/student/internship/SubmitWorkLogScreen";
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
      } else if (userType === "student") {
        navigate("StudentDashboard", { student: user });
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
  if (isAuthenticated && (route.name === "NgoLogin" || route.name === "CollegeLogin" || route.name === "AdminLogin" || route.name === "StudentLogin")) {
    if (userType === "ngo") {
      return <NgoDashboard ngo={user} />;
    } else if (userType === "college") {
      return <CollegeClassesScreen college={user} />;
    } else if (userType === "admin") {
      return <AdminPanelScreen />;
    } else if (userType === "student") {
      return <StudentDashboardWrapper student={user} />;
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
      Screen = <NgoDashboard ngo={route.params?.ngo || user} />;
      break;
    case "EventDetail":
      Screen = <EventDetailScreen eventId={route.params?.eventId} />;
      break;
    case "EventInfo":
      Screen = <EventInfoScreen event={route.params?.event} route={route} />;
      break;
    case "SelectCollege":
      Screen = <SelectCollegeScreen eventId={route.params?.eventId} event={route.params?.event} />;
      break;
    case "StudentsList":
      Screen = (
        <StudentsListScreen
          key={`${route.params?.eventId}-${route.params?.college?._id || route.params?.college?.id}`}
          eventId={route.params?.eventId}
          college={route.params?.college}
          event={route.params?.event}
          registeredStudents={route.params?.registeredStudents}
          route={route}
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
          isNgoVolunteer={route.params?.isNgoVolunteer}
          ngo={route.params?.ngo}
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
    case "CollegeExport":
      Screen = (
        <CollegeExportScreen
          college={route.params?.college}
          eventsList={route.params?.eventsList}
        />
      );
      break;
    case "CollegeEventAttendance":
      Screen = (
        <CollegeEventAttendanceScreen
          event={route.params?.event}
          college={route.params?.college}
          accessToken={route.params?.accessToken}
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
    case "RegisteredStudents":
      Screen = <RegisteredStudentsScreen route={route} />;
      break;
    case "EntityDetail":
      Screen = <EntityDetailScreen entity={route.params?.entity} entityType={route.params?.entityType} />;
      break;
    case "StudentLogin":
      Screen = <StudentLoginScreen />;
      break;
    case "StudentDashboard":
      Screen = <StudentDashboardWrapper student={route.params?.student || user} />;
      break;
    case "StudentMyEvents":
      Screen = <StudentMyEventsScreen student={route.params?.student || user} />;
      break;
    // ─── Internship screens ───────────────────────────────────────────────────
    case "NgoInternships":
      Screen = <NgoInternshipsScreen ngo={route.params?.ngo || user} />;
      break;
    case "CreateInternship":
      Screen = <CreateInternshipScreen />;
      break;
    case "InternshipApplicants":
      Screen = <InternshipApplicantsScreen internship={route.params?.internship} />;
      break;
    case "StudentWorkLogs":
      Screen = (
        <StudentWorkLogsScreen
          internshipId={route.params?.internshipId}
          studentId={route.params?.studentId}
          studentName={route.params?.studentName}
          startDate={route.params?.startDate}
          endDate={route.params?.endDate}
        />
      );
      break;
    case "StudentInternships":
      Screen = <StudentInternshipsScreen student={route.params?.student || user} />;
      break;
    case "StudentMyInternships":
      Screen = <StudentMyInternshipsScreen student={route.params?.student || user} />;
      break;
    case "SubmitWorkLog":
      Screen = (
        <SubmitWorkLogScreen
          internshipId={route.params?.internshipId}
          internshipTitle={route.params?.internshipTitle}
          startDate={route.params?.startDate}
          endDate={route.params?.endDate}
          allowLateSubmissions={route.params?.allowLateSubmissions}
          totalDays={route.params?.totalDays}
          currentLogsCount={route.params?.currentLogsCount}
        />
      );
      break;
    // ─────────────────────────────────────────────────────────────────────────
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