import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { Room } from '../types';
import { Users, Wind, Tv, Calendar, Search, MapPin } from 'lucide-react-native';
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
    building: { name: 'Marie Curie Science Complex', code: 'SCI', id: 'b2', latitude: 0, longitude: 0, floorCount: 3 },
  },
  {
    id: 'r4',
    buildingId: 'b2',
    roomNumber: 'SCI-302',
    floor: 3,
    capacity: 45,
    hasAC: true,
    hasProjector: true,
    isOccupied: false,
    building: { name: 'Marie Curie Science Complex', code: 'SCI', id: 'b2', latitude: 0, longitude: 0, floorCount: 3 },
  },
];

export const ClassroomsScreen: React.FC = () => {
  const [filterOccupied, setFilterOccupied] = useState<boolean | null>(null);
  const [search, setSearch] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('ALL');

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const filteredRooms = MOCK_ROOMS.filter(r => {
    const matchOccupied = filterOccupied === null ? true : filterOccupied ? r.isOccupied : !r.isOccupied;
    const matchBuilding = selectedBuilding === 'ALL' || r.building?.code === selectedBuilding;
    const matchSearch = r.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
      (r.building?.name || '').toLowerCase().includes(search.toLowerCase());
    return matchOccupied && matchBuilding && matchSearch;
  });

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={16} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search room (e.g. ENG-101, Lab A)..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#94a3b8"
        />
      </View>

      {/* Filter Chips Bar */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.chip, filterOccupied === null && styles.chipActive]}
          onPress={() => setFilterOccupied(null)}
        >
          <Text style={[styles.chipText, filterOccupied === null && styles.chipTextActive]}>
            All ({MOCK_ROOMS.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, filterOccupied === false && styles.chipActive]}
          onPress={() => setFilterOccupied(false)}
        >
          <Text style={[styles.chipText, filterOccupied === false && styles.chipTextActive]}>
            Vacant Now
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
        <TouchableOpacity
          style={[styles.chip, selectedBuilding === 'ENG' && styles.chipActive]}
          onPress={() => setSelectedBuilding(selectedBuilding === 'ENG' ? 'ALL' : 'ENG')}
        >
          <Text style={[styles.chipText, selectedBuilding === 'ENG' && styles.chipTextActive]}>
            ENG Hall
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, selectedBuilding === 'SCI' && styles.chipActive]}
          onPress={() => setSelectedBuilding(selectedBuilding === 'SCI' ? 'ALL' : 'SCI')}
        >
          <Text style={[styles.chipText, selectedBuilding === 'SCI' && styles.chipTextActive]}>
            Science
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredRooms}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
                dot
              />
            </View>

            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Users size={14} color="#64748b" />
                <Text style={styles.detailText}>{item.capacity} seats</Text>
              </View>
              <View style={styles.detailItem}>
                <MapPin size={14} color="#64748b" />
                <Text style={styles.detailText}>Floor {item.floor}</Text>
              </View>
              {item.hasAC && (
                <View style={[styles.detailItem, styles.acItem]}>
                  <Wind size={14} color="#2563eb" />
                  <Text style={[styles.detailText, { color: '#1d4ed8' }]}>HVAC 70°F</Text>
                </View>
              )}
              {item.hasProjector && (
                <View style={[styles.detailItem, styles.avItem]}>
                  <Tv size={14} color="#7c3aed" />
                  <Text style={[styles.detailText, { color: '#6d28d9' }]}>AV Projector</Text>
                </View>
              )}
            </View>

            <View style={styles.actionRow}>
              <Button
                title={item.isOccupied ? 'Check Schedule' : 'Reserve Room'}
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
    backgroundColor: '#f8fafc',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    padding: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    overflow: 'scroll',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  chipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 110,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  buildingName: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  roomTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  acItem: {
    backgroundColor: '#eff6ff',
  },
  avItem: {
    backgroundColor: '#faf5ff',
  },
  detailText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  actionRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
