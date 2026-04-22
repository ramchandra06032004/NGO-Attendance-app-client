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
import { ChevronLeft, User, ClipboardList, CheckCircle, XCircle, Clock } from "lucide-react-native";

export default function InternshipApplicantsScreen({ internship: initialInternship }) {
  const { goBack, navigate } = useContext(NavigationContext);
  const { accessToken } = useContext(AuthContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchApplicants();
  }, []);

  const fetchApplicants = async () => {
    try {
      const response = await fetch(
        api.ngoInternshipApplicantsAPI(initialInternship._id),
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const res = await response.json();
      if (response.ok) {
        setData(res.data);
      } else {
        Alert.alert("Error", res.message || "Failed to load applicants");
      }
    } catch {
      Alert.alert("Error", "Network error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateStatus = async (studentId, status) => {
    setUpdatingId(studentId);
    try {
      const response = await fetch(
        api.ngoUpdateApplicantStatusAPI(initialInternship._id, studentId),
        {
          method: "PATCH",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ status }),
        }
      );
      const res = await response.json();
      if (response.ok) {
        fetchApplicants(); // refresh
      } else {
        Alert.alert("Error", res.message || "Failed to update status");
      }
    } catch {
      Alert.alert("Error", "Network error");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "accepted":
        return { color: "#10b981", bg: "#10b98120", icon: CheckCircle };
      case "rejected":
        return { color: "#ef4444", bg: "#ef444420", icon: XCircle };
      default:
        return { color: "#f59e0b", bg: "#f59e0b20", icon: Clock };
    }
  };

  const renderItem = ({ item }) => {
    const style = getStatusStyle(item.status);
    const StatusIcon = style.icon;
    const isUpdating = updatingId === item.studentId;

    return (
      <View
        className="p-4 rounded-2xl mb-3 border"
        style={{
          backgroundColor: colors.cardBg,
          borderColor: colors.border,
          elevation: 1,
        }}
      >
        {/* Student info row */}
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-row items-center flex-1">
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: colors.iconBg }}
            >
              <User size={18} color={colors.accent} />
            </View>
            <View className="flex-1">
              <Text
                className="text-sm font-bold"
                style={{ color: colors.textPrimary }}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text
                className="text-xs"
                style={{ color: colors.textSecondary }}
              >
                PRN: {item.prn || "N/A"} • {item.department || "N/A"}
              </Text>
              <Text className="text-[10px]" style={{ color: colors.textSecondary }}>
                Applied: {new Date(item.appliedAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View className="items-end">
            <View
              className="flex-row items-center px-2.5 py-1 rounded-full mb-1"
              style={{ backgroundColor: style.bg }}
            >
              <StatusIcon size={12} color={style.color} style={{ marginRight: 3 }} />
              <Text
                className="text-[11px] font-bold"
                style={{ color: style.color }}
              >
                {item.status === "accepted" ? "Accepted" : item.status === "rejected" ? "Not Selected" : "Pending"}
              </Text>
            </View>
            {item.isCompleted && (
              <View className="bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <Text className="text-[10px] font-black text-emerald-500">🏆 COMPLETED</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action buttons */}
        <View className="flex-row gap-2">
          {item.status !== "accepted" && (
            <TouchableOpacity
              className="flex-1 py-2 rounded-xl items-center"
              style={{ backgroundColor: isUpdating ? "#10b98150" : "#10b981" }}
              onPress={() => updateStatus(item.studentId, "accepted")}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white text-xs font-bold">✓ Accept</Text>
              )}
            </TouchableOpacity>
          )}
          {item.status === "pending" && (
            <TouchableOpacity
              className="flex-1 py-2 rounded-xl items-center border"
              style={{
                borderColor: "#ef4444",
                backgroundColor: isUpdating ? "#ef444415" : "transparent",
              }}
              onPress={() => updateStatus(item.studentId, "rejected")}
              disabled={isUpdating}
            >
              <Text className="text-xs font-bold" style={{ color: "#ef4444" }}>
                ✕ Not Select
              </Text>
            </TouchableOpacity>
          )}

          {/* View work logs (only for accepted) */}
          {item.status === "accepted" && (
            <TouchableOpacity
              className="flex-1 py-2 rounded-xl items-center flex-row justify-center"
              style={{ backgroundColor: colors.iconBg }}
              onPress={() =>
                navigate("StudentWorkLogs", {
                  internshipId: initialInternship._id,
                  studentId: item.studentId,
                  studentName: item.name,
                })
              }
            >
              <ClipboardList size={13} color={colors.accent} style={{ marginRight: 4 }} />
              <Text className="text-xs font-bold" style={{ color: colors.accent }}>
                Logs ({item.workLogsCount}/{data?.internship?.totalDays})
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
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
            {initialInternship.title}
          </Text>
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            Applicants
          </Text>
        </View>
      </View>

      {/* Info card */}
      <View
        className="p-3 rounded-xl mb-4 border"
        style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
      >
        <View className="flex-row justify-around">
          {[
            { label: "Total", val: data?.applicants?.length ?? "—", color: colors.accent },
            { label: "Pending", val: data?.applicants?.filter((a) => a.status === "pending").length ?? "—", color: "#f59e0b" },
            { label: "Accepted", val: data?.applicants?.filter((a) => a.status === "accepted").length ?? "—", color: "#10b981" },
            { label: "Not Selected", val: data?.applicants?.filter((a) => a.status === "rejected").length ?? "—", color: "#ef4444" },
          ].map(({ label, val, color }) => (
            <View key={label} className="items-center">
              <Text className="text-xl font-black" style={{ color }}>
                {val}
              </Text>
              <Text className="text-[10px]" style={{ color: colors.textSecondary }}>
                {label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : !data?.applicants?.length ? (
        <View className="flex-1 justify-center items-center opacity-60">
          <User size={44} color={colors.textSecondary} style={{ marginBottom: 10 }} />
          <Text style={{ color: colors.textSecondary }} className="text-base font-semibold">
            No applicants yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={data.applicants}
          keyExtractor={(item) => item._id || item.studentId}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchApplicants(); }} />}
        />
      )}
    </View>
  );
}
