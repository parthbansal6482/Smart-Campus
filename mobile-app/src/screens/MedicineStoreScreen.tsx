import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { Medicine } from '../types';
import { Search, Pill, ShoppingCart, Upload } from 'lucide-react-native';

const MOCK_MEDICINES: Medicine[] = [
  {
    id: 'med-1',
    name: 'Paracetamol 500mg (10 Tabs)',
    category: 'PAIN_RELIEF',
    price: 2.5,
    description: 'Relieves fever and mild to moderate body pain.',
    stock: 120,
    requiresPrescription: false,
  },
  {
    id: 'med-2',
    name: 'Sterile First Aid Kit',
    category: 'FIRST_AID',
    price: 4.99,
    description: 'Emergency wound cleaning and waterproof bandaging kit.',
    stock: 45,
    requiresPrescription: false,
  },
  {
    id: 'med-3',
    name: 'Amoxicillin Antibiotic 250mg',
    category: 'PRESCRIPTION_ONLY',
    price: 9.5,
    description: 'Prescription required. Doctor note upload mandatory.',
    stock: 20,
    requiresPrescription: true,
  },
];

export const MedicineStoreScreen: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');

  const categories = ['ALL', 'PAIN_RELIEF', 'FIRST_AID', 'PRESCRIPTION_ONLY'];

  const filteredMeds = MOCK_MEDICINES.filter(m => {
    const matchCat = selectedCat === 'ALL' || m.category === selectedCat;
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <View style={styles.container}>
      {/* Search & Category Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search pharmacy medicines..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.catChip, selectedCat === item && styles.catChipActive]}
              onPress={() => setSelectedCat(item)}
            >
              <Text style={[styles.catText, selectedCat === item && styles.catTextActive]}>
                {item.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          )}
          style={{ marginTop: spacing.sm }}
        />
      </View>

      <FlatList
        data={filteredMeds}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
                  <StatusBadge label={item.category.replace('_', ' ')} variant="info" />
                  {item.requiresPrescription && <StatusBadge label="Rx Required" variant="danger" />}
                </View>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDesc}>{item.description}</Text>
                <Text style={styles.itemPrice}>\${item.price.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              {item.requiresPrescription ? (
                <Button
                  title="Upload Rx & Order"
                  variant="outline"
                  size="sm"
                  leftIcon={<Upload size={14} color={colors.primary} />}
                  onPress={() => Alert.alert('Prescription Upload', 'Select prescription image from gallery to attach.')}
                />
              ) : (
                <Button
                  title="Add to Pharmacy Cart"
                  variant="primary"
                  size="sm"
                  leftIcon={<ShoppingCart size={14} color="#ffffff" />}
                  onPress={() => Alert.alert('Added to Cart', `${item.name} added to pharmacy order.`)}
                />
              )}
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
  header: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  catChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: spacing.borderRadius.full,
    backgroundColor: colors.background,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  catTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: spacing.lg,
  },
  itemRow: {
    flexDirection: 'row',
  },
  itemName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  itemDesc: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  actionRow: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
