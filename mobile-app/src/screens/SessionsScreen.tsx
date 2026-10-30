import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Laptop, LogOut, Smartphone } from 'lucide-react-native';
import { authService, AuthSession } from '../services/auth.service';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen, SectionLabel } from '../components/Screen';
import { EmptyState } from '../components/Bits';
import { colors, spacing } from '../theme';
import { getErrorMessage } from '../lib/format';
import { useAuthStore } from '../store/authStore';

const sessionDate = (iso: string) => new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
const deviceName = (userAgent?: string) => {
  if (!userAgent) return 'Unknown device';
  if (/expo|react native|okhttp|android/i.test(userAgent)) return 'Mobile app';
  if (/iphone|ipad/i.test(userAgent)) return 'iPhone or iPad';
  if (/windows/i.test(userAgent)) return 'Windows browser';
  if (/macintosh/i.test(userAgent)) return 'Mac browser';
  return 'Web browser';
};

export const SessionsScreen: React.FC = () => {
  const logout = useAuthStore(state => state.logout);
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setSessions(await authService.getSessions());
    } catch (error) {
      Alert.alert('Could not load sessions', getErrorMessage(error));
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const revoke = (session: AuthSession) => {
    Alert.alert('Sign out this session?', `${deviceName(session.userAgent)} will lose access to your account.`, [
      { text: 'Keep session', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          setBusy(session.id);
          try {
            await authService.revokeSession(session.id);
            setSessions(prev => prev.filter(item => item.id !== session.id));
          } catch (error) {
            Alert.alert('Could not sign out session', getErrorMessage(error));
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  };

  const revokeAll = () => {
    Alert.alert('Sign out everywhere?', 'This signs out every device, including this one. You will return to the sign-in screen.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out everywhere',
        style: 'destructive',
        onPress: async () => {
          setBusy('all');
          try {
            await authService.logoutAll();
            await logout();
          } catch (error) {
            Alert.alert('Could not sign out everywhere', getErrorMessage(error));
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  };

  if (loaded && sessions.length === 0) {
    return <Screen><EmptyState icon={LogOut} title="No active sessions" description="Sign in again to create a new session." /></Screen>;
  }

  return (
    <Screen bottomSpace={48}>
      <AppText variant="callout" tone="ink3">These are the devices that currently have access to your Smart Campus account.</AppText>
      <SectionLabel>Active sessions</SectionLabel>
      <View style={styles.list}>
        {sessions.map(session => {
          const mobile = /expo|react native|okhttp|android|iphone|ipad/i.test(session.userAgent || '');
          return (
            <Card key={session.id}>
              <View style={styles.header}>
                <View style={styles.icon}>{mobile ? <Smartphone size={18} color={colors.ink} /> : <Laptop size={18} color={colors.ink} />}</View>
                <View style={styles.flex}>
                  <AppText variant="bodyMedium">{deviceName(session.userAgent)}</AppText>
                  <AppText variant="caption" tone="ink3">{session.ipAddress || 'IP unavailable'} · last active {sessionDate(session.lastUsedAt)}</AppText>
                </View>
              </View>
              <AppText variant="caption" tone="ink3" style={styles.created}>Signed in {sessionDate(session.createdAt)}</AppText>
              <Button title="Sign out this device" variant="secondary" onPress={() => revoke(session)} isLoading={busy === session.id} style={styles.revoke} />
            </Card>
          );
        })}
      </View>
      <Button title="Sign out everywhere" variant="danger" onPress={revokeAll} isLoading={busy === 'all'} style={styles.all} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.sunken, alignItems: 'center', justifyContent: 'center' },
  created: { marginTop: spacing.md },
  revoke: { marginTop: spacing.md },
  all: { marginTop: spacing.xl },
});
