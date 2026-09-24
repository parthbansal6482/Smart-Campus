import React from 'react';
import { Linking, StyleSheet } from 'react-native';
import { Clock, MapPin, Phone, Stethoscope, Ambulance } from 'lucide-react-native';
import { CAMPUS } from '../data/mock';
import { AppText } from '../components/AppText';
import { ListGroup, ListItem } from '../components/ListItem';
import { Screen, SectionLabel } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { colors, spacing } from '../theme';

const icon = (Icon: typeof Clock) => <Icon size={18} color={colors.ink} strokeWidth={1.75} />;

export const MedicalCenterInfoScreen: React.FC = () => (
  <Screen bottomSpace={48}>
    <AppText variant="title">Campus Medical Centre</AppText>
    <AppText variant="callout" tone="ink3" style={styles.lede}>
      Walk in any time for first aid, consultations and the pharmacy.
    </AppText>

    <SectionLabel>Visit</SectionLabel>
    <ListGroup>
      <ListItem icon={icon(Clock)} title="Open 24 hours" subtitle="Every day, including holidays" />
      <ListItem icon={icon(MapPin)} title="Health Block, ground floor" subtitle="Next to the Student Centre" />
      <ListItem
        icon={icon(Phone)}
        title={CAMPUS.medicalCenterPhone}
        subtitle="Front desk"
        onPress={() => Linking.openURL(`tel:${CAMPUS.medicalCenterPhone.replace(/\s/g, '')}`)}
        last
      />
    </ListGroup>

    <SectionLabel>On duty now</SectionLabel>
    <ListGroup>
      <ListItem
        icon={icon(Stethoscope)}
        title="Duty doctor"
        subtitle="General physician"
        trailing={<StatusBadge label="Available" tone="ok" />}
      />
      <ListItem
        icon={icon(Ambulance)}
        title="Campus ambulance"
        subtitle="Paramedic unit"
        trailing={<StatusBadge label="On standby" tone="neutral" />}
        last
      />
    </ListGroup>
  </Screen>
);

const styles = StyleSheet.create({
  lede: { marginTop: spacing.sm },
});
