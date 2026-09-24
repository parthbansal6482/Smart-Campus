import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DoorOpen, Search } from 'lucide-react-native';
import { ROOMS, RoomListing } from '../data/mock';
import { RootStackParamList } from '../types';
import { AppText } from '../components/AppText';
import { Card } from '../components/Card';
import { Chips } from '../components/Chips';
import { Field } from '../components/Field';
import { Screen } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/Bits';
import { colors, spacing } from '../theme';

type Availability = 'free' | 'all';
type Size = 'any' | '30' | '50';

export const floorLabel = (floor: number) => (floor === 0 ? 'Ground floor' : `Floor ${floor}`);

export const ClassroomsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [availability, setAvailability] = useState<Availability>('free');
  const [building, setBuilding] = useState('all');
  const [size, setSize] = useState<Size>('any');
  const [search, setSearch] = useState('');

  const buildingOptions = useMemo(() => {
    const codes = Array.from(new Set(ROOMS.map(r => r.building?.code).filter(Boolean))) as string[];
    return [{ value: 'all', label: 'All buildings' }, ...codes.map(code => ({ value: code, label: code }))];
  }, []);

  const rooms = ROOMS.filter(room => {
    if (availability === 'free' && room.isOccupied) return false;
    if (building !== 'all' && room.building?.code !== building) return false;
    if (size !== 'any' && room.capacity < Number(size)) return false;
    if (search) {
      const q = search.toLowerCase();
      return room.roomNumber.toLowerCase().includes(q) || room.building?.name.toLowerCase().includes(q);
    }
    return true;
  });

  const freeCount = ROOMS.filter(r => !r.isOccupied).length;

  return (
    <Screen topInset title="Rooms" subtitle={`${freeCount} of ${ROOMS.length} rooms are free right now`}>
      <Field
        value={search}
        onChangeText={setSearch}
        placeholder="Search room or building"
        leading={<Search size={18} color={colors.ink4} />}
        autoCorrect={false}
        returnKeyType="search"
      />

      <View style={styles.filters}>
        <Chips
          value={availability}
          onChange={setAvailability}
          options={[
            { value: 'free', label: 'Free now' },
            { value: 'all', label: 'All rooms' },
          ]}
        />
        <Chips value={building} onChange={setBuilding} options={buildingOptions} />
        <Chips
          value={size}
          onChange={setSize}
          options={[
            { value: 'any', label: 'Any size' },
            { value: '30', label: '30+ seats' },
            { value: '50', label: '50+ seats' },
          ]}
        />
      </View>

      {rooms.length === 0 ? (
        <EmptyState
          icon={DoorOpen}
          title="No rooms match"
          description="Try another building, a smaller size, or include rooms that are in use."
        />
      ) : (
        <View style={styles.list}>
          {rooms.map(room => (
            <RoomCard key={room.id} room={room} onPress={() => navigation.navigate('BookRoom', { room })} />
          ))}
        </View>
      )}
    </Screen>
  );
};

const RoomCard: React.FC<{ room: RoomListing; onPress: () => void }> = ({ room, onPress }) => {
  const features = [room.hasAC && 'Air conditioned', room.hasProjector && 'Projector'].filter(Boolean).join(' · ');

  return (
    <Card onPress={onPress} accessibilityLabel={`${room.roomNumber}, ${room.isOccupied ? 'in use' : 'free'}`}>
      <View style={styles.cardTop}>
        <View style={styles.flex}>
          <AppText variant="heading">{room.roomNumber}</AppText>
          <AppText variant="callout" tone="ink3" style={styles.meta}>
            {room.building?.name} · {floorLabel(room.floor)}
          </AppText>
        </View>
        <StatusBadge label={room.isOccupied ? 'In use' : 'Free'} tone={room.isOccupied ? 'warn' : 'ok'} />
      </View>

      <View style={styles.cardBottom}>
        <View style={styles.flex}>
          <AppText variant="label" tone="ink2">
            {room.availability}
          </AppText>
          <AppText variant="caption" tone="ink3" style={styles.meta}>
            {room.capacity} seats{features ? ` · ${features}` : ''}
          </AppText>
        </View>
        <AppText variant="label">{room.isOccupied ? 'Book later' : 'Book'}</AppText>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  filters: { gap: spacing.sm, marginBottom: spacing.xl },
  list: { gap: spacing.md },
  flex: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  meta: { marginTop: 2 },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.lineStrong,
  },
});
