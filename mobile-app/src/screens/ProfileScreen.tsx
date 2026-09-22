import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Card } from '../components/Card';
import { ListItem } from '../components/ListItem';
import { Button } from '../components/Button';
import { useAuthStore } from '../store/authStore';
import {
  User as UserIcon,
  Shield,
  Bell,
  HelpCircle,
  LogOut,
  MapPin,
  CalendarCheck,
  CreditCard,
  QrCode,
  CheckCircle2,
  PhoneCall,
  Utensils,
} from 'lucide-react-native';

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuthStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Digital Campus ID Card */}
      <View style={styles.idCard}>
        <View style={styles.idCardHeader}>
          <View>
            <Text style={styles.idCardOrg}>SMART CAMPUS UNIFIED SYSTEM</Text>
            <Text style={styles.idCardType}>DIGITAL IDENTITY PASS</Text>
          </View>
          <View style={styles.activePill}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>ACTIVE</Text>
          </View>
        </View>

        <View style={styles.idCardBody}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'A'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.name || 'Alex Johnson'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'student@smartcampus.edu'}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>ID:</Text>
              <Text style={styles.metaValue}>SC-2026-8941</Text>
              <Text style={styles.metaDivider}>•</Text>
              <Text style={styles.metaLabel}>ROLE:</Text>
              <Text style={styles.roleTag}>{user?.role || 'STUDENT'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.idCardFooter}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={13} color="#94a3b8" />
            <Text style={styles.idCardSub}>Verified by Campus Registrar • Spring 2026</Text>
          </View>
          <QrCode size={18} color="#94a3b8" />
        </View>
      </View>

      {/* Academic & Campus Services */}
      <Text style={styles.sectionHeader}>Campus & Facility Records</Text>
      <Card style={styles.menuCard}>
        <ListItem
          title="Active Room Bookings"
          subtitle="1 upcoming classroom reservation in ENG-204"
          leftIcon={<CalendarCheck size={18} color="#2563eb" />}
          onPress={() => Alert.alert('Reservations', 'You have ENG-204 booked today at 2:00 PM.')}
        />
        <View style={styles.divider} />
        <ListItem
          title="Cafeteria Tray & Meal History"
          subtitle="View digital receipt tokens & order statuses"
          leftIcon={<Utensils size={18} color="#d97706" />}
          onPress={() => Alert.alert('Meal History', 'Last order: Cold Brew Artisan Coffee (Collected).')}
        />
        <View style={styles.divider} />
        <ListItem
          title="Emergency Contacts & Medical Info"
          subtitle="Blood group: O+ • Allergy tags updated"
          leftIcon={<Shield size={18} color="#059669" />}
          onPress={() => Alert.alert('Medical Profile', 'Emergency contact: +1-555-0199')}
        />
      </Card>

      {/* Preferences & Security */}
      <Text style={styles.sectionHeader}>Preferences & Device Security</Text>
      <Card style={styles.menuCard}>
        <ListItem
          title="Emergency Broadcast Notifications"
          subtitle="Instant high-priority sirens for severe alerts"
          leftIcon={<Bell size={18} color="#7c3aed" />}
          onPress={() => Alert.alert('Alert Preferences', 'Push alerts are currently enabled.')}
        />
        <View style={styles.divider} />
        <ListItem
          title="Campus Security Helpline"
          subtitle="24/7 Security Operations Center (+1-555-0100)"
          leftIcon={<PhoneCall size={18} color="#64748b" />}
          onPress={() => Alert.alert('Campus Security', 'Call +1-555-0100 for non-medical emergencies.')}
        />
      </Card>

      {/* Log Out Button */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => {
          Alert.alert('Sign Out', 'Are you sure you want to sign out of Smart Campus?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: logout },
          ]);
        }}
        activeOpacity={0.8}
      >
        <LogOut size={16} color="#dc2626" />
        <Text style={styles.logoutText}>Sign Out of Campus ID</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Smart Campus Unified App • v2.4.0 (Build 2026.09)</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  idCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: spacing.md + 2,
    marginBottom: spacing.md,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  idCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: spacing.sm,
  },
  idCardOrg: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  idCardType: {
    fontSize: 13,
    fontWeight: typography.weights.bold,
    color: '#ffffff',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#064e3b',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#059669',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  activeText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: '#34d399',
    letterSpacing: 0.5,
  },
  idCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    borderWidth: 2,
    borderColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: typography.weights.bold,
    color: '#ffffff',
  },
  userName: {
    fontSize: 16,
    fontWeight: typography.weights.bold,
    color: '#ffffff',
  },
  userEmail: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  metaLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: typography.weights.semibold,
  },
  metaValue: {
    fontSize: 10,
    color: '#cbd5e1',
    fontWeight: typography.weights.bold,
    fontVariant: ['tabular-nums'],
  },
  metaDivider: {
    fontSize: 10,
    color: '#475569',
    marginHorizontal: 2,
  },
  roleTag: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: '#93c5fd',
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  idCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 8,
  },
  idCardSub: {
    fontSize: 10,
    color: '#64748b',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  menuCard: {
    padding: 0,
    borderRadius: 10,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: spacing.md,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fecdd3',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: typography.weights.bold,
    color: '#dc2626',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 10,
    color: '#94a3b8',
    marginTop: spacing.lg,
  },
});
