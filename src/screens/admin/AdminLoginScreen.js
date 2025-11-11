import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { NavigationContext } from "../../context/NavigationContext";
import { AuthContext } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
const api = require("../../../apis/api");

export default function AdminLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { navigate, goBack } = useContext(NavigationContext);
  const { loginUser, switchUserType } = useContext(AuthContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const colors = darkMode ? darkTheme : lightTheme;

  async function onLogin() {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    setIsLoggingIn(true);
    const reqBody = { email: email, password: password, userType: "admin" };
    console.log(reqBody);

    try {
      // Switch user type (logs out if different user was logged in)
      await switchUserType("admin");

      const response = await fetch(api.loginAPI, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reqBody),
      });

      if (!response.ok) {
        let errMsg = `HTTP error! status: ${response.status}`;
        try {
          const errData = await response.json();
          if (errData && errData.message) errMsg = errData.message;
        } catch {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      console.log("Login response:", data);

      // Extract tokens and user data from response
      const accessToken = data.accessToken || data.token;
      const refreshToken = data.refreshToken;
      const userData = data.user || { email: email };

      // Store in AuthContext
      await loginUser(userData, accessToken, refreshToken, "admin");

      alert("Login successful");
      navigate("AdminPanel");
    } catch (err) {
      console.log("Error in sending login API", err);
      alert("Login failed: " + err.message);
    } finally {
      setIsLoggingIn(false);
    }
  }

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
      <View
        style={[
          styles.card,
          { backgroundColor: colors.cardBg, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.header }]}>
          Admin Login
        </Text>
        <Text style={[styles.label, { color: colors.textPrimary }]}>
          Enter admin credentials
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
          editable={!isLoggingIn}
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
          editable={!isLoggingIn}
        />
        <TouchableOpacity
          style={[
            styles.loginBtn,
            { backgroundColor: colors.accent, opacity: isLoggingIn ? 0.6 : 1 },
          ]}
          onPress={onLogin}
          disabled={isLoggingIn}
        >
          {isLoggingIn ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.loginText, { color: "#fff" }]}>Login</Text>
          )}
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={goBack}
        style={{ marginTop: 12 }}
        disabled={isLoggingIn}
      >
        <Text style={{ color: colors.textPrimary }}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0fdf4",
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
    color: "#065f46",
    marginBottom: 8,
    textAlign: "center",
  },
  label: { color: "#334155", marginBottom: 8 },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ecfccb",
  },
  loginBtn: {
    backgroundColor: "#10b981",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  loginText: { color: "#fff", fontWeight: "700" },
});