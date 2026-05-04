import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
  Alert, TextInput, Modal, FlatList, Animated, Dimensions,
} from 'react-native';
import {
  ChevronLeft, MapPin, CalendarDays, Users, Briefcase,
  Mail, Phone, Edit, ShieldAlert, X, Clock, MapPin as MapPinIcon,
} from 'lucide-react-native';
import { NavigationContext } from '../../context/NavigationContext';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  getBranchDetailsAPI, resetBranchPasswordAPI,
  deactivateBranchAPI, getBranchEventsAPI, getBranchInternshipsAPI,
} from '../../../apis/api';
import Toast from 'react-native-toast-message';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function statusColor(type, count) {
  if (type === 'events') return '#10b981';
  if (type === 'internships') return '#8b5cf6';
  return '#3b82f6';
}
// ──────────────────────────────────────────────────────────────────────────────

function ActivitySheet({ visible, onClose, title, data, loading, type, colors }) {
  const accent = type === 'events' ? '#10b981' : '#8b5cf6';

  const renderEventItem = ({ item }) => (
    <View
      style={{
        backgroundColor: colors.cardBg,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <Text style={{ color: colors.header, fontWeight: '700', fontSize: 15, flex: 1, marginRight: 8 }} numberOfLines={2}>
          {item.title || '—'}
        </Text>
        <View style={{ backgroundColor: accent + '18', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
          <Text style={{ color: accent, fontSize: 11, fontWeight: '700' }}>
            {item.totalRegistered ?? 0} registered
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <MapPinIcon size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{item.location || '—'}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Clock size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
          {fmt(item.startDate)} → {fmt(item.endDate)}
        </Text>
      </View>
    </View>
  );

  const renderInternshipItem = ({ item }) => (
    <View
      style={{
        backgroundColor: colors.cardBg,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <Text style={{ color: colors.header, fontWeight: '700', fontSize: 15, flex: 1, marginRight: 8 }} numberOfLines={2}>
          {item.title || '—'}
        </Text>
        <View style={{ backgroundColor: accent + '18', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 }}>
          <Text style={{ color: accent, fontSize: 11, fontWeight: '700' }}>
            {item.acceptedCount}/{item.totalSlots} slots
          </Text>
        </View>
      </View>
      <Text style={{ color: accent, fontSize: 12, fontWeight: '600', marginBottom: 4 }}>
        🎯 {item.domain || '—'}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <MapPinIcon size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{item.location || '—'}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Clock size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
            {fmt(item.startDate)} → {fmt(item.endDate)}
          </Text>
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
          {item.totalApplicants} applicant{item.totalApplicants !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      {/* Overlay */}
      <View
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.45)',
        }}
      >
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
      </View>

      {/* Sheet */}
      <View
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: colors.backgroundColors?.[0] || '#fff',
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          maxHeight: SCREEN_HEIGHT * 0.82,
        }}
      >
        {/* Handle & header */}
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.header }}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <ActivityIndicator size="large" color={accent} />
          </View>
        ) : data.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>{type === 'events' ? '📅' : '💼'}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: '600' }}>
              No {type} yet
            </Text>
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => item._id}
            renderItem={type === 'events' ? renderEventItem : renderInternshipItem}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function BranchDetailScreen({ route }) {
  const { branchId } = route.params || {};
  const { goBack } = useContext(NavigationContext);
  const { accessToken } = useContext(AuthContext);
  const { darkMode, lightTheme, darkTheme } = useTheme();
  const colors = darkMode ? darkTheme : lightTheme;

  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);

  // Password reset state
  const [isResetting, setIsResetting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Activity sheet state
  const [sheetType, setSheetType] = useState(null); // 'events' | 'internships'
  const [sheetData, setSheetData] = useState([]);
  const [sheetLoading, setSheetLoading] = useState(false);

  useEffect(() => {
    if (branchId) fetchBranchDetails();
    else goBack();
  }, [branchId]);

  const fetchBranchDetails = async () => {
    try {
      const response = await fetch(getBranchDetailsAPI(branchId), {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setBranch(data.data);
    } catch (err) {
      console.error('Error fetching branch details:', err);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch branch details' });
    } finally {
      setLoading(false);
    }
  };

  const openSheet = async (type) => {
    setSheetType(type);
    setSheetData([]);
    setSheetLoading(true);
    try {
      const url = type === 'events' ? getBranchEventsAPI(branchId) : getBranchInternshipsAPI(branchId);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setSheetData(json.data || []);
    } catch (err) {
      console.error('Error loading branch activity:', err);
    } finally {
      setSheetLoading(false);
    }
  };

  const closeSheet = () => setSheetType(null);

  const handleResetPassword = async () => {
    if (!newPassword.trim()) { Alert.alert('Error', 'Please enter a new password'); return; }
    setResetLoading(true);
    try {
      const response = await fetch(resetBranchPasswordAPI(branchId), {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      if (!response.ok) { const d = await response.json(); throw new Error(d.message || 'Failed'); }
      Toast.show({ type: 'success', text1: 'Success', text2: 'Password reset successfully' });
      setIsResetting(false);
      setNewPassword('');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeactivate = () => {
    Alert.alert(
      'Deactivate Branch',
      'Are you sure you want to deactivate this branch? They will no longer be able to log in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate', style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(deactivateBranchAPI(branchId), {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' },
              });
              if (!response.ok) throw new Error('Failed to deactivate');
              Toast.show({ type: 'success', text1: 'Success', text2: 'Branch deactivated' });
              goBack();
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.backgroundColors?.[0] || '#fff' }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!branch) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.backgroundColors?.[0] || '#fff' }}>
        <Text style={{ color: colors.textPrimary }}>Branch not found</Text>
        <TouchableOpacity onPress={goBack} style={{ marginTop: 16, padding: 8, backgroundColor: '#e5e7eb', borderRadius: 8 }}>
          <Text>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stats = [
    { type: 'events', label: 'Events', count: branch.stats.events, icon: CalendarDays, accent: '#10b981' },
    { type: 'internships', label: 'Internships', count: branch.stats.internships ?? 0, icon: Briefcase, accent: '#8b5cf6' },
    { type: null, label: 'Students Reached', count: branch.stats.students ?? 0, icon: Users, accent: colors.accent },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundColors?.[0] || '#fff' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 40, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.cardBg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={goBack} style={{ padding: 8, marginRight: 8 }}>
            <ChevronLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.header }}>Branch Details</Text>
        </View>
        <TouchableOpacity style={{ padding: 8 }}>
          <Edit size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>

        {/* Info Card */}
        <View style={{ padding: 20, borderRadius: 18, marginBottom: 24, borderWidth: 1, backgroundColor: colors.cardBg, borderColor: colors.border }}>
          <Text style={{ fontSize: 22, fontWeight: '800', marginBottom: 4, color: colors.header }}>{branch.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <MapPin size={15} color={colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{branch.location}</Text>
          </View>

          {/* Stat boxes */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {stats.map(({ type, label, count, icon: Icon, accent }, idx) => {
              const isClickable = !!type;
              return (
                <TouchableOpacity
                  key={label}
                  onPress={() => isClickable && openSheet(type)}
                  disabled={!isClickable}
                  activeOpacity={isClickable ? 0.7 : 1}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: accent + '12',
                    borderWidth: isClickable ? 1.5 : 0,
                    borderColor: isClickable ? accent + '40' : 'transparent',
                    marginHorizontal: idx === 1 ? 6 : 0,
                  }}
                >
                  <Icon size={22} color={accent} style={{ marginBottom: 6 }} />
                  <Text style={{ fontSize: 20, fontWeight: '800', color: colors.header }}>{count}</Text>
                  <Text style={{ fontSize: 11, color: accent, fontWeight: '600', marginTop: 2 }}>{label}</Text>
                  {isClickable && (
                    <Text style={{ fontSize: 9, color: accent + '99', marginTop: 2 }}>tap to view ›</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Admin Card */}
        <Text style={{ fontSize: 17, fontWeight: '700', marginBottom: 10, marginLeft: 2, color: colors.header }}>Branch Admin</Text>
        <View style={{ padding: 20, borderRadius: 18, marginBottom: 24, borderWidth: 1, backgroundColor: colors.cardBg, borderColor: colors.border }}>
          <Text style={{ fontSize: 17, fontWeight: '700', marginBottom: 12, color: colors.textPrimary }}>{branch.admin.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Mail size={15} color={colors.textSecondary} style={{ marginRight: 10 }} />
            <Text style={{ color: colors.textPrimary }}>{branch.admin.email}</Text>
          </View>
          {branch.admin.phone && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Phone size={15} color={colors.textSecondary} style={{ marginRight: 10 }} />
              <Text style={{ color: colors.textPrimary }}>{branch.admin.phone}</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <Text style={{ fontSize: 17, fontWeight: '700', marginBottom: 10, marginLeft: 2, color: colors.header }}>Security & Actions</Text>
        <View style={{ padding: 20, borderRadius: 18, marginBottom: 40, borderWidth: 1, backgroundColor: colors.cardBg, borderColor: colors.border }}>
          {!isResetting ? (
            <TouchableOpacity
              onPress={() => setIsResetting(true)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border }}
            >
              <Text style={{ fontSize: 15, fontWeight: '500', color: colors.textPrimary }}>Reset Admin Password</Text>
              <ShieldAlert size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border }}>
              <Text style={{ marginBottom: 8, fontWeight: '500', color: colors.textPrimary }}>Enter New Password:</Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New secure password"
                secureTextEntry
                style={{ padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 12, backgroundColor: colors.iconBg, borderColor: colors.border, color: colors.textPrimary }}
                placeholderTextColor={colors.textSecondary}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity onPress={() => { setIsResetting(false); setNewPassword(''); }} style={{ padding: 8, marginRight: 8 }}>
                  <Text style={{ color: colors.textSecondary }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleResetPassword}
                  disabled={resetLoading}
                  style={{ paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10, backgroundColor: colors.accent, opacity: resetLoading ? 0.7 : 1 }}
                >
                  {resetLoading ? <ActivityIndicator size="small" color="white" /> : <Text style={{ color: 'white', fontWeight: '600' }}>Reset</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            onPress={handleDeactivate}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, marginTop: 4 }}
          >
            <Text style={{ fontSize: 15, fontWeight: '500', color: '#ef4444' }}>Deactivate Branch</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Activity Bottom Sheet */}
      <ActivitySheet
        visible={!!sheetType}
        onClose={closeSheet}
        title={sheetType === 'events' ? `Events (${sheetData.length})` : `Internships (${sheetData.length})`}
        data={sheetData}
        loading={sheetLoading}
        type={sheetType}
        colors={colors}
      />
    </View>
  );
}
