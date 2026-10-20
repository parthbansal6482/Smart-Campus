import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Building2, MessageCircle, Phone, Pill } from 'lucide-react-native';
import { RootStackParamList } from '../types';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ListGroup, ListItem } from '../components/ListItem';
import { Screen, SectionLabel } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { colors, radius, spacing, Tone } from '../theme';
import { useCampusStore } from '../store/campusStore';
import { Emergency } from '../types';
import { medicalService } from '../services/medical.service';
import { realtimeEvents, REALTIME_EVENTS } from '../services/realtimeEvents';
import { humanize } from '../lib/format';

const emergencyTone: Record<Emergency['status'], Tone> = {
  REPORTED: 'critical',
  ASSIGNED: 'info',
  ON_THE_WAY: 'warn',
  ARRIVED: 'ok',
  HANDLED: 'neutral',
  CANCELLED: 'critical',
};

const emergencyDate = (iso: string) => new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });

export const MedicalHelpScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const campus = useCampusStore(state => state.settings);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);

  const loadEmergencies = useCallback(() => {
    medicalService.getMyEmergencies().then(setEmergencies).catch(() => undefined);
  }, []);

  useEffect(() => {
    loadEmergencies();
    return realtimeEvents.on(REALTIME_EVENTS.medicalChanged, loadEmergencies);
  }, [loadEmergencies]);

  return (
    <Screen topInset title="Health" subtitle="Emergency help, the campus pharmacy and the medical centre.">
      <View style={styles.emergency}>
        <AppText variant="heading" style={styles.emergencyTitle}>
          Need help urgently?
        </AppText>
        <AppText variant="callout" tone="ink2" style={styles.emergencyText}>
          Send your location to the campus ambulance. You can add details after the alert is sent.
        </AppText>
        <Button title="Get emergency help" variant="danger" onPress={() => navigation.navigate('EmergencyModal')} />
        <Pressable
          onPress={() => Linking.openURL(`tel:${campus.securityPhone.replace(/\s/g, '')}`)}
          accessibilityRole="button"
          style={styles.callRow}
          hitSlop={6}
        >
          <Phone size={15} color={colors.critical} />
          <AppText variant="label" tone="critical">
            Call campus security · {campus.securityPhone}
          </AppText>
        </Pressable>
      </View>

      <SectionLabel>Services</SectionLabel>
      <ListGroup>
        <ListItem
          icon={<Pill size={18} color={colors.ink} strokeWidth={1.75} />}
          title="Pharmacy"
          subtitle="Order medicines and first-aid supplies"
          onPress={() => navigation.navigate('MedicineStore')}
        />
        <ListItem
          icon={<MessageCircle size={18} color={colors.ink} strokeWidth={1.75} />}
          title="Talk to a nurse"
          subtitle="Request a call back, chat or appointment"
          onPress={() => navigation.navigate('TalkToStaff')}
        />
        <ListItem
          icon={<Building2 size={18} color={colors.ink} strokeWidth={1.75} />}
          title="Medical centre"
          subtitle="Open 24 hours · Health Block"
          onPress={() => navigation.navigate('MedicalCenterInfo')}
          last
        />
      </ListGroup>

      <SectionLabel>Recent emergency alerts</SectionLabel>
      {emergencies.length === 0 ? (
        <Card>
          <AppText variant="body" tone="ink2">Your emergency alerts will appear here.</AppText>
        </Card>
      ) : (
        <View style={styles.requests}>
          {emergencies.slice(0, 3).map(emergency => (
            <Card key={emergency.id}>
              <View style={styles.requestTop}>
                <View style={styles.flex}>
                  <AppText variant="subheading">{humanize(emergency.tag)}</AppText>
                  <AppText variant="caption" tone="ink3" style={styles.requestMeta}>
                    {emergencyDate(emergency.reportedAt)} · {emergency.building?.name || 'Location shared from device'}
                  </AppText>
                </View>
                <StatusBadge label={humanize(emergency.status)} tone={emergencyTone[emergency.status]} />
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  emergency: {
    backgroundColor: colors.criticalSoft,
    borderColor: colors.criticalLine,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  emergencyTitle: { color: colors.critical },
  emergencyText: { marginTop: 6, marginBottom: spacing.xl },
  callRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.lg },
  requests: { gap: spacing.md },
  flex: { flex: 1 },
  requestTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  requestMeta: { marginTop: 4 },
});
