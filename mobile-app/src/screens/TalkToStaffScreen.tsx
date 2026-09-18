import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { MessageSquare, PhoneCall, Calendar, UserCheck } from 'lucide-react-native';

export const TalkToStaffScreen: React.FC = () => {
  const [requestType, setRequestType] = useState<'CALLBACK' | 'APPOINTMENT' | 'CHAT'>('CALLBACK');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!note.trim()) {
      Alert.alert('Required', 'Please describe your concern briefly.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      Alert.alert(
        'Request Sent! 🩺',
        `Your ${requestType.toLowerCase()} request has been sent to the on-duty campus medical staff.`,
        [{ text: 'OK' }]
      );
      setNote('');
    }, 600);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <View style={styles.staffHeader}>
          <View style={styles.statusDot} />
          <Text style={styles.staffTitle}>Medical Staff On-Duty (Available)</Text>
        </View>
        <Text style={styles.staffDesc}>
          Dr. House & EMT Team are currently available for non-emergency guidance.
        </Text>
      </Card>

      <Card>
        <Text style={styles.sectionLabel}>Select Consultation Mode</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeBtn, requestType === 'CALLBACK' && styles.typeActive]}
            onPress={() => setRequestType('CALLBACK')}
          >
            <PhoneCall size={18} color={requestType === 'CALLBACK' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.typeText, requestType === 'CALLBACK' && styles.typeTextActive]}>
              Request Callback
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeBtn, requestType === 'APPOINTMENT' && styles.typeActive]}
            onPress={() => setRequestType('APPOINTMENT')}
          >
            <Calendar size={18} color={requestType === 'APPOINTMENT' ? colors.primary : colors.textSecondary} />
            <Text style={[styles.typeText, requestType === 'APPOINTMENT' && styles.typeTextActive]}>
              Book Slot
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.inputLabel}>Health Concern / Symptoms Note</Text>
        <TextInput
          style={[styles.input, { height: 90 }]}
          placeholder="Briefly describe your symptoms or question..."
          multiline
          value={note}
          onChangeText={setNote}
        />

        <Button
          title="Submit Medical Request"
          onPress={handleSubmit}
          isLoading={submitting}
          style={{ marginTop: spacing.lg }}
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
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  staffTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  staffDesc: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: spacing.borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeActive: {
    backgroundColor: colors.pastelBlue,
    borderColor: colors.primary,
  },
  typeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  typeTextActive: {
    color: colors.primary,
  },
  inputLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
});
