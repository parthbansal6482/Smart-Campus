import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Bell } from 'lucide-react-native';
import { AppNotification } from '../types';
import { notificationService } from '../services/notification.service';
import { realtimeEvents, REALTIME_EVENTS } from '../services/realtimeEvents';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { EmptyState } from '../components/Bits';
import { colors, spacing } from '../theme';

const timeAgo = (iso: string) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short' });
};

/** Where tapping a notification should take you. */
const destination = (n: AppNotification): { screen: string; params?: object } | null => {
  switch (n.type) {
    case 'ORDER':
      return { screen: 'Orders' };
    case 'MEDICINE_ORDER':
    case 'CONSULTATION':
      return { screen: 'HealthRequests' };
    case 'BOOKING':
      return { screen: 'Bookings' };
    default:
      return null;
  }
};

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(() => {
    notificationService
      .list()
      .then(r => {
        setItems(r.notifications);
        setUnread(r.unreadCount);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  // New notifications and "read" changes made on another device arrive live.
  useEffect(() => {
    load();
    return realtimeEvents.on(REALTIME_EVENTS.notificationsChanged, load);
  }, [load]);

  const open = async (n: AppNotification) => {
    if (!n.read) {
      await notificationService.markRead(n.id).catch(() => undefined);
      load();
    }
    const to = destination(n);
    if (to) navigation.navigate(to.screen, to.params);
  };

  const markAll = async () => {
    await notificationService.markAllRead().catch(() => undefined);
    load();
  };

  if (loaded && items.length === 0) {
    return (
      <Screen>
        <EmptyState icon={Bell} title="You’re all caught up" description="Order updates, booking changes and alerts will appear here." />
      </Screen>
    );
  }

  return (
    <Screen bottomSpace={48}>
      {unread > 0 && <Button title={`Mark all ${unread} as read`} variant="secondary" onPress={markAll} style={styles.markAll} />}
      <View style={styles.list}>
        {items.map(n => (
          <Pressable key={n.id} onPress={() => open(n)} accessibilityRole="button" accessibilityLabel={`${n.title}. ${n.body}`}>
            <Card>
              <View style={styles.row}>
                {!n.read && <View style={styles.dot} />}
                <View style={styles.flex}>
                  <AppText variant={n.read ? 'body' : 'bodyMedium'}>{n.title}</AppText>
                  <AppText variant="callout" tone="ink2" style={styles.body}>
                    {n.body}
                  </AppText>
                  <AppText variant="caption" tone="ink3" style={styles.time}>
                    {timeAgo(n.createdAt)}
                  </AppText>
                </View>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { gap: spacing.md },
  markAll: { marginBottom: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.critical, marginTop: 7 },
  body: { marginTop: 2 },
  time: { marginTop: spacing.xs },
});
