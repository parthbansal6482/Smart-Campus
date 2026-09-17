import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { MenuItem } from '../types';
import { ShoppingBag, Coffee, Utensils } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

const MOCK_MENU: MenuItem[] = [
  {
    id: 'm1',
    name: 'Cold Brew Artisan Coffee',
    description: 'Slow-steeped organic coffee with a splash of oat milk.',
    price: 4.5,
    category: 'BEVERAGES',
    isAvailable: true,
  },
  {
    id: 'm2',
    name: 'Avocado & Grilled Chicken Panini',
    description: 'Fresh sourdough with smoked gouda, pesto, and avocado.',
    price: 8.95,
    category: 'LUNCH',
    isAvailable: true,
  },
  {
    id: 'm3',
    name: 'Butter Croissant',
    description: 'Flaky and golden French-style butter pastry baked daily.',
    price: 3.25,
    category: 'BREAKFAST',
    isAvailable: true,
  },
];

export const CafeteriaScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const categories = ['ALL', 'BREAKFAST', 'LUNCH', 'SNACKS', 'BEVERAGES'];

  const filteredItems = MOCK_MENU.filter(item => {
    if (selectedCategory === 'ALL') return true;
    return item.category === selectedCategory;
  });

  return (
    <View style={styles.container}>
      {/* Category Horizontal Filter */}
      <View style={styles.categoryRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.catChip, selectedCategory === item && styles.catChipActive]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text
                style={[styles.catText, selectedCategory === item && styles.catTextActive]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Menu List */}
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <StatusBadge label={item.category} variant="info" />
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDesc}>{item.description}</Text>
                <Text style={styles.itemPrice}>\${item.price.toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.actionRow}>
              <Button
                title="Order / Customize"
                size="sm"
                onPress={() => navigation.navigate('MenuDetail', { item })}
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
  categoryRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  catChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.borderRadius.full,
    backgroundColor: colors.background,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipActive: {
    backgroundColor: colors.pastelAmber,
    borderColor: colors.pastelAmberDark,
  },
  catText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  catTextActive: {
    color: colors.pastelAmberDark,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  itemRow: {
    flexDirection: 'row',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
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
