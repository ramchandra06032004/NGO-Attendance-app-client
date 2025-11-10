// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   ActivityIndicator,
// } from "react-native";
// import { ngo_host } from "../../../apis/api";
// import { useTheme } from "../../context/ThemeContext";

// // AttendanceRecords.js

// export default function AttendanceRecords({ route = {} }) {
//   const { params = {} } = route;
//   const event = params.event;
//   const { darkMode, lightTheme, darkTheme } = useTheme();
//   const colors = darkMode ? darkTheme : lightTheme;

//   const [attendanceData, setAttendanceData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (event && event._id) {
//       fetchAttendance();
//     } else {
//       setLoading(false);
//       setError("Event data not available");
//     }
//   }, [event]);

//   const fetchAttendance = async () => {
//     try {
//       const response = await fetch(
//         `${ngo_host}/event/${event._id}/attendance`,
//         {
//           method: "GET",
//           credentials: "include",
//           headers: {
//             Accept: "application/json",
//             "Content-Type": "application/json",
//           },
//         }
//       );
//       if (!response.ok) {
//         throw new Error("Failed to fetch attendance data");
//       }
//       const data = await response.json();
//       setAttendanceData(data?.data);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <View
//         style={[
//           styles.center,
//           {
//             backgroundColor: colors.backgroundColors
//               ? colors.backgroundColors[0]
//               : styles.center.backgroundColor,
//           },
//         ]}
//       >
//         <ActivityIndicator size="large" color={colors.accent} />
//         <Text style={{ color: colors.textPrimary }}>
//           Loading attendance records...
//         </Text>
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View
//         style={[
//           styles.center,
//           {
//             backgroundColor: colors.backgroundColors
//               ? colors.backgroundColors[0]
//               : styles.center.backgroundColor,
//           },
//         ]}
//       >
//         <Text style={[styles.error, { color: colors.textPrimary }]}>
//           Error: {error}
//         </Text>
//       </View>
//     );
//   }

//   const getCollegeName = (classId) => {
//     const college = attendanceData.colleges?.find((col) =>
//       col.classes.includes(classId)
//     );
//     return college ? college.name : "Unknown College";
//   };

//   return (
//     <View
//       style={[
//         styles.container,
//         {
//           backgroundColor: colors.backgroundColors
//             ? colors.backgroundColors[0]
//             : styles.container.backgroundColor,
//         },
//       ]}
//     >
//       <Text style={[styles.title, { color: colors.header }]}>
//         Attendance Records for {attendanceData.event?.aim || "Event"}
//       </Text>
//       <Text style={[styles.eventDetails, { color: colors.textSecondary }]}>
//         📍 Location: {attendanceData.event?.location}
//       </Text>
//       <Text style={[styles.eventDetails, { color: colors.textSecondary }]}>
//         📅 Date:{" "}
//         {new Date(attendanceData.event?.eventDate).toLocaleDateString()}
//       </Text>
//       <Text style={[styles.totalPresent, { color: colors.textPrimary }]}>
//         Total Students Present: {attendanceData.totalStudentsPresent}
//       </Text>
//       {!attendanceData.attendance || attendanceData.attendance.length === 0 ? (
//         <Text style={[styles.noRecords, { color: colors.textSecondary }]}>
//           No attendance records found.
//         </Text>
//       ) : (
//         <FlatList
//           data={attendanceData.attendance}
//           keyExtractor={(item) => item._id}
//           renderItem={({ item }) => (
//             <View
//               style={[
//                 styles.record,
//                 { backgroundColor: colors.cardBg, borderColor: colors.border },
//               ]}
//             >
//               <Text style={[styles.college, { color: colors.textPrimary }]}>
//                 College: {getCollegeName(item.classId._id)}
//               </Text>
//               <Text style={[styles.student, { color: colors.textPrimary }]}>
//                 Student: {item.name}
//               </Text>
//               <Text
//                 style={[styles.department, { color: colors.textSecondary }]}
//               >
//                 Department: {item.department}
//               </Text>
//               <Text style={[styles.className, { color: colors.textSecondary }]}>
//                 Class: {item.classId.className}
//               </Text>
//             </View>
//           )}
//         />
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//   },
//   center: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: "700",
//     marginBottom: 12,
//   },
//   eventDetails: {
//     fontSize: 14,
//     marginBottom: 8,
//   },
//   totalPresent: {
//     fontSize: 16,
//     fontWeight: "bold",
//     marginBottom: 20,
//   },
//   record: {
//     backgroundColor: "#fff",
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 12,
//     borderWidth: 1,
//   },
//   college: {
//     fontSize: 16,
//     fontWeight: "600",
//     marginBottom: 8,
//   },
//   student: {
//     fontSize: 14,
//     marginBottom: 4,
//   },
//   department: {
//     fontSize: 14,
//     marginBottom: 4,
//   },
//   className: {
//     fontSize: 14,
//   },
//   noRecords: {
//     textAlign: "center",
//     marginTop: 20,
//     fontSize: 16,
//   },
//   error: {
//     color: "red",
//   },
// });
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { ngo_host } from "../../../apis/api";
import { useTheme } from "../../context/ThemeContext";

// AttendanceRecords.js

export default function AttendanceRecords({ route = {} }) {
  const { params = {} } = route;
  const event = params.event;
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (event && event._id) {
      fetchAttendance();
    } else {
      setLoading(false);
      setError("Event data not available");
    }
  }, [event]);

  const fetchAttendance = async () => {
    try {
      const response = await fetch(
        `${ngo_host}/event/${event._id}/attendance`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch attendance data");
      }
      const data = await response.json();
      setAttendanceData(data?.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.center,
          {
            backgroundColor: colors.backgroundColors
              ? colors.backgroundColors[0]
              : styles.center.backgroundColor,
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.textPrimary }}>
          Loading attendance records...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.center,
          {
            backgroundColor: colors.backgroundColors
              ? colors.backgroundColors[0]
              : styles.center.backgroundColor,
          },
        ]}
      >
        <Text style={[styles.error, { color: colors.textPrimary }]}>
          Error: {error}
        </Text>
      </View>
    );
  }

  const getCollegeName = (classId) => {
    const college = attendanceData.colleges?.find((col) =>
      col.classes.includes(classId)
    );
    return college ? college.name : "Unknown College";
  };

  const renderAttendanceRow = ({ item }) => (
    <View
      style={[
        styles.tableRow,
        { backgroundColor: colors.cardBg, borderColor: colors.border },
      ]}
    >
      <Text
        style={[
          styles.tableCell,
          styles.studentNameCell,
          { color: colors.textPrimary },
        ]}
      >
        {item.name}
      </Text>
      <Text
        style={[
          styles.tableCell,
          styles.collegeCell,
          { color: colors.textPrimary },
        ]}
      >
        {getCollegeName(item.classId._id)}
      </Text>
      <Text
        style={[
          styles.tableCell,
          styles.departmentCell,
          { color: colors.textSecondary },
        ]}
      >
        {item.department}
      </Text>
      <Text
        style={[
          styles.tableCell,
          styles.classNameCell,
          { color: colors.textSecondary },
        ]}
      >
        {item.classId.className}
      </Text>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundColors
            ? colors.backgroundColors[0]
            : styles.container.backgroundColor,
        },
      ]}
    >
      <Text style={[styles.title, { color: colors.header }]}>
        Attendance Records for {attendanceData.event?.aim || "Event"}
      </Text>
      <Text style={[styles.eventDetails, { color: colors.textSecondary }]}>
        📍 Location: {attendanceData.event?.location}
      </Text>
      <Text style={[styles.eventDetails, { color: colors.textSecondary }]}>
        📅 Date:{" "}
        {new Date(attendanceData.event?.eventDate).toLocaleDateString()}
      </Text>
      <Text style={[styles.totalPresent, { color: colors.textPrimary }]}>
        Total Students Present: {attendanceData.totalStudentsPresent}
      </Text>
      {!attendanceData.attendance || attendanceData.attendance.length === 0 ? (
        <Text style={[styles.noRecords, { color: colors.textSecondary }]}>
          No attendance records found.
        </Text>
      ) : (
        <>
          {/* Table Header */}
          <View
            style={[styles.tableHeader, { backgroundColor: colors.headerBg }]}
          >
            <Text
              style={[
                styles.tableHeaderCell,
                styles.studentNameCell,
                { color: colors.headerText },
              ]}
            >
              Student
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                styles.collegeCell,
                { color: colors.headerText },
              ]}
            >
              College
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                styles.departmentCell,
                { color: colors.headerText },
              ]}
            >
              Department
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                styles.classNameCell,
                { color: colors.headerText },
              ]}
            >
              Class
            </Text>
          </View>

          {/* Table Data */}
          <FlatList
            data={attendanceData.attendance}
            keyExtractor={(item) => item._id}
            renderItem={renderAttendanceRow}
            style={styles.tableList}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  eventDetails: {
    fontSize: 14,
    marginBottom: 8,
  },
  totalPresent: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 20,
  },
  // --- New/Updated Styles for Table View ---
  tableList: {
    // Optional styling for the FlatList container
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderColor: "#ccc",
    marginBottom: 5,
    borderRadius: 8,
    overflow: "hidden", // Ensures background color respects borderRadius
  },
  tableHeaderCell: {
    fontWeight: "bold",
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 4, // Add some padding
  },
  tableRow: {
    flexDirection: "row",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    alignItems: "center", // Vertically align content in the row
  },
  tableCell: {
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  // Flex proportions for the columns to ensure they align and fit
  studentNameCell: {
    flex: 3, // Student name might need more space
  },
  collegeCell: {
    flex: 3, // College name might also need more space
  },
  departmentCell: {
    flex: 2,
  },
  classNameCell: {
    flex: 2,
  },
  // --- Original Styles (Removed/Replaced as they are no longer used for the list items) ---
  // record: { ... } (Replaced by tableRow)
  // college: { ... } (Replaced by tableCell)
  // student: { ... } (Replaced by tableCell)
  // department: { ... } (Replaced by tableCell)
  // className: { ... } (Replaced by tableCell)
  // --------------------------------------------------------------------------------------
  noRecords: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },
  error: {
    color: "red",
  },
});
