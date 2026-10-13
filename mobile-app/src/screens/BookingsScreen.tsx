import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CalendarDays } from 'lucide-react-native';
import { Booking } from '../types';
import { classroomService } from '../services/classroom.service';
import { realtimeEvents, REALTIME_EVENTS } from '../services/realtimeEvents';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen, SectionLabel } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/Bits';
import { spacing, Tone } from '../theme';
import { formatTime, getErrorMessage } from '../lib/format';

const statusTone: Record<Booking['status'], Tone> = { PENDING: 'warn', CONFIRMED: 'ok', COMPLETED: 'neutral', CANCELLED: 'critical' };
const statusLabel: Record<Booking['status'], string> = { PENDING: 'Pending', CONFIRMED: 'Confirmed', COMPLETED: 'Completed', CANCELLED: 'Cancelled' };

const when = (b: Booking) => {
  const start = new Date(b.startTime);
  const sameDay = start.toDateString() === new Date().toDateString();
  const day = sameDay ? 'Today' : start.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
  return `${day}, ${formatTime(start)} – ${formatTime(new Date(b.endTime))}`;
};

export const BookingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    classroomService
      .getMyBookings()
      .then(setBookings)
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  // Bookings change when staff confirm or cancel them, or from another device.
  useEffect(() => {
    load();
    return realtimeEvents.on(REALTIME_EVENTS.bookingsChanged, load);
  }, [load]);

  const cancel = (booking: Booking) =>
    Alert.alert('Cancel this booking?', `${booking.room?.roomNumber ?? 'The room'} will be released for others.`, [
      { text: 'Keep booking', style: 'cancel' },
      {
        text: 'Cancel booking',
        style: 'destructive',
        onPress: async () => {
          setBusyId(booking.id);
          try {
            await classroomService.cancelBooking(booking.id);
            load();
          } catch (error) {
            Alert.alert('Could not cancel', getErrorMessage(error));
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);

  const now = Date.now();
  const isUpcoming = (b: Booking) => (b.status === 'CONFIRMED' || b.status === 'PENDING') && new Date(b.endTime).getTime() >= now;
  const upcoming = bookings.filter(isUpcoming).sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime));
  const past = bookings.filter(b => !isUpcoming(b)).sort((a, b) => +new Date(b.startTime) - +new Date(a.startTime));

  if (loaded && bookings.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon={CalendarDays}
          title="No bookings yet"
          description="Find a free room and reserve it for a study group or meeting."
          action={<Button title="Find a room" variant="secondary" onPress={() => navigation.navigate('Main', { screen: 'ClassroomsTab' })} />}
        />
      </Screen>
    );
  }

  const renderCard = (booking: Booking, canCancel: boolean) => (
    <Card key={booking.id}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <AppText variant="heading">{booking.room?.roomNumber ?? 'Room'}</AppText>
          <AppText variant="caption" tone="ink3">
            {booking.room?.building?.name}
          </AppText>
        </View>
        <StatusBadge label={statusLabel[booking.status]} tone={statusTone[booking.status]} />
      </View>
      <AppText variant="callout" tone="ink2" style={styles.when}>
        {when(booking)}
      </AppText>
      {!!booking.purpose && (
        <AppText variant="caption" tone="ink3" style={styles.purpose}>
          “{booking.purpose}”
        </AppText>
      )}
      {canCancel && (
        <Button title="Cancel booking" variant="secondary" onPress={() => cancel(booking)} isLoading={busyId === booking.id} style={styles.cancel} />
      )}
    </Card>
  );

  return (
    <Screen bottomSpace={48}>
      {upcoming.length > 0 && (
        <>
          <SectionLabel>Upcoming</SectionLabel>
          <View style={styles.list}>{upcoming.map(b => renderCard(b, true))}</View>
        </>
      )}
      {past.length > 0 && (
        <>
          <SectionLabel>Past</SectionLabel>
          <View style={styles.list}>{past.map(b => renderCard(b, false))}</View>
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  when: { marginTop: spacing.md },
  purpose: { marginTop: spacing.xs },
  cancel: { marginTop: spacing.md },
});
