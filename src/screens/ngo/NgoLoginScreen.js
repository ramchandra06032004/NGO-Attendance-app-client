import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { NavigationContext } from "../../context/NavigationContext";
import { AttendanceContext } from "../../context/AttendanceContext";
import { useTheme } from "../../context/ThemeContext";
//import Toast from "react-native-toast-message"; // added toast import
const api = require("../../../apis/api");

export default function NgoLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { navigate, goBack } = useContext(NavigationContext);
  const [ngoList, setNgoList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNgo, setSelectedNgo] = useState("");
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  useEffect(() => {
    fetchNgos();
  }, []);

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
      console.log("API Response:", data); // Debug log

      // derive NGOs array from common response shapes
      // Get NGOs array from statusCode
      const ngosArray = data.statusCode || [];
      data.ngos || data.data || (Array.isArray(data) ? data : []);
      setNgoList(Array.isArray(ngosArray) ? ngosArray : []);
      setLoading(false);

      // success toast
      // Toast.show({
      //   type: "success",
      //   text1: "NGOs loaded",
      //   text2: `${finalNgos.length} NGO(s) found`,
      // });
    } catch (err) {
      console.error("Error fetching NGOs:", err);
      setError("Failed to fetch NGOs");
      setLoading(false);

      // error toast
      // Toast.show({
      //   type: "error",
      //   text1: "Failed to load NGOs",
      //   text2: err.message || "Network or server error",
      // });
    }
  };

  function onLogin() {
    if (!selectedNgo) return;

    const reqBody = { email: email, password: password, userType: "ngo" };
    console.log(reqBody);

    fetch(api.loginAPI, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reqBody),
    })
      .then(async (response) => {
        if (!response.ok) {
          // try to parse error message if available
          let errMsg = `HTTP error! status: ${response.status}`;
          try {
            const errData = await response.json();
            if (errData && errData.message) errMsg = errData.message;
          } catch {}
          throw new Error(errMsg);
        }
        return response.json();
      })
      .then((data) => {
        // success toast
        // Toast.show({
        //   type: "success",
        //   text1: "Login successful",
        //   text2: `Welcome ${selectedNgo}`,
        // });

        navigate("NgoEvents", { ngo: selectedNgo });
      })
      .catch((err) => {
        console.log("Error in sending login API", err);
        // error toast
        // Toast.show({
        //   type: "error",
        //   text1: "Login failed",
        //   text2: err.message || "Invalid credentials",
        // });
        alert("Login failed: " + err.message);
      });

    // navigate('NgoEvents', { ngo: selectedNgo });
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            (colors.backgroundColors && colors.backgroundColors[0]) ||
            "#fff7ed",
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
          NGO Login
        </Text>

        <Text style={[styles.label, { color: colors.textPrimary }]}>
          Select NGO
        </Text>
        <ScrollView
          style={[
            styles.picker,
            { backgroundColor: colors.iconBg, borderColor: colors.border },
          ]}
          contentContainerStyle={{ padding: 6 }}
          showsVerticalScrollIndicator={true}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : error ? (
            <Text style={[styles.errorText, { color: "red" }]}>{error}</Text>
          ) : ngoList.length === 0 ? (
            <Text style={[styles.noNgoText, { color: colors.textSecondary }]}>
              No NGOs added yet
            </Text>
          ) : (
            ngoList.map((ngo) => (
              <Pressable
                key={ngo._id}
                style={({ pressed }) => [
                  styles.pickerItem,
                  selectedNgo === ngo.name && styles.pickerItemActive,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => {
                  setSelectedNgo(ngo.name);
                  setEmail(ngo.email);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    { color: colors.textPrimary },
                    selectedNgo === ngo.name && styles.pickerItemTextActive,
                  ]}
                >
                  {ngo.name}
                </Text>
                {selectedNgo === ngo.name && (
                  <Text style={styles.check}>✓</Text>
                )}
              </Pressable>
            ))
          )}
        </ScrollView>

        {selectedNgo ? (
          <>
            <Text style={styles.signingText}>Signing in as: {selectedNgo}</Text>
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
          </>
        ) : (
          <Text style={[styles.promptText, { color: colors.textSecondary }]}>
            Please select an NGO to proceed
          </Text>
        )}
      </View>

      <TouchableOpacity onPress={goBack} style={styles.cancelBtn}>
        <Text style={[styles.cancelText, { color: colors.textPrimary }]}>
          Cancel
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#92400e",
    marginBottom: 12,
    textAlign: "center",
  },
  label: {
    color: "#334155",
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "600",
    fontSize: 15,
  },
  picker: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  pickerItemActive: {
    backgroundColor: "#ffffff33",
    borderWidth: 1,
    borderColor: "#fbbf24",
  },
  pickerItemText: {
    color: "#0f172a",
    fontSize: 15,
  },
  pickerItemTextActive: {
    color: "#b45309",
    fontWeight: "700",
  },
  check: {
    color: "#059669",
    fontWeight: "700",
    fontSize: 16,
  },
  noNgoText: {
    color: "#64748b",
    marginBottom: 8,
    textAlign: "center",
    fontStyle: "italic",
  },
  errorText: {
    textAlign: "center",
    marginBottom: 8,
    fontStyle: "italic",
  },
  signingText: {
    marginTop: 10,
    color: "#334155",
    textAlign: "center",
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#fef3c7",
    color: "#0f172a",
  },
  loginBtn: {
    backgroundColor: "#f59e0b",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  loginText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  promptText: {
    color: "#64748b",
    marginTop: 10,
    textAlign: "center",
  },
  cancelBtn: {
    marginTop: 14,
  },
  cancelText: {
    color: "#475569",
    fontSize: 15,
    fontWeight: "500",
  },
});
