import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { ROOMS } from '../data/mock';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Chips, Segmented } from '../components/Chips';
import { Field } from '../components/Field';
import { Screen, SectionLabel, StickyFooter } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { floorLabel } from './ClassroomsScreen';
import { colors, spacing } from '../theme';
import { formatTime } from '../lib/format';

const SLOTS = [9, 10, 11, 12, 13, 14, 15, 16, 17];

const dayOptions = () =>
  Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString([], { weekday: 'short', day: 'numeric' });
    return { value: String(i), label };
  });

const slotLabel = (hour: number) => formatTime(new Date(2000, 0, 1, hour));

export const BookRoomScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'BookRoom'>>();
  const room = route.params?.room ?? ROOMS[0];

  const days = useMemo(dayOptions, []);
  const currentHour = new Date().getHours();
  const [day, setDay] = useState('0');
  const [start, setStart] = useState(() => String(SLOTS.find(h => h > currentHour) ?? SLOTS[0]));
  const [duration, setDuration] = useState<'1' | '2' | '3'>('1');
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const slotOptions = SLOTS.filter(h => day !== '0' || h > currentHour).map(h => ({
    value: String(h),
    label: slotLabel(h),
  }));
  // If the chosen slot is no longer offered (e.g. switched back to today), fall back to the first open slot.
  const effectiveStart = slotOptions.some(o => o.value === start) ? start : slotOptions[0]?.value ?? start;
  const startHour = Number(effectiveStart);
  const endHour = startHour + Number(duration);
  const dayLabel = days.find(d => d.value === day)?.label;
  const summary = `${dayLabel}, ${slotLabel(startHour)} – ${slotLabel(endHour)}`;

  const handleBook = () => {
    if (!purpose.trim()) {
      Alert.alert('Add a purpose', 'A short note like “Group study” helps others know why the room is taken.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      Alert.alert('Room booked', `${room.roomNumber} is yours ${summary.toLowerCase()}.`, [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    }, 600);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen bottomSpace={32}>
        <Card>
          <View style={styles.roomRow}>
            <View style={styles.grow}>
              <AppText variant="title">{room.roomNumber}</AppText>
              <AppText variant="callout" tone="ink3" style={styles.meta}>
                {room.building?.name} · {floorLabel(room.floor)} · {room.capacity} seats
              </AppText>
            </View>
            <StatusBadge label={room.isOccupied ? 'In use now' : 'Free now'} tone={room.isOccupied ? 'warn' : 'ok'} />
          </View>
        </Card>

        <SectionLabel>Day</SectionLabel>
        <Chips value={day} onChange={setDay} options={days} />

        <SectionLabel>Start time</SectionLabel>
        {slotOptions.length > 0 ? (
          <Chips value={effectiveStart} onChange={setStart} options={slotOptions} />
        ) : (
          <AppText variant="callout" tone="ink3">
            No more slots today — pick another day.
          </AppText>
        )}

        <SectionLabel>Duration</SectionLabel>
        <Segmented
          value={duration}
          onChange={setDuration}
          options={[
            { value: '1', label: '1 hour' },
            { value: '2', label: '2 hours' },
            { value: '3', label: '3 hours' },
          ]}
        />

        <SectionLabel>Purpose</SectionLabel>
        <Field value={purpose} onChangeText={setPurpose} placeholder="e.g. Group study, project review" />
      </Screen>

      <StickyFooter>
        <View style={styles.summary}>
          <AppText variant="caption" tone="ink3">
            Booking
          </AppText>
          <AppText variant="bodyMedium">{summary}</AppText>
        </View>
        <Button title="Book room" onPress={handleBook} isLoading={submitting} disabled={slotOptions.length === 0} />
      </StickyFooter>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.canvas },
  grow: { flex: 1 },
  roomRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  meta: { marginTop: 4 },
  summary: { marginBottom: spacing.md },
});
