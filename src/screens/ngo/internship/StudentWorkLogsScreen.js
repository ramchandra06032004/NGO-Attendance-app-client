import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { NavigationContext } from "../../../context/NavigationContext";
import { AuthContext } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import * as api from "../../../../apis/api";
import { ChevronLeft, ClipboardList } from "lucide-react-native";

export default function StudentWorkLogsScreen({ internshipId, studentId, studentName, startDate, endDate, allowLateSubmissions }) {
  const { goBack, navigate } = useContext(NavigationContext);
  const { accessToken, userType } = useContext(AuthContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;
  const isStudent = userType?.toLowerCase() === "student";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchWorkLogs();
  }, []);

  const fetchWorkLogs = async () => {
    try {
      const endpoint = isStudent
        ? api.studentWorkLogsAPI(internshipId)
        : api.ngoInternshipWorkLogsAPI(internshipId, studentId);

      const response = await fetch(endpoint, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const res = await response.json();
      if (response.ok) {
        setData(res.data);
      } else {
        Alert.alert("Error", res.message || "Failed to load work logs");
      }
    } catch {
      Alert.alert("Error", "Network error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  return (
    <View
      className="flex-1 px-5 pt-8"
      style={{
        backgroundColor:
          (colors.backgroundColors && colors.backgroundColors[0]) || "#eef2ff",
      }}
    >
      {/* Header */}
      <View className="flex-row items-center mb-4">
        <TouchableOpacity
          onPress={goBack}
          className="p-2 rounded-full mr-3 border"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
        >
          <ChevronLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text
            className="text-lg font-extrabold"
            style={{ color: colors.header }}
            numberOfLines={1}
          >
            {studentName || data?.student?.name || "Work Logs"}
          </Text>
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            {data?.internship?.title || "Internship"} • {data?.totalLogs ?? 0} log{data?.totalLogs !== 1 ? "s" : ""}
          </Text>
        </View>
        {isStudent && (
          <TouchableOpacity
            className="px-3 py-1.5 rounded-lg border flex-row items-center"
            style={{ borderColor: colors.accent, backgroundColor: `${colors.accent}10` }}
            onPress={() =>
              navigate("SubmitWorkLog", {
                internshipId,
                internshipTitle: data?.internship?.title || "My Internship",
                startDate: startDate || data?.internship?.startDate,
                endDate: endDate || data?.internship?.endDate,
                allowLateSubmissions: allowLateSubmissions || data?.internship?.allowLateSubmissions,
                totalDays: data?.internship?.totalDays,
                currentLogsCount: data?.totalLogs || 0,
              })
            }
          >
            <Text className="text-xs font-bold" style={{ color: colors.accent }}>
              + Add Today's Log
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Student info card */}
      {data?.student && (
        <View
          className="p-3 rounded-xl mb-4 border"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
        >
          <Text className="text-sm font-bold" style={{ color: colors.textPrimary }}>
            {data.student.name}
          </Text>
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            {data.student.email} • PRN: {data.student.prn || "N/A"}
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
            {data.internship.title} {data.internship.ngo ? `| NGO: ${data.internship.ngo}` : ""}
          </Text>
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            {new Date(data.internship.startDate).toLocaleDateString()} → {new Date(data.internship.endDate).toLocaleDateString()}
          </Text>
        </View>
      )}

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : !data?.workLogs?.length ? (
        <View className="flex-1 justify-center items-center opacity-60">
          <ClipboardList size={44} color={colors.textSecondary} style={{ marginBottom: 10 }} />
          <Text style={{ color: colors.textSecondary }} className="text-base font-semibold">
            No work logs submitted yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={data.workLogs}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchWorkLogs(); }} />}
          renderItem={({ item, index }) => (
            <View
              className="p-4 rounded-2xl mb-3 border"
              style={{
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
                elevation: 1,
              }}
            >
              {/* Day + Date */}
              <View className="flex-row justify-between items-center mb-2">
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: `${colors.accent}20` }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: colors.accent }}
                  >
                    Day {data.workLogs.length - index}
                  </Text>
                </View>
                <Text className="text-xs" style={{ color: colors.textSecondary }}>
                  📅 {new Date(item.date).toLocaleDateString()}
                </Text>
              </View>

              {/* Log content */}
              <Text
                className="text-sm leading-5"
                style={{ color: colors.textPrimary }}
              >
                {item.content}
              </Text>

              {/* Submitted at */}
              <Text
                className="text-[10px] mt-2 text-right"
                style={{ color: colors.textSecondary }}
              >
                Submitted: {new Date(item.submittedAt).toLocaleString()}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
