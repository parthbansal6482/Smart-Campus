import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { useAuthStore } from '../store/authStore';
import {
  GraduationCap,
  UtensilsCrossed,
  AlertCircle,
  Clock,
  MapPin,
  Sparkles,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

export const HomeScreen: React.FC = () => {
  const { user } = useAuthStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Welcome Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day 👋</Text>
          <Text style={styles.userName}>{user?.name || 'Campus Student'}</Text>
        </View>
        <View style={styles.roleTag}>
          <Text style={styles.roleText}>{user?.role || 'STUDENT'}</Text>
        </View>
      </View>

      {/* Quick Action Grid */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickCard, { backgroundColor: colors.pastelBlue }]}
          onPress={() => navigation.navigate('Main' as any, { screen: 'ClassroomsTab' })}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIcon, { backgroundColor: '#ffffff' }]}>
            <GraduationCap size={22} color={colors.primary} />
          </View>
          <Text style={styles.quickTitle}>Find Room</Text>
          <Text style={styles.quickSubtitle}>Check live vacancies</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickCard, { backgroundColor: colors.pastelAmber }]}
          onPress={() => navigation.navigate('Main' as any, { screen: 'CafeteriaTab' })}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIcon, { backgroundColor: '#ffffff' }]}>
            <UtensilsCrossed size={22} color={colors.pastelAmberDark} />
          </View>
          <Text style={styles.quickTitle}>Order Food</Text>
          <Text style={styles.quickSubtitle}>Skip the lunch queue</Text>
        </TouchableOpacity>
      </View>

      {/* Live Campus Updates */}
      <Text style={styles.sectionTitle}>Campus Live Feed</Text>

      {/* Active Classroom Card */}
      <Card>
        <View style={styles.cardHeader}>
          <View style={styles.tagRow}>
            <StatusBadge label="Vacant Now" variant="success" />
            <Text style={styles.floorText}>Engineering Hall • Floor 1</Text>
          </View>
        </View>
        <Text style={styles.roomName}>ENG-101 (60 Seats)</Text>
        <Text style={styles.roomDesc}>
          HVAC Active (72°F) • High-speed projector available for study group
        </Text>
        <TouchableOpacity
          style={styles.bookAction}
          onPress={() => navigation.navigate('BookRoom', {})}
        >
          <Text style={styles.bookActionText}>Quick Book This Room →</Text>
        </TouchableOpacity>
      </Card>

      {/* Daily Special Food Banner */}
      <Card style={{ backgroundColor: colors.pastelMint }}>
        <View style={styles.cafeteriaBanner}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <Sparkles size={16} color={colors.pastelMintDark} />
              <Text style={styles.bannerTag}>Chef's Daily Special</Text>
            </View>
            <Text style={styles.bannerTitle}>Cold Brew Artisan & Croissant Combo</Text>
            <Text style={styles.bannerPrice}>\$6.99 (Save 15%)</Text>
          </View>
        </View>
      </Card>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  },
  greeting: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  userName: {
    fontSize: typography.sizes.xl,
    color: colors.textPrimary,
    fontWeight: typography.weights.bold,
  },
  roleTag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadius.full,
  },
  roleText: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  quickCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: spacing.borderRadius.lg,
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  quickTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  quickSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  cardHeader: {
    marginBottom: spacing.sm,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  floorText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  roomName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  roomDesc: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  bookAction: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  bookActionText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  cafeteriaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerTag: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.pastelMintDark,
    textTransform: 'uppercase',
  },
  bannerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.pastelMintDark,
  },
  bannerPrice: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.pastelMintDark,
    marginTop: spacing.xs,
  },
});
