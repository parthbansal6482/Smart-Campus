import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { Room } from '../types';
import { Users, Wind, Tv, Calendar } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

const MOCK_ROOMS: Room[] = [
  {
    id: 'r1',
    buildingId: 'b1',
    roomNumber: 'ENG-101',
    floor: 1,
    capacity: 60,
    hasAC: true,
    hasProjector: true,
    isOccupied: false,
    building: { name: 'Engineering Hall', code: 'ENG', id: 'b1', latitude: 0, longitude: 0, floorCount: 4 },
  },
  {
    id: 'r2',
    buildingId: 'b1',
    roomNumber: 'ENG-204',
    floor: 2,
    capacity: 35,
    hasAC: true,
    hasProjector: true,
    isOccupied: true,
    building: { name: 'Engineering Hall', code: 'ENG', id: 'b1', latitude: 0, longitude: 0, floorCount: 4 },
  },
  {
    id: 'r3',
    buildingId: 'b2',
    roomNumber: 'SCI-LabA',
    floor: 1,
    capacity: 25,
    hasAC: true,
    hasProjector: false,
    isOccupied: false,
    building: { name: 'Science Complex', code: 'SCI', id: 'b2', latitude: 0, longitude: 0, floorCount: 3 },
  },
];

export const ClassroomsScreen: React.FC = () => {
  const [filterOccupied, setFilterOccupied] = useState<boolean | null>(null);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const filteredRooms = MOCK_ROOMS.filter(r => {
    if (filterOccupied === null) return true;
    return filterOccupied ? r.isOccupied : !r.isOccupied;
  });

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.chip, filterOccupied === null && styles.chipActive]}
          onPress={() => setFilterOccupied(null)}
        >
          <Text style={[styles.chipText, filterOccupied === null && styles.chipTextActive]}>
            All Rooms
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, filterOccupied === false && styles.chipActive]}
          onPress={() => setFilterOccupied(false)}
        >
          <Text style={[styles.chipText, filterOccupied === false && styles.chipTextActive]}>
            Available Now
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, filterOccupied === true && styles.chipActive]}
          onPress={() => setFilterOccupied(true)}
        >
          <Text style={[styles.chipText, filterOccupied === true && styles.chipTextActive]}>
            In Use
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredRooms}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.roomHeader}>
              <View>
                <Text style={styles.buildingName}>{item.building?.name}</Text>
                <Text style={styles.roomTitle}>{item.roomNumber}</Text>
              </View>
              <StatusBadge
                label={item.isOccupied ? 'Occupied' : 'Vacant'}
                variant={item.isOccupied ? 'warning' : 'success'}
              />
            </View>

            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Users size={16} color={colors.textSecondary} />
                <Text style={styles.detailText}>{item.capacity} seats</Text>
              </View>
              {item.hasAC && (
                <View style={styles.detailItem}>
                  <Wind size={16} color={colors.primary} />
                  <Text style={styles.detailText}>AC</Text>
                </View>
              )}
              {item.hasProjector && (
                <View style={styles.detailItem}>
                  <Tv size={16} color={colors.pastelPurpleDark} />
                  <Text style={styles.detailText}>Projector</Text>
                </View>
              )}
            </View>

            <View style={styles.actionRow}>
              <Button
                title={item.isOccupied ? 'View Schedule' : 'Book Classroom'}
                variant={item.isOccupied ? 'secondary' : 'primary'}
                size="sm"
                onPress={() => navigation.navigate('BookRoom', { room: item })}
              />
            </View>
          </Card>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  buildingName: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },
  roomTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  actionRow: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
  },
});
