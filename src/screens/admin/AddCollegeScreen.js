import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker"; // ✅ Import ImagePicker
import { AttendanceContext } from "../../context/AttendanceContext";
import { NavigationContext } from "../../context/NavigationContext";
import { useTheme } from "../../context/ThemeContext";

const api = require("../../../apis/api");

export default function AddCollegeScreen() {
  const { goBack } = useContext(NavigationContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [logo, setLogo] = useState(null); // ✅ State for Logo

  // ✅ Image Picker Function
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setLogo(result.assets[0].uri);
    }
  };

  async function onSubmit() {
    // 1. Validation
    if (!logo) {
      if (Platform.OS === "web") window.alert("Please upload a College Logo.");
      else Alert.alert("Validation Error", "Please upload a College Logo.");
      return;
    }
    if (!name.trim() || !email || !password || !address) {
      if (Platform.OS === "web") window.alert("All fields are required.");
      else Alert.alert("Validation Error", "All fields are required.");
      return;
    }

    // 2. Prepare FormData
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("address", address);
    formData.append("password", password);

    // 3. Define Filename
    let filename = logo.split("/").pop();
    if (!filename || filename.indexOf(".") === -1) {
      filename = "college-logo.jpg";
    }

    // 4. Handle Image Upload (Web vs Mobile Logic)
    if (Platform.OS === "web") {
      // 🌍 WEB: Convert to Blob
      try {
        const res = await fetch(logo);
        const blob = await res.blob();
        formData.append("logo", blob, filename); // 'logo' must match backend
      } catch (error) {
        console.error("Error processing image:", error);
        return;
      }
    } else {
      // 📱 MOBILE: Send Object
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append("logo", {
        uri: Platform.OS === "android" ? logo : logo.replace("file://", ""),
        name: filename,
        type: type,
      });
    }

    // 5. Send Request
    try {
      console.log("Submitting to:", api.addCollegeAPI);

      const response = await fetch(api.addCollegeAPI, {
        method: "POST",
        credentials: "include",
        headers: {
          // ✅ Standard headers for FormData (No Content-Type)
          Accept: "application/json",
        },
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message || `HTTP Status: ${response.status}`
        );
      }

      // 6. Success Handling
      if (Platform.OS === "web") {
        window.alert("College Added Successfully");
        goBack();
      } else {
        Alert.alert("Success", "College Added Successfully", [
          { text: "OK", onPress: () => goBack() },
        ]);
      }
    } catch (err) {
      console.error("Error adding college:", err.message);
      if (Platform.OS === "web") {
        window.alert("Failed: " + err.message);
      } else {
        Alert.alert("Error", err.message);
      }
    }
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
        <Text
          className="text-2xl font-bold mb-5"
          style={{ color: colors.header }}
        >
          Add College
        </Text>

        {/* ✅ Image Picker UI */}
        <View className="items-center mb-6">
          <TouchableOpacity onPress={pickImage}>
            {logo ? (
              <Image
                source={{ uri: logo }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  borderWidth: 2,
                  borderColor: colors.accent,
                }}
              />
            ) : (
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: colors.iconBg,
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderStyle: "dashed",
                }}
              >
                <Text style={{ color: colors.textSecondary }}>Add Logo</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text
            style={{ color: colors.textSecondary, marginTop: 8, fontSize: 12 }}
          >
            Tap to upload logo
          </Text>
        </View>

        {/* Form Inputs */}
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
          autoCapitalize="none"
          keyboardType="email-address"
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
          placeholderTextColor={colors.textSecondary}
        />

        <TouchableOpacity
          className="p-3 rounded-lg items-center mt-2"
          style={{ backgroundColor: colors.accent }}
          onPress={onSubmit}
        >
          <Text className="text-white font-bold text-lg">Add College</Text>
        </TouchableOpacity>

        <TouchableOpacity className="mt-4 items-center" onPress={() => goBack()}>
          <Text style={{ color: colors.textPrimary }}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}