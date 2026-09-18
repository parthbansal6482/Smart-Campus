import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Card } from '../components/Card';
import { ListItem } from '../components/ListItem';
import { Clock, MapPin, Phone, UserCheck, ShieldCheck } from 'lucide-react-native';

export const MedicalCenterInfoScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.title}>Campus Medical Center & Infirmary</Text>
        <Text style={styles.subtitle}>
          24/7 emergency response & daily primary healthcare services for all campus members.
        </Text>
      </Card>

      <Text style={styles.sectionHeader}>Hours & Location</Text>
      <Card>
        <ListItem
          title="Operating Hours"
          subtitle="Open 24 Hours • 7 Days a week"
          leftIcon={<Clock size={20} color={colors.primary} />}
          showChevron={false}
        />
        <ListItem
          title="Campus Location"
          subtitle="Ground Floor, Health Block (Adjacent to Student Center)"
          leftIcon={<MapPin size={20} color={colors.emergency} />}
          showChevron={false}
        />
        <ListItem
          title="Direct Phone Line"
          subtitle="+1-555-0105"
          leftIcon={<Phone size={20} color={colors.success} />}
          showChevron={false}
        />
      </Card>

      <Text style={styles.sectionHeader}>On-Duty Medical Team</Text>
      <Card>
        <ListItem
          title="Dr. Gregory House"
          subtitle="Chief Medical Officer • Available"
          leftIcon={<UserCheck size={20} color={colors.primary} />}
          showChevron={false}
        />
        <ListItem
          title="Paramedic Unit Alpha"
          subtitle="Ambulance Dispatch • On Standby"
          leftIcon={<ShieldCheck size={20} color={colors.pastelMintDark} />}
          showChevron={false}
        />
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
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sectionHeader: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
});
