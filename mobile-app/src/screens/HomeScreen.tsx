import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { useAuthStore } from '../store/authStore';
import {
  GraduationCap,
  UtensilsCrossed,
  Pill,
  PhoneCall,
  Clock,
  MapPin,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Tv,
  Wind,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

export const HomeScreen: React.FC = () => {
  const { user } = useAuthStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Executive Welcome Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'S'}</Text>
          </View>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'Campus Member'}</Text>
          </View>
        </View>
        <View style={styles.roleTag}>
          <Text style={styles.roleText}>{user?.role || 'STUDENT'}</Text>
        </View>
      </View>

      {/* Safety & Service Telemetry Banner */}
      <View style={styles.statusBanner}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>
          Campus Medical Responders On Duty • 24/7 Hotline Ready
        </Text>
      </View>

      {/* 4 Quick Action Cards Grid */}
      <Text style={styles.sectionTitle}>Campus Services</Text>
      <View style={styles.quickGrid}>
        <TouchableOpacity
          style={[styles.quickCard, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}
          onPress={() => navigation.navigate('Main' as any, { screen: 'ClassroomsTab' })}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIcon, { backgroundColor: '#ffffff' }]}>
            <GraduationCap size={20} color="#2563eb" />
          </View>
          <Text style={styles.quickTitle}>Find Room</Text>
          <Text style={styles.quickSubtitle}>Live vacancies & AC</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickCard, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}
          onPress={() => navigation.navigate('Main' as any, { screen: 'CafeteriaTab' })}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIcon, { backgroundColor: '#ffffff' }]}>
            <UtensilsCrossed size={20} color="#d97706" />
          </View>
          <Text style={styles.quickTitle}>Order Food</Text>
          <Text style={styles.quickSubtitle}>Skip the line tokens</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickCard, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}
          onPress={() => navigation.navigate('MedicineStore')}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIcon, { backgroundColor: '#ffffff' }]}>
            <Pill size={20} color="#059669" />
          </View>
          <Text style={styles.quickTitle}>Pharmacy</Text>
          <Text style={styles.quickSubtitle}>Order OTC / First-Aid</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickCard, { backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }]}
          onPress={() => navigation.navigate('TalkToStaff')}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIcon, { backgroundColor: '#ffffff' }]}>
            <PhoneCall size={20} color="#7c3aed" />
          </View>
          <Text style={styles.quickTitle}>Dr. Callback</Text>
          <Text style={styles.quickSubtitle}>Triage consultation</Text>
        </TouchableOpacity>
      </View>

      {/* Real-time Vacant Room Feature Card */}
      <Text style={styles.sectionTitle}>Featured Vacant Classroom</Text>
      <Card>
        <View style={styles.cardHeader}>
          <View style={styles.tagRow}>
            <StatusBadge label="Vacant Now" variant="success" dot />
            <Text style={styles.floorText}>Alan Turing Hall • Floor 1</Text>
          </View>
        </View>
        <Text style={styles.roomName}>ENG-101 (60 Seats)</Text>
        <Text style={styles.roomDesc}>
          Climate automated (70°F) • High-definition projector & dual displays enabled.
        </Text>

        <View style={styles.facilityRow}>
          <View style={styles.facilityPill}>
            <Wind size={13} color="#2563eb" />
            <Text style={styles.facilityText}>HVAC Active</Text>
          </View>
          <View style={styles.facilityPill}>
            <Tv size={13} color="#7c3aed" />
            <Text style={styles.facilityText}>AV Ready</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.bookAction}
          onPress={() => navigation.navigate('BookRoom', {})}
          activeOpacity={0.8}
        >
          <Text style={styles.bookActionText}>Reserve This Room for Study</Text>
          <ArrowRight size={15} color="#2563eb" />
        </TouchableOpacity>
      </Card>

      {/* Daily Special Dining Offer */}
      <Text style={styles.sectionTitle}>Cafeteria Special of the Day</Text>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('Main' as any, { screen: 'CafeteriaTab' })}
      >
        <Card style={styles.dealCard}>
          <View style={styles.cafeteriaBanner}>
            <View style={{ flex: 1 }}>
              <View style={styles.specialBadge}>
                <Sparkles size={13} color="#b45309" />
                <Text style={styles.specialBadgeText}>Chef's Special Combo</Text>
              </View>
              <Text style={styles.bannerTitle}>Cold Brew Artisan & Chicken Panini</Text>
              <Text style={styles.bannerDesc}>Slow-steeped organic coffee paired with fresh sourdough sandwich</Text>
              <View style={styles.priceRow}>
                <Text style={styles.bannerPrice}>\$11.40</Text>
                <Text style={styles.strikePrice}>\$13.45</Text>
                <Text style={styles.discountTag}>15% OFF</Text>
              </View>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 18,
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  greeting: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  userName: {
    fontSize: 18,
    color: '#0f172a',
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  roleTag: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  roleText: {
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    marginBottom: 20,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10b981',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.2,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  quickCard: {
    width: '48%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  quickSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  cardHeader: {
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  floorText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  roomName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  roomDesc: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    lineHeight: 17,
  },
  facilityRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  facilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  facilityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  bookAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  bookActionText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
  },
  dealCard: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
  },
  cafeteriaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  specialBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400e',
    textTransform: 'uppercase',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#78350f',
  },
  bannerDesc: {
    fontSize: 11,
    color: '#92400e',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  bannerPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#78350f',
  },
  strikePrice: {
    fontSize: 12,
    color: '#b45309',
    textDecorationLine: 'line-through',
  },
  discountTag: {
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
});
