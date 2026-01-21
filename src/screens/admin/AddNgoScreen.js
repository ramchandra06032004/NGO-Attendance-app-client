import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { AttendanceContext } from "../../context/AttendanceContext";
import { NavigationContext } from "../../context/NavigationContext";
import { useTheme } from "../../context/ThemeContext";
import axios from "axios";
const api = require("../../../apis/api");
export default function AddNgoScreen() {
  const { addNgo } = useContext(AttendanceContext);
  const { goBack } = useContext(NavigationContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [reg, setReg] = useState("");

  function onSubmit() {
    // if (!name.trim()) return;
    const reqBody = {
      name: name,
      email: email,
      address: address,
      password: password,
      mobile: mobile,
      registrationNumber: reg,
    };
    console.log(reqBody);
    // axios.post(api.addCollegeAPI, reqBody)
    fetch(api.addNgoAPI, {
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
          const errorData = await response.json();
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }
        return response.json();
      })
      .then(() => {
        console.log("Success:");
        goBack();
      })
      .catch((err) => {
        console.error("Error adding NGO:", err.message);
        // You might want to show this error to the user
        alert("Failed to add NGO: " + err.message);
      });
  }

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: colors.backgroundColors
          ? colors.backgroundColors[0]
          : "#fff",
      }}
    >
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-bold mb-3" style={{ color: colors.header }}>
          Add NGO
        </Text>
        <TextInput
          placeholder="Name"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
          className="p-3 rounded-lg border mb-3"
          style={{
            backgroundColor: colors.iconBg,
            borderColor: colors.border,
            color: colors.textPrimary,
          }}
        />
        <TextInput
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          className="p-3 rounded-lg border mb-3"
          style={{
            backgroundColor: colors.iconBg,
            borderColor: colors.border,
            color: colors.textPrimary,
          }}
        />
        <TextInput
          placeholder="Address"
          placeholderTextColor={colors.textSecondary}
          value={address}
          onChangeText={setAddress}
          className="p-3 rounded-lg border mb-3"
          style={{
            backgroundColor: colors.iconBg,
            borderColor: colors.border,
            color: colors.textPrimary,
          }}
        />
        <TextInput
          placeholder="Create Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          className="p-3 rounded-lg border mb-3"
          style={{
            backgroundColor: colors.iconBg,
            borderColor: colors.border,
            color: colors.textPrimary,
          }}
        />
        <TextInput
          placeholder="Mobile"
          value={mobile}
          onChangeText={setMobile}
          className="p-3 rounded-lg border mb-3"
          style={{
            backgroundColor: colors.iconBg,
            borderColor: colors.border,
            color: colors.textPrimary,
          }}
          placeholderTextColor={colors.textSecondary}
        />
        <TextInput
          placeholder="Registration No."
          value={reg}
          onChangeText={setReg}
          className="p-3 rounded-lg border mb-3"
          style={{
            backgroundColor: colors.iconBg,
            borderColor: colors.border,
            color: colors.textPrimary,
          }}
          placeholderTextColor={colors.textSecondary}
        />

        <TouchableOpacity
          className="p-3 rounded-lg items-center"
          style={{ backgroundColor: colors.accent }}
          onPress={onSubmit}
        >
          <Text className="text-white font-bold">Add NGO</Text>
        </TouchableOpacity>
        <TouchableOpacity className="mt-3" onPress={() => goBack()}>
          <Text style={{ color: colors.textPrimary }}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
