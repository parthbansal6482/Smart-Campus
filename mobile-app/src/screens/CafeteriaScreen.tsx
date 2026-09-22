import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { MenuItem } from '../types';
import { Search, ShoppingBag, Flame, Star, Sparkles, Plus, Clock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

const MOCK_MENU: MenuItem[] = [
  {
    id: 'm1',
    name: 'Cold Brew Artisan Coffee',
    description: 'Slow-steeped organic single-origin coffee with a splash of oat milk.',
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
    description: 'Fresh sourdough with smoked gouda, herb pesto, and chargrilled chicken.',
    price: 8.95,
    category: 'LUNCH',
    isVeg: false,
    spiceLevel: 1,
    rating: 4.7,
    isAvailable: true,
  },
  {
    id: 'm3',
    name: 'Artisan Butter Croissant',
    description: 'Flaky and golden French-style butter pastry baked daily at 6 AM.',
    price: 3.25,
    category: 'BREAKFAST',
    isVeg: true,
    spiceLevel: 0,
    rating: 4.9,
    isAvailable: true,
  },
  {
    id: 'm4',
    name: 'Fudge Walnut Dark Brownie',
    description: 'Rich dark 70% cocoa baked brownie topped with roasted walnuts.',
    price: 3.5,
    category: 'DESSERTS',
    isVeg: true,
    spiceLevel: 0,
    rating: 4.9,
    isAvailable: true,
  },
  {
    id: 'm5',
    name: 'Spicy Chipotle Paneer Wrap',
    description: 'Whole wheat flatbread rolled with grilled paneer, peppers, and chipotle mayo.',
    price: 7.5,
    category: 'LUNCH',
    isVeg: true,
    spiceLevel: 2,
    rating: 4.6,
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
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(search.toLowerCase());
    const matchVeg = !vegOnlyFilter || item.isVeg;
    return matchCat && matchSearch && matchVeg;
  });

  return (
    <View style={styles.container}>
      {/* Search & Category Filter Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Search size={16} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search food, artisan brew, snacks..."
            placeholderTextColor={colors.textMuted}
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
            renderItem={({ item }) => {
              const active = selectedCategory === item;
              return (
                <TouchableOpacity
                  style={[styles.catChip, active && styles.catChipActive]}
                  onPress={() => setSelectedCategory(item)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.catText, active && styles.catTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          <TouchableOpacity
            style={[styles.vegToggle, vegOnlyFilter && styles.vegToggleActive]}
            onPress={() => setVegOnlyFilter(!vegOnlyFilter)}
            activeOpacity={0.7}
          >
            <View style={[styles.vegDot, vegOnlyFilter && styles.vegDotActive]} />
            <Text style={[styles.vegToggleText, vegOnlyFilter && styles.vegToggleTextActive]}>
              Veg Only
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Daily Banner Offer & Tray Access */}
      <View style={styles.bannerRow}>
        <TouchableOpacity
          style={styles.offerBanner}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.85}
        >
          <View style={{ flex: 1 }}>
            <View style={styles.offerBadge}>
              <Sparkles size={12} color="#92400e" />
              <Text style={styles.offerCode}>CAMPUS15 • 15% STUDENT DISCOUNT</Text>
            </View>
            <Text style={styles.offerTitle}>Chef Special Lunch Combo</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Clock size={12} color="#78350f" />
              <Text style={styles.offerTime}>Ready in ~10 mins at Counter B</Text>
            </View>
          </View>
          <View style={styles.trayButton}>
            <ShoppingBag size={18} color="#ffffff" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Menu Item Counter */}
      <View style={styles.metaRow}>
        <Text style={styles.metaTitle}>
          {selectedCategory === 'ALL' ? 'Full Menu' : selectedCategory} ({filteredItems.length} items)
        </Text>
        <Text style={styles.metaLive}>Kitchen Open • 8:00 AM - 9:00 PM</Text>
      </View>

      {/* Menu List */}
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.menuCard}>
            <View style={styles.itemHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <StatusBadge
                  label={item.isVeg ? 'VEG' : 'NON-VEG'}
                  variant={item.isVeg ? 'success' : 'danger'}
                />
                <View style={styles.ratingBadge}>
                  <Star size={11} color="#f59e0b" fill="#f59e0b" />
                  <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                </View>
                {item.spiceLevel > 0 && (
                  <View style={styles.spiceBadge}>
                    <Flame size={11} color="#ea580c" />
                    <Text style={styles.spiceText}>{item.spiceLevel === 1 ? 'Mild' : 'Spicy'}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.categoryBadge}>{item.category}</Text>
            </View>

            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>

            <View style={styles.itemFooter}>
              <View>
                <Text style={styles.priceLabel}>Price</Text>
                <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
              </View>
              <Button
                title="Add to Tray"
                size="sm"
                leftIcon={<Plus size={14} color="#ffffff" />}
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
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.sizes.sm,
    color: '#0f172a',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
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
  vegToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginLeft: 4,
  },
  vegToggleActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#94a3b8',
  },
  vegDotActive: {
    backgroundColor: '#10b981',
  },
  vegToggleText: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: '#475569',
  },
  vegToggleTextActive: {
    color: '#047857',
  },
  bannerRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  offerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: spacing.md,
    borderRadius: 10,
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  offerCode: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#92400e',
    letterSpacing: 0.5,
  },
  offerTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: '#78350f',
    marginTop: 2,
  },
  offerTime: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: typography.weights.medium,
  },
  trayButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  metaTitle: {
    fontSize: 12,
    fontWeight: typography.weights.bold,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaLive: {
    fontSize: 11,
    color: '#64748b',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  menuCard: {
    padding: spacing.md,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    marginBottom: spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: '#92400e',
  },
  spiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  spiceText: {
    fontSize: 11,
    fontWeight: typography.weights.semibold,
    color: '#c2410c',
  },
  categoryBadge: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: typography.weights.bold,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
    lineHeight: 17,
  },
  itemFooter: {
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
