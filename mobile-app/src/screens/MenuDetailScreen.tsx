import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { MENU } from '../data/mock';
import { useCartStore } from '../store/cartStore';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Screen, StickyFooter } from '../components/Screen';
import { Stepper, VegMark } from '../components/Bits';
import { colors, spacing } from '../theme';
import { formatCurrency, humanize } from '../lib/format';

const SPICE = ['Not spicy', 'Mild', 'Medium', 'Hot'];

export const MenuDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'MenuDetail'>>();
  const item = route.params?.item ?? MENU[0];
  const { lines, add, setQuantity } = useCartStore();

  const inCart = lines.find(l => l.item.id === item.id)?.quantity ?? 0;
  const [quantity, setLocalQuantity] = useState(inCart || 1);

  const handleConfirm = () => {
    if (inCart) setQuantity(item.id, quantity);
    else add(item, quantity);
    navigation.goBack();
  };

  return (
    <View style={styles.flex}>
      <Screen bottomSpace={32}>
        <View style={styles.tags}>
          <VegMark isVeg={item.isVeg} />
          <AppText variant="caption" tone="ink3">
            {item.isVeg ? 'Vegetarian' : 'Non-vegetarian'} · {humanize(item.category)} · {SPICE[item.spiceLevel] ?? 'Not spicy'}
          </AppText>
        </View>

        <AppText variant="display">{item.name}</AppText>
        <AppText variant="title" tone="ink2" style={styles.price}>
          {formatCurrency(item.price)}
        </AppText>

        {item.description && (
          <AppText variant="body" tone="ink2" style={styles.description}>
            {item.description}
          </AppText>
        )}

        <View style={styles.quantityRow}>
          <View>
            <AppText variant="subheading">Quantity</AppText>
            <AppText variant="caption" tone="ink3">
              {formatCurrency(item.price)} each
            </AppText>
          </View>
          <Stepper value={quantity} onChange={setLocalQuantity} min={inCart ? 0 : 1} />
        </View>
      </Screen>

      <StickyFooter>
        <Button
          title={
            inCart && quantity === 0
              ? 'Remove from order'
              : `${inCart ? 'Update order' : 'Add to order'} · ${formatCurrency(item.price * quantity)}`
          }
          variant={inCart && quantity === 0 ? 'secondary' : 'primary'}
          onPress={handleConfirm}
          disabled={!item.isAvailable}
        />
      </StickyFooter>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.canvas },
  tags: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  price: { marginTop: spacing.xs },
  description: { marginTop: spacing.xl },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxxl,
    paddingTop: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.lineStrong,
  },
});
