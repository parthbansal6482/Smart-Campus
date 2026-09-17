import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { AlertTriangle, MapPin, PhoneCall, ShieldCheck, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export const EmergencyScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isTriggered, setIsTriggered] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTriggerSOS = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsTriggered(true);
    }, 800);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <AlertTriangle color={colors.emergency} size={24} />
          <Text style={styles.headerTitle}>Emergency Health Assistance</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <X color={colors.textSecondary} size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {!isTriggered ? (
          <>
            {/* GPS & Building Detection */}
            <Card style={styles.locationCard}>
              <View style={styles.locationRow}>
                <MapPin color={colors.emergency} size={20} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.locLabel}>Nearest Campus Landmark</Text>
                  <Text style={styles.locName}>Marie Curie Science Complex (SCI)</Text>
                  <Text style={styles.locCoords}>GPS: 37.7756° N, 122.4184° W (±4m accuracy)</Text>
                </View>
              </View>
            </Card>

            <View style={styles.sosContainer}>
              <TouchableOpacity
                style={styles.sosButton}
                activeOpacity={0.8}
                onPress={handleTriggerSOS}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="large" />
                ) : (
                  <>
                    <Text style={styles.sosText}>SOS</Text>
                    <Text style={styles.sosSubtext}>TAP FOR IMMEDIATE DISPATCH</Text>
                  </>
                )}
              </TouchableOpacity>
              <Text style={styles.disclaimer}>
                Alerts campus medical EMT team and campus police instantly.
              </Text>
            </View>

            <View style={styles.hotlineCard}>
              <PhoneCall color={colors.primary} size={18} />
              <Text style={styles.hotlineText}>Campus Security Hotline: +1-555-0911</Text>
            </View>
          </>
        ) : (
          /* Triggered Live Response State */
          <View style={styles.activeState}>
            <View style={styles.pulseBadge}>
              <ShieldCheck color={colors.success} size={48} />
            </View>

            <Text style={styles.activeTitle}>EMERGENCY DISPATCHED</Text>
            <Text style={styles.activeSubtitle}>
              Campus medical team has received your GPS location and is en route.
            </Text>

            <Card style={styles.statusCard}>
              <View style={styles.statusStep}>
                <View style={[styles.stepDot, { backgroundColor: colors.success }]} />
                <Text style={styles.stepText}>Alert Received & Logged (00:02)</Text>
              </View>
              <View style={styles.statusStep}>
                <View style={[styles.stepDot, { backgroundColor: colors.warning }]} />
                <Text style={styles.stepText}>Responder Unit #2 Dispatched (ETA 2 mins)</Text>
              </View>
            </Card>

            <Button
              title="Cancel Emergency"
              variant="outline"
              onPress={() => {
                Alert.alert('Cancel Alert', 'Are you sure you want to cancel the emergency alert?', [
                  { text: 'No' },
                  { text: 'Yes, Cancel', onPress: () => setIsTriggered(false) },
                ]);
              }}
              style={{ marginTop: spacing.xl }}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  content: {
    padding: spacing.lg,
    flex: 1,
    justifyContent: 'center',
  },
  locationCard: {
    backgroundColor: colors.emergencyLight,
    borderColor: '#fecaca',
  },
  locationRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  locLabel: {
    fontSize: typography.sizes.xs,
    color: colors.emergencyDark,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
  },
  locName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  locCoords: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sosContainer: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.emergency,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.emergency,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 6,
    borderColor: '#fee2e2',
  },
  sosText: {
    fontSize: 48,
    fontWeight: typography.weights.bold,
    color: '#ffffff',
    letterSpacing: 2,
  },
  sosSubtext: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#ffffff',
    marginTop: 4,
    opacity: 0.9,
  },
  disclaimer: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  hotlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.pastelBlue,
    padding: spacing.md,
    borderRadius: spacing.borderRadius.md,
  },
  hotlineText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.pastelBlueDark,
  },
  activeState: {
    alignItems: 'center',
  },
  pulseBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.pastelMint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  activeTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.emergency,
  },
  activeSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  statusCard: {
    width: '100%',
  },
  statusStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepText: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
});
