import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
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
} from 'lucide-react-native';

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuthStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'Alex Johnson'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'student@smartcampus.edu'}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{user?.role || 'STUDENT'}</Text>
        </View>
      </View>

      {/* Account Settings */}
      <Text style={styles.sectionHeader}>Campus Account</Text>
      <Card>
        <ListItem
          title="Active Room Bookings"
          subtitle="1 upcoming classroom reservation"
          leftIcon={<CalendarCheck size={20} color={colors.primary} />}
          onPress={() => {}}
        />
        <ListItem
          title="Notifications & Alerts"
          subtitle="Push notifications for emergency broadcasts"
          leftIcon={<Bell size={20} color={colors.pastelAmberDark} />}
          onPress={() => {}}
        />
        <ListItem
          title="Campus Security & Privacy"
          subtitle="Location permissions and emergency sharing"
          leftIcon={<Shield size={20} color={colors.success} />}
          onPress={() => {}}
        />
      </Card>

      {/* Support */}
      <Text style={styles.sectionHeader}>Support & Help</Text>
      <Card>
        <ListItem
          title="Campus Support Hotline"
          subtitle="+1-555-0100"
          leftIcon={<HelpCircle size={20} color={colors.textSecondary} />}
          onPress={() => {}}
        />
      </Card>

      <Button
        title="Log Out"
        variant="outline"
        onPress={logout}
        leftIcon={<LogOut size={18} color={colors.emergency} />}
        style={styles.logoutBtn}
        textStyle={{ color: colors.emergency }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  userCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: typography.weights.bold,
    color: '#ffffff',
  },
  userName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.pastelBlue,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadius.full,
    marginTop: spacing.sm,
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.pastelBlueDark,
  },
  sectionHeader: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  logoutBtn: {
    marginTop: spacing.lg,
    borderColor: colors.emergencyLight,
    backgroundColor: '#fff5f5',
  },
});
