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
import * as ImagePicker from "expo-image-picker"; 
import { AttendanceContext } from "../../context/AttendanceContext";
import { NavigationContext } from "../../context/NavigationContext";
import { useTheme } from "../../context/ThemeContext";

// Ensure this path is correct
const api = require("../../../apis/api");

export default function AddNgoScreen() {
  const { goBack } = useContext(NavigationContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [reg, setReg] = useState("");
  const [logo, setLogo] = useState(null); 

  // Function to pick image
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Sorry, we need camera roll permissions!");
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
    // 1. Basic Validation
    if (!logo) {
      Alert.alert("Validation Error", "Please upload an NGO Logo.");
      return;
    }
    if (!name || !email || !password) {
      Alert.alert("Validation Error", "Please fill in all required fields.");
      return;
    }

    // 2. Prepare FormData
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("address", address);
    formData.append("password", password);
    formData.append("mobile", mobile);
    formData.append("registrationNumber", reg);
// 3. DEFINE FILENAME HERE (So it is available for BOTH Web and Mobile)
    let filename = logo.split('/').pop();
    
    // Safety check: If filename looks weird (common on Web), give it a default name
    if (!filename || filename.indexOf('.') === -1) {
        filename = "ngo-logo.jpg";
    }

    // 4. Handle Image Upload (Web vs Mobile)
    if (Platform.OS === "web") {
      // ---------------------------------------------------------
      // 🌍 WEB LOGIC: Convert URI to Blob
      // ---------------------------------------------------------
      try {
        const res = await fetch(logo); 
        const blob = await res.blob(); 
        
        // Append Blob directly. 3rd arg is filename (now guaranteed to be defined)
        formData.append("logo", blob, filename);
        
      } catch (error) {
        console.error("Error converting image on web:", error);
        alert("Failed to process image for web upload.");
        return;
      }
    } else {
      // ---------------------------------------------------------
      // 📱 MOBILE LOGIC: Send Object
      // ---------------------------------------------------------
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append("logo", {
        uri: Platform.OS === "android" ? logo : logo.replace("file://", ""),
        name: filename,
        type: type,
      });
    }

    try {
      console.log("Submitting to:", api.addNgoAPI);
      
      const response = await fetch(api.addNgoAPI, {
        method: "POST",
        credentials: "include",
        headers: {
          // ✅ CONTENT-TYPE MUST BE REMOVED so browser sets boundary
          Accept: "application/json",
        },
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP Status: ${response.status}`);
      }

      
      // ✅ FIX: Different Alert logic for Web vs Mobile
      if (Platform.OS === 'web') {
        window.alert("NGO Added Successfully");
        goBack(); // Navigate back immediately after alert triggers
      } else {
        Alert.alert("Success", "NGO Added Successfully", [
          { text: "OK", onPress: () => goBack() },
        ]);
      }
      
    } catch (err) {
      
      // ✅ FIX: Error handling for Web
      if (Platform.OS === 'web') {
        window.alert("Upload Failed: " + err.message);
      } else {
        Alert.alert("Upload Failed", err.message);
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
          Add NGO
        </Text>

        {/* --- Image Picker UI --- */}
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
          <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 12 }}>
            Tap to upload logo
          </Text>
        </View>

        {/* --- Form Fields --- */}
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
          keyboardType="phone-pad"
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
          className="p-3 rounded-lg items-center mt-2"
          style={{ backgroundColor: colors.accent }}
          onPress={onSubmit}
        >
          <Text className="text-white font-bold text-lg">Add NGO</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="mt-4 items-center" onPress={() => goBack()}>
          <Text style={{ color: colors.textPrimary }}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}