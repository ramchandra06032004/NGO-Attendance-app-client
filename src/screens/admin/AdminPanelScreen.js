import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
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
      className="flex-1 p-5"
      style={{
        backgroundColor:
          (colors.backgroundColors && colors.backgroundColors[0]) || "#f0fdf4",
      }}
    >
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-2xl font-black" style={{ color: colors.header }}>
          Admin Panel
        </Text>
        <TouchableOpacity
          className="px-3.5 py-2.5 rounded-lg"
          style={{ backgroundColor: colors.accent }}
          onPress={handleLogout}
        >
          <Text className="text-white font-bold">Logout</Text>
        </TouchableOpacity>
      </View>

      <View
        className="bg-white p-3.5 rounded-xl mb-3 border"
        style={{ borderColor: colors.border }}
      >
        <View className="flex-row justify-between items-center">
          <Text className="font-bold" style={{ color: colors.textPrimary }}>
            Colleges
          </Text>
          <TouchableOpacity
            className="p-2.5 rounded-lg ml-2"
            style={{ backgroundColor: colors.accent }}
            onPress={() => navigate("AddCollege")}
          >
            <Text className="text-white">+ Add</Text>
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
              <Text className="py-1.5" style={{ color: colors.textPrimary }}>
                {renderItemName(item)}
              </Text>
            )}
            ListEmptyComponent={
              <Text className="py-2" style={{ color: colors.textSecondary }}>
                No colleges found
              </Text>
            }
          />
        )}
      </View>

      <View
        className="bg-white p-3.5 rounded-xl mb-3 border"
        style={{ borderColor: colors.border }}
      >
        <View className="flex-row justify-between items-center">
          <Text className="font-bold" style={{ color: colors.textPrimary }}>
            NGOs
          </Text>
          <TouchableOpacity
            className="p-2.5 rounded-lg ml-2"
            style={{ backgroundColor: colors.accent }}
            onPress={() => navigate("AddNgo")}
          >
            <Text className="text-white">+ Add</Text>
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
              <Text className="py-1.5" style={{ color: colors.textPrimary }}>
                {renderItemName(item)}
              </Text>
            )}
            ListEmptyComponent={
              <Text className="py-2" style={{ color: colors.textSecondary }}>
                No NGOs found
              </Text>
            }
          />
        )}
      </View>
    </View>
  );
}