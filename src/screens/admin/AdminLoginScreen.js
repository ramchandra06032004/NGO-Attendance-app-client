import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { NavigationContext } from "../../context/NavigationContext";
import { useTheme } from "../../context/ThemeContext";
import axios from "axios";
const api = require("../../../apis/api");

export default function AdminLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { navigate, goBack } = useContext(NavigationContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  function onLogin() {
    // static admin auth
    const reqBody = { email: email, password: password, userType: "admin" };
    // axios.post(api.loginAPI , reqBody)
    
    fetch(api.loginAPI, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reqBody),
    })
      .then((response) => {
        navigate("AdminPanel");
        console.log(response.data);
      })
      .catch((err) => {
        console.log("Error in sending login API", err);
      });
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
      <TouchableOpacity onPress={goBack} style={{ marginTop: 12 }}>
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
