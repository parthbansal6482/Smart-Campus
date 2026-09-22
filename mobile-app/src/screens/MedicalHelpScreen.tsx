import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Card } from '../components/Card';
import { ListItem } from '../components/ListItem';
import { StatusBadge } from '../components/StatusBadge';
import {
  AlertTriangle,
  Pill,
  MessageSquare,
  Clock,
  MapPin,
  ChevronRight,
  ShieldCheck,
  PhoneCall,
  Activity,
  Heart,
  UserCheck,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

export const MedicalHelpScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedTag, setSelectedTag] = useState<string>('INJURY');

  const emergencyTags = [
    { key: 'INJURY', label: 'Physical Injury' },
    { key: 'FAINTED', label: 'Fainted / Unconscious' },
    { key: 'ALLERGIC_REACTION', label: 'Allergic Reaction' },
    { key: 'BREATHING', label: 'Asthma / Chest' },
    { key: 'OTHER', label: 'Other Emergency' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Track A: Emergency / Ambulance Dispatch Card */}
      <View style={styles.sosCard}>
        <View style={styles.sosTopRow}>
          <View style={styles.sosBadge}>
            <Activity size={12} color="#ffffff" />
            <Text style={styles.sosBadgeText}>PRIORITY 1 DISPATCH</Text>
          </View>
          <Text style={styles.estTime}>~3 min avg response</Text>
        </View>

        <View style={styles.sosHeader}>
          <View style={styles.sosIconCircle}>
            <AlertTriangle color="#ffffff" size={24} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sosTitle}>Immediate Ambulance SOS</Text>
            <Text style={styles.sosSubtitle}>
              Broadcasts GPS coordinates directly to campus paramedics and security.
            </Text>
          </View>
        </View>

        {/* Context Tag Selector */}
        <Text style={styles.tagLabel}>Emergency Context (Select One)</Text>
        <View style={styles.tagRow}>
          {emergencyTags.map(tag => {
            const active = selectedTag === tag.key;
            return (
              <TouchableOpacity
                key={tag.key}
                style={[styles.tagChip, active && styles.tagChipActive]}
                onPress={() => setSelectedTag(tag.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tagChipText, active && styles.tagChipTextActive]}>
                  {tag.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* SOS Action Button */}
        <TouchableOpacity
          style={styles.sosButton}
          onPress={() => navigation.navigate('EmergencyModal')}
          activeOpacity={0.85}
        >
          <AlertTriangle color="#ffffff" size={20} />
          <Text style={styles.sosButtonText}>DISPATCH AMBULANCE NOW</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.hotlineLink}
          onPress={() => Linking.openURL('tel:15550911').catch(() => {})}
          activeOpacity={0.7}
        >
          <PhoneCall size={14} color="#b91c1c" />
          <Text style={styles.hotlineText}>Direct Dial: Campus Paramedics (+1-555-0911)</Text>
        </TouchableOpacity>
      </View>

      {/* Track B: Medical Center Non-Emergency Services */}
      <Text style={styles.sectionHeader}>Campus Health & Clinic Services</Text>

      <Card style={styles.serviceCard}>
        <ListItem
          title="Order Medicines & First-Aid"
          subtitle="OTC pharmacy delivery & prescription upload"
          leftIcon={<Pill size={20} color="#2563eb" />}
          onPress={() => navigation.navigate('MedicineStore')}
        />
        <View style={styles.divider} />
        <ListItem
          title="Physician / Nurse Callback"
          subtitle="Request clinical triage or telehealth callback"
          leftIcon={<MessageSquare size={20} color="#7c3aed" />}
          onPress={() => navigation.navigate('TalkToStaff')}
        />
        <View style={styles.divider} />
        <ListItem
          title="Infirmary Operating Hours & Location"
          subtitle="Central Health Hall • Room 102 • Open 24/7"
          leftIcon={<Clock size={20} color="#059669" />}
          onPress={() => navigation.navigate('MedicalCenterInfo')}
        />
      </Card>

      {/* Recent Incident / Care Log */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Recent Care Requests</Text>
        <Text style={styles.sectionHeaderSub}>GPS Geotagged</Text>
      </View>

      <Card style={styles.historyCard}>
        <View style={styles.historyRow}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <StatusBadge label="RESOLVED" variant="success" />
              <Text style={styles.historyDate}>Yesterday • 4:15 PM</Text>
            </View>
            <Text style={styles.historyTitle}>Minor Lab Cut / First Aid Kit</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <MapPin size={12} color="#64748b" />
              <Text style={styles.historyLoc}>Marie Curie Science Complex (Floor 1, Rm 104)</Text>
            </View>
          </View>
          <View style={styles.shieldBadge}>
            <ShieldCheck color="#059669" size={20} />
          </View>
        </View>
      </Card>
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
  sosCard: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 12,
    padding: spacing.md + 2,
    marginBottom: spacing.md,
  },
  sosTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sosBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e11d48',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sosBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  estTime: {
    fontSize: 11,
    color: '#9f1239',
    fontWeight: typography.weights.medium,
  },
  sosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sosIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosTitle: {
    fontSize: 16,
    fontWeight: typography.weights.bold,
    color: '#881337',
  },
  sosSubtitle: {
    fontSize: 12,
    color: '#4c0519',
    marginTop: 2,
    lineHeight: 16,
  },
  tagLabel: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#9f1239',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fda4af',
  },
  tagChipActive: {
    backgroundColor: '#be123c',
    borderColor: '#be123c',
  },
  tagChipText: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: '#9f1239',
  },
  tagChipTextActive: {
    color: '#ffffff',
  },
  sosButton: {
    backgroundColor: '#e11d48',
    paddingVertical: 13,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  sosButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  hotlineLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#fecdd3',
  },
  hotlineText: {
    fontSize: 11,
    color: '#9f1239',
    fontWeight: typography.weights.bold,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionHeaderSub: {
    fontSize: 11,
    color: '#64748b',
  },
  serviceCard: {
    padding: 0,
    borderRadius: 10,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: spacing.md,
  },
  historyCard: {
    padding: spacing.md,
    borderRadius: 10,
    borderColor: '#e2e8f0',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyDate: {
    fontSize: 11,
    color: '#64748b',
    fontVariant: ['tabular-nums'],
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: typography.weights.bold,
    color: '#0f172a',
  },
  historyLoc: {
    fontSize: 11,
    color: '#64748b',
  },
  shieldBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
});
