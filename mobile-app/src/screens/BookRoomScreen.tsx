import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Clock, Calendar } from 'lucide-react-native';

export const BookRoomScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const room = route.params?.room;

  const [purpose, setPurpose] = useState('');
  const [durationHours, setDurationHours] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBooking = () => {
    if (!purpose.trim()) {
      Alert.alert('Missing Field', 'Please enter a purpose for booking');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Booking Confirmed! 🎉',
        `Classroom ${room?.roomNumber || 'ENG-101'} reserved for ${durationHours} hour(s). Automation systems configured.`,
        [{ text: 'Great', onPress: () => navigation.goBack() }]
      );
    }, 600);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.sectionLabel}>Selected Classroom</Text>
        <Text style={styles.roomName}>{room?.roomNumber || 'ENG-101'}</Text>
        <Text style={styles.building}>
          {room?.building?.name || 'Engineering Hall'} • Capacity: {room?.capacity || 60} Seats
        </Text>
      </Card>

      <Card>
        <Text style={styles.sectionLabel}>Reservation Details</Text>

        <Text style={styles.inputLabel}>Booking Purpose / Topic</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Study Session, Project Presentation"
          value={purpose}
          onChangeText={setPurpose}
        />

        <Text style={styles.inputLabel}>Duration (Hours)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={durationHours}
          onChangeText={setDurationHours}
        />

        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            💡 Facility automation will activate lights and HVAC 5 minutes before reservation start time.
          </Text>
        </View>

        <Button
          title="Confirm Room Reservation"
          onPress={handleBooking}
          isLoading={isSubmitting}
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
  sectionLabel: {
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  roomName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  building: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  noticeBox: {
    backgroundColor: colors.pastelBlue,
    padding: spacing.md,
    borderRadius: spacing.borderRadius.md,
    marginTop: spacing.lg,
  },
  noticeText: {
    fontSize: typography.sizes.xs,
    color: colors.pastelBlueDark,
    lineHeight: 18,
  },
});
