import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Pressable,
} from "react-native";
import { NavigationContext } from "../../context/NavigationContext";
import { AttendanceContext } from "../../context/AttendanceContext";
import { useTheme } from "../../context/ThemeContext";
import * as api from "../../../apis/api";
export default function CollegeLoginScreen() {
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { navigate, goBack } = useContext(NavigationContext);
  const { getColleges } = useContext(AttendanceContext);
  const colleges = getColleges();
  const [collegesList, setCollegesList] = useState([]);
  const [ngosList, setNgosList] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState("");

  useEffect(() => {
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
      console.log("API Response:", data); // Debug log
      // derive NGOs array from common response shapes
      // Get NGOs array from statusCode
      const collegesArray = data.statusCode || [];
      data.colleges || data.data || (Array.isArray(data) ? data : []);
      setCollegesList(Array.isArray(collegesArray) ? collegesArray : []);
      setLoadingColleges(false);
    } catch (err) {
      console.error("Error fetching Colleges: ", err);

      setLoadingColleges(false);
    }
  };
  function onLogin() {
    // static auth: accept any input
    if (!selectedCollege) return; // require selection
    navigate("CollegeClasses", { college: selectedCollege });
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            (colors.backgroundColors && colors.backgroundColors[0]) ||
            "#ecfeff",
        },
      ]}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: colors.cardBg, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.header }]}>
          College Login
        </Text>

        <Text style={[styles.label, { color: colors.textPrimary }]}>
          Select college
        </Text>
        <ScrollView
          style={[
            styles.picker,
            { backgroundColor: colors.iconBg, borderColor: colors.border },
          ]}
          contentContainerStyle={{ padding: 6 }}
        >
          {collegesList.map((c) => {
            const active = selectedCollege === c;
            return (
              <Pressable
                key={c}
                onPress={() => setSelectedCollege(c)}
                style={[
                  styles.pickerItem,
                  active && {
                    backgroundColor: active
                      ? darkMode
                        ? "#ffffff12"
                        : "#fcfbf7ff"
                      : undefined,
                    borderWidth: active ? 1 : 0,
                    borderColor: active ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    active && styles.pickerItemTextActive,
                    { color: colors.textPrimary },
                  ]}
                >
                  {c}
                </Text>
                {active ? (
                  <Text style={[styles.check, { color: colors.accent }]}>
                    ✓
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>

        {selectedCollege ? (
          <View style={styles.loginArea}>
            <Text style={[styles.logging, { color: colors.textPrimary }]}>
              Logging in as{" "}
              <Text style={{ fontWeight: "700", color: colors.header }}>
                {selectedCollege}
              </Text>
            </Text>
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              style={[
                styles.input,
                {
                  backgroundColor: colors.iconBg,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={colors.textSecondary}
            />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              style={[
                styles.input,
                {
                  backgroundColor: colors.iconBg,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              secureTextEntry
              placeholderTextColor={colors.textSecondary}
            />

            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: colors.accent }]}
              onPress={onLogin}
            >
              <Text style={[styles.loginText, { color: "#fff" }]}>Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Please select a college to continue
          </Text>
        )}
      </View>

      <TouchableOpacity onPress={goBack} style={styles.cancel}>
        <Text style={{ color: colors.textPrimary }}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ecfeff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 18,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#064e3b",
    marginBottom: 8,
    textAlign: "center",
  },
  label: { color: "#62ae33ff", marginBottom: 8 },
  picker: { backgroundColor: "#f8fafc", borderRadius: 12, marginBottom: 12 },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  pickerItemActive: { backgroundColor: "#ecfeff" },
  pickerItemText: { color: "#0f172a" },
  pickerItemTextActive: { color: "#0b5563", fontWeight: "700" },
  check: { color: "#059669", fontWeight: "700" },
  loginArea: { marginTop: 6 },
  logging: { color: "#b9bec4ff", marginBottom: 8 },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eef2ff",
  },
  loginBtn: {
    backgroundColor: "#059669",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  loginText: { color: "#fff", fontWeight: "700" },
  hint: { color: "#64748b", textAlign: "center", marginTop: 8 },
  cancel: { marginTop: 12 },
});
