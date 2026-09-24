import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowRight, ReceiptText, Soup } from 'lucide-react-native';
import { MENU, CAMPUS } from '../data/mock';
import { MenuCategory, MenuItem, RootStackParamList } from '../types';
import { useCartStore, cartCount, cartTotal } from '../store/cartStore';
import { AppText } from '../components/AppText';
import { Chips } from '../components/Chips';
import { Screen } from '../components/Screen';
import { EmptyState, Stepper, VegMark } from '../components/Bits';
import { colors, radius, spacing } from '../theme';
import { formatCurrency, humanize } from '../lib/format';

type CategoryFilter = 'ALL' | MenuCategory;

const CATEGORIES: CategoryFilter[] = ['ALL', 'BREAKFAST', 'LUNCH', 'SNACKS', 'BEVERAGES', 'DESSERTS'];

export const CafeteriaScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { lines, add, setQuantity } = useCartStore();
  const [category, setCategory] = useState<CategoryFilter>('ALL');
  const [vegOnly, setVegOnly] = useState<'all' | 'veg'>('all');

  const items = MENU.filter(item => {
    if (category !== 'ALL' && item.category !== category) return false;
    if (vegOnly === 'veg' && !item.isVeg) return false;
    return true;
  }).sort((a, b) => Number(b.isAvailable) - Number(a.isAvailable));

  const count = cartCount(lines);
  const quantityOf = (id: string) => lines.find(l => l.item.id === id)?.quantity ?? 0;

  return (
    <View style={styles.flex}>
      <Screen
        topInset
        title="Cafeteria"
        subtitle={`Kitchen open ${CAMPUS.kitchenHours}`}
        bottomSpace={count > 0 ? 180 : 120}
        headerRight={
          <Pressable
            onPress={() => navigation.navigate('Orders')}
            accessibilityRole="button"
            accessibilityLabel="Your orders"
            style={styles.ordersButton}
          >
            <ReceiptText size={20} color={colors.ink} strokeWidth={1.75} />
          </Pressable>
        }
      >
        <View style={styles.filters}>
          <Chips
            value={category}
            onChange={setCategory}
            options={CATEGORIES.map(c => ({ value: c, label: c === 'ALL' ? 'Everything' : humanize(c) }))}
          />
          <Chips
            value={vegOnly}
            onChange={setVegOnly}
            scroll={false}
            options={[
              { value: 'all', label: 'Veg & non-veg' },
              { value: 'veg', label: 'Veg only' },
            ]}
          />
        </View>

        {items.length === 0 ? (
          <EmptyState icon={Soup} title="Nothing here right now" description="Try another category." />
        ) : (
          <View style={styles.menu}>
            {items.map((item, index) => (
              <MenuRow
                key={item.id}
                item={item}
                last={index === items.length - 1}
                quantity={quantityOf(item.id)}
                onOpen={() => navigation.navigate('MenuDetail', { item })}
                onAdd={() => add(item)}
                onChangeQuantity={q => setQuantity(item.id, q)}
              />
            ))}
          </View>
        )}
      </Screen>

      {count > 0 && (
        <Pressable
          onPress={() => navigation.navigate('Cart')}
          accessibilityRole="button"
          accessibilityLabel={`View order, ${count} items`}
          style={({ pressed }) => [styles.cartBar, pressed && { backgroundColor: '#33312D' }]}
        >
          <View>
            <AppText variant="label" tone="onInk">
              {count} {count === 1 ? 'item' : 'items'} · {formatCurrency(cartTotal(lines))}
            </AppText>
            <AppText variant="caption" style={styles.cartHint}>
              Review and place order
            </AppText>
          </View>
          <ArrowRight size={20} color={colors.onInk} />
        </Pressable>
      )}
    </View>
  );
};

interface MenuRowProps {
  item: MenuItem;
  quantity: number;
  last: boolean;
  onOpen: () => void;
  onAdd: () => void;
  onChangeQuantity: (quantity: number) => void;
}

const MenuRow: React.FC<MenuRowProps> = ({ item, quantity, last, onOpen, onAdd, onChangeQuantity }) => (
  <Pressable
    onPress={onOpen}
    disabled={!item.isAvailable}
    accessibilityRole="button"
    accessibilityLabel={`${item.name}, ${formatCurrency(item.price)}${item.isAvailable ? '' : ', sold out'}`}
    style={({ pressed }) => [styles.row, !last && styles.rowDivider, pressed && styles.rowPressed]}
  >
    <View style={[styles.rowText, !item.isAvailable && styles.soldOut]}>
      <View style={styles.nameRow}>
        <VegMark isVeg={item.isVeg} />
        <AppText variant="subheading" style={styles.name}>
          {item.name}
        </AppText>
      </View>
      {item.description && (
        <AppText variant="caption" tone="ink3" numberOfLines={2} style={styles.description}>
          {item.description}
        </AppText>
      )}
      <AppText variant="bodyMedium" style={styles.price}>
        {formatCurrency(item.price)}
      </AppText>
    </View>

    <View style={styles.rowAction}>
      {!item.isAvailable ? (
        <AppText variant="label" tone="ink3">
          Sold out
        </AppText>
      ) : quantity > 0 ? (
        <Stepper compact value={quantity} onChange={onChangeQuantity} />
      ) : (
        <Pressable
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel={`Add ${item.name}`}
          style={({ pressed }) => [styles.addButton, pressed && { backgroundColor: colors.sunken }]}
        >
          <AppText variant="label">Add</AppText>
        </Pressable>
      )}
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.canvas },
  ordersButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: { gap: spacing.sm, marginBottom: spacing.xl },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.lg },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.lineStrong },
  rowPressed: { backgroundColor: colors.canvas },
  rowText: { flex: 1 },
  soldOut: { opacity: 0.45 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1 },
  description: { marginTop: 4 },
  price: { marginTop: spacing.sm },
  rowAction: { minWidth: 72, alignItems: 'flex-end' },
  addButton: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: radius.sm + 2,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    justifyContent: 'center',
  },
  cartBar: {
    position: 'absolute',
    left: spacing.screen,
    right: 92,
    bottom: 16,
    minHeight: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartHint: { color: 'rgba(255,255,255,0.65)', marginTop: 1 },
});
