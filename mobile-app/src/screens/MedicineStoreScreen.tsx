import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { Medicine } from '../types';
import { Search, Pill, ShoppingCart, Upload, ShieldCheck, CheckCircle2 } from 'lucide-react-native';

const MOCK_MEDICINES: Medicine[] = [
  {
    id: 'med-1',
    name: 'Paracetamol 500mg (10 Tablets)',
    category: 'PAIN_RELIEF',
    price: 2.5,
    description: 'Rapid-action antipyretic for headache, fever, and muscle soreness.',
    stock: 120,
    requiresPrescription: false,
  },
  {
    id: 'med-2',
    name: 'Campus Sterile First-Aid Kit',
    category: 'FIRST_AID',
    price: 4.99,
    description: 'Complete kit: sterile gauze, antiseptic swabs, medical tape, and bandages.',
    stock: 45,
    requiresPrescription: false,
  },
  {
    id: 'med-3',
    name: 'Amoxicillin Antibiotic 250mg',
    category: 'PRESCRIPTION_ONLY',
    price: 9.5,
    description: 'Broad-spectrum antibiotic. Valid campus doctor prescription mandatory.',
    stock: 18,
    requiresPrescription: true,
  },
  {
    id: 'med-4',
    name: 'Cetirizine Antihistamine 10mg',
    category: 'COLD_FEVER',
    price: 3.2,
    description: '24-hour relief from seasonal allergies, pollen sneezes, and hives.',
    stock: 85,
    requiresPrescription: false,
  },
  {
    id: 'med-5',
    name: 'Oral Rehydration Salts (ORS)',
    category: 'FIRST_AID',
    price: 1.5,
    description: 'Electrolyte balance formula for dehydration, sports fatigue, and weakness.',
    stock: 150,
    requiresPrescription: false,
  },
];

export const MedicineStoreScreen: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');

  const categories = ['ALL', 'PAIN_RELIEF', 'FIRST_AID', 'COLD_FEVER', 'PRESCRIPTION_ONLY'];

  const filteredMeds = MOCK_MEDICINES.filter(m => {
    const matchCat = selectedCat === 'ALL' || m.category === selectedCat;
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.description || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <View style={styles.container}>
      {/* Search & Category Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Search size={16} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search generic name, pain relief, bandages..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={item => item}
          renderItem={({ item }) => {
            const active = selectedCat === item;
            return (
              <TouchableOpacity
                style={[styles.catChip, active && styles.catChipActive]}
                onPress={() => setSelectedCat(item)}
                activeOpacity={0.7}
              >
                <Text style={[styles.catText, active && styles.catTextActive]}>
                  {item.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            );
          }}
          style={{ marginTop: 8 }}
        />
      </View>

      {/* Info Pill */}
      <View style={styles.infoBanner}>
        <ShieldCheck size={16} color="#047857" />
        <Text style={styles.infoText}>
          Campus Pharmacy verified • Free delivery to dorms & academic halls in 30 mins
        </Text>
      </View>

      <FlatList
        data={filteredMeds}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.medCard}>
            <View style={styles.itemHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <StatusBadge
                  label={item.category.replace('_', ' ')}
                  variant={item.category === 'PRESCRIPTION_ONLY' ? 'warning' : 'info'}
                />
                {item.requiresPrescription ? (
                  <StatusBadge label="Rx Mandatory" variant="danger" />
                ) : (
                  <View style={styles.otcBadge}>
                    <CheckCircle2 size={10} color="#047857" />
                    <Text style={styles.otcText}>OTC</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.stockText, item.stock < 25 && styles.stockLow]}>
                {item.stock < 25 ? `Only ${item.stock} left` : `${item.stock} in stock`}
              </Text>
            </View>

            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDesc}>{item.description}</Text>

            <View style={styles.actionRow}>
              <View>
                <Text style={styles.priceLabel}>Unit Price</Text>
                <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
              </View>

              {item.requiresPrescription ? (
                <Button
                  title="Upload Rx & Order"
                  variant="outline"
                  size="sm"
                  leftIcon={<Upload size={13} color="#2563eb" />}
                  onPress={() =>
                    Alert.alert(
                      'Prescription Upload',
                      'Please photograph your doctor slip. Our licensed pharmacist will verify within 15 minutes.'
                    )
                  }
                />
              ) : (
                <Button
                  title="Add to Pharmacy Order"
                  variant="primary"
                  size="sm"
                  leftIcon={<ShoppingCart size={13} color="#ffffff" />}
                  onPress={() => Alert.alert('Added', `${item.name} added to pharmacy cart.`)}
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
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.sizes.sm,
    color: '#0f172a',
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  catText: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: '#475569',
  },
  catTextActive: {
    color: '#ffffff',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: '#065f46',
    fontWeight: typography.weights.medium,
    lineHeight: 15,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 100,
  },
  medCard: {
    padding: spacing.md,
    borderRadius: 10,
    borderColor: '#e2e8f0',
    marginBottom: spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  otcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  otcText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#047857',
  },
  stockText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: typography.weights.medium,
    fontVariant: ['tabular-nums'],
  },
  stockLow: {
    color: '#dc2626',
    fontWeight: typography.weights.bold,
  },
  itemName: {
    fontSize: 15,
    fontWeight: typography.weights.bold,
    color: '#0f172a',
  },
  itemDesc: {
    fontSize: 12,
    color: '#475569',
    marginTop: 3,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  priceLabel: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: typography.weights.semibold,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: typography.weights.bold,
    color: '#0f172a',
    fontVariant: ['tabular-nums'],
  },
});
