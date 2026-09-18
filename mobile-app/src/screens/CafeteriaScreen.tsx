import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { MenuItem } from '../types';
import { Search, ShoppingBag, Flame, Star, Sparkles, Filter } from 'lucide-react-native';
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
    isVeg: true,
    spiceLevel: 0,
    rating: 4.8,
    isAvailable: true,
  },
  {
    id: 'm2',
    name: 'Avocado & Grilled Chicken Panini',
    description: 'Fresh sourdough with smoked gouda, pesto, and chicken.',
    price: 8.95,
    category: 'LUNCH',
    isVeg: false,
    spiceLevel: 1,
    rating: 4.7,
    isAvailable: true,
  },
  {
    id: 'm3',
    name: 'Butter Croissant',
    description: 'Flaky and golden French-style butter pastry baked daily.',
    price: 3.25,
    category: 'BREAKFAST',
    isVeg: true,
    spiceLevel: 0,
    rating: 4.9,
    isAvailable: true,
  },
  {
    id: 'm4',
    name: 'Fudge Walnut Brownie',
    description: 'Rich dark chocolate baked brownie topped with walnuts.',
    price: 3.5,
    category: 'DESSERTS',
    isVeg: true,
    spiceLevel: 0,
    rating: 4.9,
    isAvailable: true,
  },
];

export const CafeteriaScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [vegOnlyFilter, setVegOnlyFilter] = useState(false);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const categories = ['ALL', 'BREAKFAST', 'LUNCH', 'SNACKS', 'BEVERAGES', 'DESSERTS'];

  const filteredItems = MOCK_MENU.filter(item => {
    const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchVeg = !vegOnlyFilter || item.isVeg;
    return matchCat && matchSearch && matchVeg;
  });

  return (
    <View style={styles.container}>
      {/* Search & Filter Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search food, coffee, desserts..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.filterRow}>
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
                <Text style={[styles.catText, selectedCategory === item && styles.catTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity
            style={[styles.vegToggle, vegOnlyFilter && styles.vegToggleActive]}
            onPress={() => setVegOnlyFilter(!vegOnlyFilter)}
          >
            <Text style={[styles.vegToggleText, vegOnlyFilter && styles.vegToggleTextActive]}>
              🌱 Veg
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Daily Banner Offer */}
      <TouchableOpacity
        style={styles.offerBanner}
        onPress={() => navigation.navigate('Cart')}
        activeOpacity={0.85}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Sparkles size={14} color={colors.pastelAmberDark} />
            <Text style={styles.offerCode}>CAMPUS15 • 15% OFF</Text>
          </View>
          <Text style={styles.offerTitle}>Chef Special Combo Special Offer</Text>
        </View>
        <ShoppingBag size={20} color={colors.pastelAmberDark} />
      </TouchableOpacity>

      {/* Menu List */}
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.itemHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <StatusBadge label={item.isVeg ? 'VEG' : 'NON-VEG'} variant={item.isVeg ? 'success' : 'danger'} />
                <View style={styles.ratingBadge}>
                  <Star size={12} color="#f59e0b" fill="#f59e0b" />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
              </View>
              <Text style={styles.categoryBadge}>{item.category}</Text>
            </View>

            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDesc}>{item.description}</Text>

            <View style={styles.itemFooter}>
              <Text style={styles.itemPrice}>\${item.price.toFixed(2)}</Text>
              <Button
                title="Customize & Add"
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
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  vegToggle: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: spacing.borderRadius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: spacing.xs,
  },
  vegToggleActive: {
    backgroundColor: colors.pastelMint,
    borderColor: colors.pastelMintDark,
  },
  vegToggleText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
  },
  vegToggleTextActive: {
    color: colors.pastelMintDark,
  },
  offerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.pastelAmber,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: spacing.borderRadius.md,
  },
  offerCode: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.pastelAmberDark,
  },
  offerTitle: {
    fontSize: typography.sizes.xs,
    color: colors.pastelAmberDark,
    marginTop: 2,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  categoryBadge: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
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
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  itemPrice: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
});
