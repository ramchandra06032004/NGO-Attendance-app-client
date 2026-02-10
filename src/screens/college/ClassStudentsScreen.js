import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { NavigationContext } from '../../context/NavigationContext';
import { AttendanceContext } from '../../context/AttendanceContext';
import { useTheme } from '../../context/ThemeContext';

export default function ClassStudentsScreen({ college, className }) {
  const { navigate, goBack } = useContext(NavigationContext);
  const { getStudentsByCollegeAndClass } = useContext(AttendanceContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  // Find the selected class
  const selectedClass = college?.classes?.find((c) => c.className === className);
  const students = selectedClass ? selectedClass.students : [];

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [isGridLayout, setIsGridLayout] = useState(false); // <--- LAYOUT STATE

  // Filter logic
  const filteredStudents = students.filter((student) =>
    (student.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.prn || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- RENDER COMPONENT: GRID CARD (Option 1) ---
  const renderGridItem = ({ item }) => (
    <View
      className="mb-3 p-4 rounded-2xl border items-center"
      style={{
        width: "48%", // Forces 2 items per row
        backgroundColor: colors.cardBg,
        borderColor: colors.border,
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
      }}
    >
      {/* Avatar */}
      <View
        className="w-14 h-14 rounded-full justify-center items-center mb-3"
        style={{ backgroundColor: colors.backgroundColors?.[1] || "#F3F4F6" }}
      >
        <Text className="font-bold text-xl" style={{ color: colors.accent }}>
          {item.name?.[0]?.toUpperCase()}
        </Text>
      </View>

      {/* Info */}
      <View className="items-center mb-3 w-full">
        <Text
          className="font-bold text-base text-center mb-1"
          numberOfLines={1}
          style={{ color: colors.textPrimary }}
        >
          {item.name}
        </Text>
        <Text className="text-xs text-center font-medium text-gray-400">
          {item.prn}
        </Text>
        <Text
          className="text-xs text-center"
          numberOfLines={1}
          style={{ color: colors.textSecondary }}
        >
          {item.department}
        </Text>
      </View>

      {/* Action Button */}
      <TouchableOpacity
        className="w-full py-2 rounded-lg border items-center"
        style={{ borderColor: colors.accent }}
        onPress={() =>
          navigate("StudentEvents", { college, studentId: item._id.toString() })
        }
      >
        <Text
          className="text-xs font-bold uppercase"
          style={{ color: colors.accent }}
        >
          View Events
        </Text>
      </TouchableOpacity>
    </View>
  );

  // --- RENDER COMPONENT: LIST ROW (Option 2) ---
  const renderListItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() =>
        navigate("StudentEvents", { college, studentId: item._id.toString() })
      }
      className="flex-row items-center px-5 py-3 border-b"
      style={{
        backgroundColor: colors.cardBg,
        borderColor: colors.border,
      }}
    >
      <View
        className="w-10 h-10 rounded-full justify-center items-center mr-3"
        style={{ backgroundColor: colors.iconBg }}
      >
        <Text className="font-bold text-sm" style={{ color: colors.accent }}>
          {item.name?.[0]?.toUpperCase()}
        </Text>
      </View>

      <View className="flex-1">
        <View className="flex-row items-baseline justify-between">
          <Text
            className="font-bold text-base"
            style={{ color: colors.textPrimary }}
          >
            {item.name}
          </Text>
          <Text className="text-xs font-mono" style={{ color: colors.textSecondary }}>
            {item.prn}
          </Text>
        </View>
        <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
          {item.department}
        </Text>
      </View>

      <View className="ml-2">
        <Text style={{ fontSize: 22, color: colors.textSecondary }}>›</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: colors.backgroundColors
          ? colors.backgroundColors[0]
          : "#F8F9FA",
      }}
    >
      {/* --- 1. HEADER --- */}
      <View
        className="px-5 pt-10 pb-4 border-b"
        style={{
          backgroundColor: colors.cardBg,
          borderColor: colors.border,
          elevation: 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
        }}
      >
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            onPress={() => goBack()}
            className="mr-4 p-2 rounded-full"
            style={{ backgroundColor: colors.backgroundColors?.[1] || "#F3F4F6" }}
          >
            <Text
              style={{
                fontSize: 18,
                color: colors.textPrimary,
                fontWeight: "bold",
              }}
            >
              ←
            </Text>
          </TouchableOpacity>
          <View>
            <Text
              className="text-xl font-bold"
              style={{ color: colors.header }}
            >
              {className}
            </Text>
            <Text className="text-xs" style={{ color: colors.textSecondary }}>
              {filteredStudents.length} / {students.length} Students
            </Text>
          </View>
        </View>

        {/* --- 2. SEARCH BAR + TOGGLE BUTTON --- */}
        <View className="flex-row gap-2">

          {/* Search Input Container */}
          <View
            className="flex-1 flex-row items-center px-4 py-2.5 rounded-xl border"
            style={{
              backgroundColor: colors.backgroundColors?.[1] || "#F3F4F6",
              borderColor: colors.border,
            }}
          >
            <Text
              style={{ fontSize: 22, color: colors.textSecondary, marginRight: 10 }}
            >
              ⌕
            </Text>

            <TextInput
              className="flex-1 text-base p-0"
              placeholder="Search by name or PRN"
              placeholderTextColor={colors.textSecondary}
              // ✅ FIX: Explicitly remove borders and outlines
              style={{
                color: colors.textPrimary,
                borderWidth: 0,          // Removes border on mobile
                outlineStyle: 'none',    // Removes black box on Web
              }}
              underlineColorAndroid="transparent" // Removes underline on Android
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <View className="bg-gray-300 rounded-full w-5 h-5 items-center justify-center">
                  <Text
                    style={{ fontSize: 10, color: "#fff", fontWeight: "bold" }}
                  >
                    ✕
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* TOGGLE BUTTON */}
          <TouchableOpacity
            className="w-12 items-center justify-center rounded-xl border"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
            }}
            onPress={() => setIsGridLayout(!isGridLayout)}
          >
            <Text style={{ fontSize: 22, color: colors.textPrimary }}>
              {isGridLayout ? "☰" : "⊞"}
            </Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* --- 3. DYNAMIC STUDENT LIST --- */}
      <FlatList
        // Key forces re-render when switching layouts to prevent style bugs
        key={isGridLayout ? "grid-layout" : "list-layout"}

        // Use filteredStudents so search works
        data={filteredStudents}

        // Dynamic Props
        numColumns={isGridLayout ? 2 : 1}
        columnWrapperStyle={isGridLayout ? { justifyContent: "space-between" } : undefined}
        renderItem={isGridLayout ? renderGridItem : renderListItem}

        // Container Styles
        contentContainerStyle={{
          paddingHorizontal: isGridLayout ? 20 : 0, // Grid needs padding, List is full width
          paddingTop: 20,
          paddingBottom: 120
        }}
        showsVerticalScrollIndicator={false}

        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Text className="text-gray-400 text-sm italic">
              {searchQuery ? "No matching students." : "No students in this class."}
            </Text>
          </View>
        }
      />

      {/* --- 4. FLOATING ADD BUTTON --- */}
      <View
        className="absolute bottom-0 left-0 right-0 p-5 border-t"
        style={{
          backgroundColor: colors.cardBg,
          borderColor: colors.border,
        }}
      >
        <TouchableOpacity
          className="w-full py-4 rounded-xl items-center justify-center shadow-sm"
          style={{ backgroundColor: colors.accent }}
          onPress={() => navigate("AddStudent", { college, className })}
        >
          <Text className="text-white font-bold text-sm uppercase tracking-wider">
            + Add New Student
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}