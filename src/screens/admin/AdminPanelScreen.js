import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { AttendanceContext } from "../../context/AttendanceContext";
import { NavigationContext } from "../../context/NavigationContext";
import { AuthContext } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import Toast from "react-native-toast-message";
import * as api from "../../../apis/api";

export default function AdminPanelScreen() {
  const { addCollege, addNgo } = useContext(AttendanceContext);
  const { navigate } = useContext(NavigationContext);
  const { logout } = useContext(AuthContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  const [collegesList, setCollegesList] = useState([]);
  const [ngosList, setNgosList] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [loadingNgos, setLoadingNgos] = useState(false);

  useEffect(() => {
    fetchNgos();
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const response = await fetch(api.getAllCollegeAPI, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("API Response:", data);
      const collegesArray = data?.data?.colleges || [];
      setCollegesList(Array.isArray(collegesArray) ? collegesArray : []);
      setLoadingColleges(false);
    } catch (err) {
      console.error("Error fetching Colleges: ", err);
      setLoadingColleges(false);
    }
  };

  const fetchNgos = async () => {
    try {
      const response = await fetch(api.getAllNgoAPI, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response:", data);
      const ngosArray = data.statusCode || data.ngos || data.data || [];
      setNgosList(Array.isArray(ngosArray) ? ngosArray : []);
      setLoadingNgos(false);
    } catch (err) {
      console.error("Error fetching NGOs:", err);
      setLoadingNgos(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("Home");
  };

  const renderItemName = (item) => {
    if (!item) return null;
    if (typeof item === "string") return item;
    if (item.name) return item.name;
    if (item.title) return item.title;
    if (item.email) return item.email;
    return JSON.stringify(item);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            (colors.backgroundColors && colors.backgroundColors[0]) ||
            styles.container.backgroundColor,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.header }]}>
          Admin Panel
        </Text>
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.accent }]}
          onPress={handleLogout}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.cardBg, borderColor: colors.border },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            Colleges
          </Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.accent }]}
            onPress={() => navigate("AddCollege")}
          >
            <Text style={{ color: "#fff" }}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {loadingColleges ? (
          <ActivityIndicator style={{ marginTop: 8 }} />
        ) : (
          <FlatList
            data={collegesList}
            keyExtractor={(item, idx) =>
              item && (item._id || item.id) ? item._id || item.id : String(idx)
            }
            renderItem={({ item }) => (
              <Text style={{ paddingVertical: 6, color: colors.textPrimary }}>
                {renderItemName(item)}
              </Text>
            )}
            ListEmptyComponent={
              <Text style={{ paddingVertical: 8, color: colors.textSecondary }}>
                No colleges found
              </Text>
            }
          />
        )}
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.cardBg, borderColor: colors.border },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            NGOs
          </Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.accent }]}
            onPress={() => navigate("AddNgo")}
          >
            <Text style={{ color: "#fff" }}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {loadingNgos ? (
          <ActivityIndicator style={{ marginTop: 8 }} />
        ) : (
          <FlatList
            data={ngosList}
            keyExtractor={(item, idx) =>
              item && (item._id || item.id) ? item._id || item.id : String(idx)
            }
            renderItem={({ item }) => (
              <Text style={{ paddingVertical: 6, color: colors.textPrimary }}>
                {renderItemName(item)}
              </Text>
            )}
            ListEmptyComponent={
              <Text style={{ paddingVertical: 8, color: colors.textSecondary }}>
                No NGOs found
              </Text>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f0fdf4" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: "800", color: "#065f46" },
  logoutBtn: {
    backgroundColor: "#10b981",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardTitle: { fontWeight: "700", marginBottom: 8 },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ecfccb",
  },
  addBtn: {
    backgroundColor: "#10b981",
    padding: 10,
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: "center",
  },
});