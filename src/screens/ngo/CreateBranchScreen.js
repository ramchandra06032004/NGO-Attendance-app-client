import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { ChevronLeft, MapPin, Building, User, Mail, Phone, Lock } from 'lucide-react-native';
import { NavigationContext } from '../../context/NavigationContext';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { createBranchAPI } from '../../../apis/api';
import Toast from 'react-native-toast-message';

const InputField = ({ icon: Icon, placeholder, value, onChangeText, error, secureTextEntry, keyboardType, colors }) => (
  <View className="mb-4">
    <View
      className="flex-row items-center p-3.5 rounded-xl border"
      style={{ backgroundColor: colors.iconBg, borderColor: error ? 'red' : colors.border }}
    >
      <Icon size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        className="flex-1 text-base"
        style={{ color: colors.textPrimary, outlineStyle: 'none' }}
        placeholderTextColor={colors.textSecondary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
      />
    </View>
    {error && <Text style={{ color: 'red', fontSize: 12, marginTop: 4, marginLeft: 4 }}>{error}</Text>}
  </View>
);

export default function CreateBranchScreen() {
  const { goBack, navigate } = useContext(NavigationContext);
  const { user, accessToken } = useContext(AuthContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  const [formData, setFormData] = useState({
    branch_name: '',
    location: '',
    admin_name: '',
    admin_email: '',
    admin_phone: '',
    password: '',
    confirm_password: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    let newErrors = {};
    if (!formData.branch_name.trim()) newErrors.branch_name = 'Branch Name is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.admin_name.trim()) newErrors.admin_name = 'Admin Name is required';
    if (!formData.admin_email.trim()) newErrors.admin_email = 'Admin Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.admin_email)) newErrors.admin_email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password !== formData.confirm_password) newErrors.confirm_password = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await fetch(createBranchAPI, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ngo_id: user._id,
          branch_name: formData.branch_name,
          location: formData.location,
          admin_name: formData.admin_name,
          admin_email: formData.admin_email,
          admin_phone: formData.admin_phone,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create branch');
      }

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Branch created successfully',
      });

      // Navigate back to Manage Branches after a short delay
      setTimeout(() => {
        goBack(); // or navigate('ManageBranches')
      }, 1000);

    } catch (err) {
      console.error('Error creating branch:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || 'Something went wrong',
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <View className="flex-1" style={{ backgroundColor: colors.backgroundColors[0] }}>
      <View className="flex-row items-center p-4 pt-10 border-b" style={{ borderColor: colors.border, backgroundColor: colors.cardBg }}>
        <TouchableOpacity onPress={goBack} className="p-2 mr-2">
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text className="text-xl font-bold" style={{ color: colors.header }}>Create Branch</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          
          {/* Branch Details Section */}
          <Text className="text-lg font-bold mb-4" style={{ color: colors.header }}>Branch Details</Text>
          <View className="p-4 rounded-xl mb-6 shadow-sm border" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
            <InputField
              icon={Building}
              placeholder="Branch Name (e.g. Pune Center)"
              value={formData.branch_name}
              onChangeText={(text) => setFormData({ ...formData, branch_name: text })}
              error={errors.branch_name}
              colors={colors}
            />
            <InputField
              icon={MapPin}
              placeholder="Location / City"
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              error={errors.location}
              colors={colors}
            />
          </View>

          {/* Admin Details Section */}
          <Text className="text-lg font-bold mb-4" style={{ color: colors.header }}>Branch Admin Details</Text>
          <View className="p-4 rounded-xl mb-6 shadow-sm border" style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}>
            <InputField
              icon={User}
              placeholder="Admin Name"
              value={formData.admin_name}
              onChangeText={(text) => setFormData({ ...formData, admin_name: text })}
              error={errors.admin_name}
              colors={colors}
            />
            <InputField
              icon={Mail}
              placeholder="Admin Email"
              value={formData.admin_email}
              onChangeText={(text) => setFormData({ ...formData, admin_email: text })}
              error={errors.admin_email}
              keyboardType="email-address"
              colors={colors}
            />
            <InputField
              icon={Phone}
              placeholder="Admin Phone (Optional)"
              value={formData.admin_phone}
              onChangeText={(text) => setFormData({ ...formData, admin_phone: text })}
              keyboardType="phone-pad"
              colors={colors}
            />
            <InputField
              icon={Lock}
              placeholder="Password"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              error={errors.password}
              secureTextEntry
              colors={colors}
            />
            <InputField
              icon={Lock}
              placeholder="Confirm Password"
              value={formData.confirm_password}
              onChangeText={(text) => setFormData({ ...formData, confirm_password: text })}
              error={errors.confirm_password}
              secureTextEntry
              colors={colors}
            />
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className="py-4 rounded-xl items-center shadow-sm mb-10"
            style={{
              backgroundColor: colors.accent,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-white font-bold text-base tracking-wide">
                Create Branch
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
