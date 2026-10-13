import React from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Bell, CalendarDays, LogOut, Pill, Phone, ReceiptText, ShieldCheck } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { AppText } from '../components/AppText';
import { Card } from '../components/Card';
import { ListGroup, ListItem } from '../components/ListItem';
import { Screen, SectionLabel } from '../components/Screen';
import { colors, fonts, spacing } from '../theme';
import { humanize, initials } from '../lib/format';
import { useCampusStore } from '../store/campusStore';

const icon = (Icon: typeof Phone) => <Icon size={18} color={colors.ink} strokeWidth={1.75} />;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();
  const campus = useCampusStore(state => state.settings);
  const unread = useCampusStore(state => state.unreadNotifications);

  const confirmLogout = () =>
    Alert.alert('Sign out?', 'You’ll need your campus email and password to sign back in.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);

  return (
    <Screen topInset title="Profile">
      <Card style={styles.idCard}>
        <View style={styles.idTop}>
          <View style={styles.avatar}>
            <AppText style={styles.avatarText}>{initials(user?.name)}</AppText>
          </View>
          <View style={styles.flex}>
            <AppText variant="heading">{user?.name ?? 'Campus member'}</AppText>
            <AppText variant="caption" tone="ink3">
              {user?.role ? humanize(user.role) : ''}
            </AppText>
          </View>
        </View>
        <View style={styles.idDetails}>
          <Detail label="Email" value={user?.email ?? '—'} />
          <Detail label="Phone" value={user?.phone || 'Not added'} />
        </View>
      </Card>

      <SectionLabel>Activity</SectionLabel>
      <ListGroup>
        <ListItem
          icon={icon(Bell)}
          title="Notifications"
          subtitle={unread > 0 ? `${unread} unread` : 'Order, booking and health updates'}
          onPress={() => navigation.navigate('Notifications')}
        />
        <ListItem
          icon={icon(CalendarDays)}
          title="Room bookings"
          subtitle="Upcoming and past bookings"
          onPress={() => navigation.navigate('Bookings')}
        />
        <ListItem
          icon={icon(Pill)}
          title="Pharmacy & requests"
          subtitle="Pharmacy orders and nurse requests"
          onPress={() => navigation.navigate('HealthRequests')}
        />
        <ListItem
          icon={icon(ReceiptText)}
          title="Food orders"
          subtitle="Track current and past orders"
          onPress={() => navigation.navigate('Orders')}
          last
        />
      </ListGroup>

      <SectionLabel>Safety</SectionLabel>
      <ListGroup>
        <ListItem
          icon={icon(ShieldCheck)}
          title="Campus security"
          subtitle={`24/7 · ${campus.securityPhone}`}
          onPress={() => Linking.openURL(`tel:${campus.securityPhone.replace(/\s/g, '')}`)}
        />
        <ListItem
          icon={icon(Phone)}
          title="Medical centre"
          subtitle={campus.medicalCenterPhone}
          onPress={() => Linking.openURL(`tel:${campus.medicalCenterPhone.replace(/\s/g, '')}`)}
          last
        />
      </ListGroup>

      <View style={styles.signOut}>
        <ListGroup>
          <ListItem
            icon={<LogOut size={18} color={colors.critical} strokeWidth={1.75} />}
            title="Sign out"
            onPress={confirmLogout}
            trailing={<View />}
            last
          />
        </ListGroup>
      </View>
    </Screen>
  );
};

const Detail: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.detail}>
    <AppText variant="caption" tone="ink3">
      {label}
    </AppText>
    <AppText variant="callout" numberOfLines={1}>
      {value}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  idCard: { padding: spacing.xl },
  idTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 28, color: colors.canvas },
  idDetails: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.lineStrong,
    gap: spacing.md,
  },
  detail: { gap: 2 },
  signOut: { marginTop: spacing.xxxl },
});
