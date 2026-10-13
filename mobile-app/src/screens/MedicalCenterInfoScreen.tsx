import React from 'react';
import { Linking, StyleSheet } from 'react-native';
import { Clock, MapPin, Phone } from 'lucide-react-native';
import { AppText } from '../components/AppText';
import { ListGroup, ListItem } from '../components/ListItem';
import { Screen, SectionLabel } from '../components/Screen';
import { colors, spacing } from '../theme';
import { useCampusStore } from '../store/campusStore';

const icon = (Icon: typeof Clock) => <Icon size={18} color={colors.ink} strokeWidth={1.75} />;

export const MedicalCenterInfoScreen: React.FC = () => {
  const campus = useCampusStore(state => state.settings);

  return (
  <Screen bottomSpace={48}>
    <AppText variant="title">Campus Medical Centre</AppText>
    <AppText variant="callout" tone="ink3" style={styles.lede}>
      Walk in any time for first aid, consultations and the pharmacy.
    </AppText>

    <SectionLabel>Visit</SectionLabel>
    <ListGroup>
      <ListItem icon={icon(Clock)} title="Open 24 hours" subtitle="Every day, including holidays" />
      <ListItem icon={icon(MapPin)} title={campus.medicalCenterLocation} />
      <ListItem
        icon={icon(Phone)}
        title={campus.medicalCenterPhone}
        subtitle="Front desk"
        onPress={() => Linking.openURL(`tel:${campus.medicalCenterPhone.replace(/\s/g, '')}`)}
        last
      />
    </ListGroup>
  </Screen>
  );
};

const styles = StyleSheet.create({
  lede: { marginTop: spacing.sm },
});
