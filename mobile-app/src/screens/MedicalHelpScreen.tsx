import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Building2, MessageCircle, Phone, Pill } from 'lucide-react-native';
import { RootStackParamList } from '../types';
import { CAMPUS } from '../data/mock';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ListGroup, ListItem } from '../components/ListItem';
import { Screen, SectionLabel } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { colors, radius, spacing } from '../theme';

export const MedicalHelpScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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
          onPress={() => Linking.openURL(`tel:${CAMPUS.securityPhone.replace(/\s/g, '')}`)}
          accessibilityRole="button"
          style={styles.callRow}
          hitSlop={6}
        >
          <Phone size={15} color={colors.critical} />
          <AppText variant="label" tone="critical">
            Call campus security · {CAMPUS.securityPhone}
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

      <SectionLabel>Recent requests</SectionLabel>
      <Card>
        <View style={styles.requestTop}>
          <AppText variant="subheading">Minor cut in the lab</AppText>
          <StatusBadge label="Resolved" tone="ok" />
        </View>
        <AppText variant="caption" tone="ink3" style={styles.requestMeta}>
          Yesterday, 4:15 PM · Marie Curie Science Complex, floor 1
        </AppText>
      </Card>
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
  requestTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  requestMeta: { marginTop: 4 },
});
