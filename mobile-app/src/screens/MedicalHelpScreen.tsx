import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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
  History,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

export const MedicalHelpScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedTag, setSelectedTag] = useState<string>('INJURY');

  const emergencyTags = ['FAINTED', 'INJURY', 'ALLERGIC_REACTION', 'OTHER'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Track A: Emergency / Ambulance Card */}
      <Card style={styles.emergencyCard}>
        <View style={styles.emergencyHeader}>
          <View style={styles.iconCircle}>
            <AlertTriangle color="#ffffff" size={24} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyTitle}>Ambulance & Emergency Dispatch</Text>
            <Text style={styles.emergencySubtitle}>
              One-tap immediate dispatch to campus medical responders
            </Text>
          </View>
        </View>

        {/* Context Tag Selector */}
        <Text style={styles.tagLabel}>Select Emergency Context</Text>
        <View style={styles.tagRow}>
          {emergencyTags.map(tag => (
            <TouchableOpacity
              key={tag}
              style={[styles.tagChip, selectedTag === tag && styles.tagChipActive]}
              onPress={() => setSelectedTag(tag)}
            >
              <Text style={[styles.tagChipText, selectedTag === tag && styles.tagChipTextActive]}>
                {tag.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SOS Action Button */}
        <TouchableOpacity
          style={styles.sosButton}
          onPress={() => navigation.navigate('EmergencyModal')}
          activeOpacity={0.85}
        >
          <AlertTriangle color="#ffffff" size={22} />
          <Text style={styles.sosButtonText}>TRIGGER EMERGENCY DISPATCH</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.hotlineLink}
          onPress={() => {}}
        >
          <PhoneCall size={14} color={colors.emergencyDark} />
          <Text style={styles.hotlineText}>Fallback: Call Medical Helpline (+1-555-0911)</Text>
        </TouchableOpacity>
      </Card>

      {/* Track B: Medical Center Non-Emergency Services */}
      <Text style={styles.sectionHeader}>Campus Medical Center Services</Text>

      <Card>
        <ListItem
          title="Order Medicines & First-Aid"
          subtitle="Browse pharmacy catalog, OTC & prescription delivery"
          leftIcon={<Pill size={22} color={colors.primary} />}
          onPress={() => navigation.navigate('MedicineStore')}
        />
        <ListItem
          title="Talk to Medical Staff"
          subtitle="Request a callback or book lightweight consultation"
          leftIcon={<MessageSquare size={22} color={colors.pastelPurpleDark} />}
          onPress={() => navigation.navigate('TalkToStaff')}
        />
        <ListItem
          title="Medical Center Information"
          subtitle="Operating hours, campus map location & on-duty list"
          leftIcon={<Clock size={22} color={colors.pastelMintDark} />}
          onPress={() => navigation.navigate('MedicalCenterInfo')}
        />
      </Card>

      {/* Recent Medical Requests History */}
      <Text style={styles.sectionHeader}>My Emergency Request History</Text>
      <Card>
        <View style={styles.historyRow}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <StatusBadge label="HANDLED" variant="success" />
              <Text style={styles.historyDate}>Yesterday, 4:15 PM</Text>
            </View>
            <Text style={styles.historyTitle}>Minor Lab Injury Tag</Text>
            <Text style={styles.historyLoc}>Marie Curie Science Complex (Floor 1)</Text>
          </View>
          <ShieldCheck color={colors.success} size={20} />
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
  emergencyCard: {
    backgroundColor: colors.emergencyLight,
    borderColor: '#fecaca',
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.emergency,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.emergencyDark,
  },
  emergencySubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tagLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.emergencyDark,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tagChip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadius.md,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  tagChipActive: {
    backgroundColor: colors.emergency,
    borderColor: colors.emergency,
  },
  tagChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.emergencyDark,
  },
  tagChipTextActive: {
    color: '#ffffff',
  },
  sosButton: {
    backgroundColor: colors.emergency,
    paddingVertical: spacing.md,
    borderRadius: spacing.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: colors.emergency,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sosButtonText: {
    color: '#ffffff',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  hotlineLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  hotlineText: {
    fontSize: typography.sizes.xs,
    color: colors.emergencyDark,
    fontWeight: typography.weights.semibold,
  },
  sectionHeader: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyDate: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  historyTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: 4,
  },
  historyLoc: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
