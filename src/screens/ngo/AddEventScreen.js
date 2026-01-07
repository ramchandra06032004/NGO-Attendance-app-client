import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ExpoLocation from "expo-location";
import { NavigationContext } from "../../context/NavigationContext";
import { useTheme } from "../../context/ThemeContext";
const api = require("../../../apis/api");
import { AuthContext } from "../../context/AuthContext";
export default function AddEventScreen() {
  const { goBack } = useContext(NavigationContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;
  const { accessToken } = useContext(AuthContext);
  const [locationName, setLocationName] = useState("");
  const [aim, setAim] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState("");

  // Coordinates state
  const [coordinates, setCoordinates] = useState(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(true);

  const [eventDate, setEventDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    setIsFetchingLocation(true);
    try {
      let { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied. Location is required.');
        setIsFetchingLocation(false);
        return;
      }

      // Try last known position first (faster)
      let location = await ExpoLocation.getLastKnownPositionAsync({});

      // If no last known position, or if we want fresh data, request current position
      if (!location) {
        // High accuracy can be slow, balanced is often better for general use
        location = await ExpoLocation.getCurrentPositionAsync({
          accuracy: ExpoLocation.Accuracy.Balanced,
        });
      }

      if (location && location.coords) {
        setCoordinates({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
      } else {
        throw new Error("Could not fetch location data");
      }
    } catch (error) {
      console.error("Location Error:", error);
      Alert.alert(
        "Location Error",
        "Failed to fetch location. Please ensure GPS is on and try again.",
        [
          { text: "Cancel", style: "cancel", onPress: () => setIsFetchingLocation(false) },
          { text: "Retry", onPress: () => getLocation() }
        ]
      );
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const onDateChangeWeb = (dateString) => {
    setEventDate(new Date(dateString));
  };


  const onDateChangeNative = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEventDate(selectedDate);
    }
  };

  const handleSubmit = async () => {
    if (!coordinates) {
      Alert.alert(
        "Location Missing",
        "We are unable to verify your location. Please ensure GPS is enabled.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Retry Fetching", onPress: () => getLocation() }
        ]
      );
      return;
    }

    try {
      // Backend expects images to be an array
      const imagesArray = images
        ? images.split(',').map(img => img.trim()).filter(Boolean)
        : [];

      const reqBody = {
        location: locationName,
        aim,
        description,
        images: imagesArray,
        eventDate: eventDate.toISOString(),
        coordinates: coordinates, // { latitude: ..., longitude: ... }
      };
      

      const response = await fetch(api.eventAllAPI, {
        method: "POST",
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken
        },
        body: JSON.stringify(reqBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Event added successfully:", data);
      Alert.alert("Success", "Event Created Successfully!");
      goBack();
    } catch (error) {
      console.error("Error adding event:", error);
      Alert.alert("Failed", "Failed to add event: " + error.message);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundColors
            ? colors.backgroundColors[0]
            : "#fff",
        },
      ]}
    >
      <ScrollView contentContainerStyle={styles.formContainer}>
        <Text style={[styles.title, { color: colors.header }]}>
          Add New Event
        </Text>
        <TextInput
          placeholder="Location Name (e.g. Community Hall)"
          value={locationName}
          onChangeText={setLocationName}
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
          placeholder="Aim"
          value={aim}
          onChangeText={setAim}
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
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={[
            styles.input,
            styles.multilineInput,
            {
              backgroundColor: colors.iconBg,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
          placeholderTextColor={colors.textSecondary}
        />
        <TextInput
          placeholder="Images (URLs separated by commas)"
          value={images}
          onChangeText={setImages}
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
        <View style={styles.dateInputContainer}>
          <Text style={[styles.dateLabel, { color: colors.textPrimary }]}>
            Select Date:
          </Text>

          {Platform.OS === "web" ? (
            <input
              type="date"
              value={eventDate.toISOString().split("T")[0]}
              onChange={(e) => onDateChangeWeb(e.target.value)}
              style={{
                backgroundColor: colors.iconBg,
                borderColor: colors.border,
                color: colors.textPrimary,
                padding: 12,
                borderWidth: 1,
                borderRadius: 8,
                fontSize: 16,
                marginBottom: 16,
                width: "100%",
              }}
            />
          ) : (
            <>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.iconBg,
                    borderColor: colors.border,
                    justifyContent: "center",
                  },
                ]}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 16 }}>
                  {eventDate.toDateString()}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={eventDate}
                  mode="date"
                  display="default"
                  onChange={onDateChangeNative}
                />
              )}
            </>
          )}
        </View>

        {/* Status Indicator for Location */}
        {isFetchingLocation ? (
          <Text style={{ textAlign: "center", color: colors.textSecondary, marginBottom: 10 }}>
            Fetching location...
          </Text>
        ) : coordinates ? (
          <Text style={{ textAlign: "center", color: 'green', marginBottom: 10 }}>
            ✓ Location Verified
          </Text>
        ) : (
          <TouchableOpacity onPress={getLocation}>
            <Text style={{ textAlign: "center", color: 'red', marginBottom: 10 }}>
              ⚠ Location unavailable. Tap to retry.
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: colors.primary, opacity: isFetchingLocation ? 0.7 : 1 }
          ]}
          onPress={handleSubmit}
          disabled={isFetchingLocation}
        >
          <Text style={styles.submitButtonText}>Add Event</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={{ marginTop: 20, padding: 10, alignItems: 'center' }}
          onPress={() => goBack()}
        >
          <Text style={{ color: colors.textPrimary, fontSize: 16 }}>Go Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  dateInputContainer: {
    marginBottom: 16,
  },
  dateLabel: {
    marginBottom: 8,
    fontSize: 16,
  },
  formContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#f59e0b",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
