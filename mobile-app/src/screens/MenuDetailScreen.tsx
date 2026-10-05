import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MenuItem, RootStackParamList } from '../types';
import { useCartStore } from '../store/cartStore';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Screen, StickyFooter } from '../components/Screen';
import { Stepper, VegMark } from '../components/Bits';
import { colors, radius, spacing } from '../theme';
import { formatCurrency, humanize } from '../lib/format';

const nutritionRows = (item: MenuItem) =>
  [
    { label: 'Calories', value: item.calories, unit: 'kcal' },
    { label: 'Protein', value: item.proteinG, unit: 'g' },
    { label: 'Carbs', value: item.carbsG, unit: 'g' },
    { label: 'Fat', value: item.fatG, unit: 'g' },
    { label: 'Fiber', value: item.fiberG, unit: 'g' },
    { label: 'Sugar', value: item.sugarG, unit: 'g' },
    { label: 'Sodium', value: item.sodiumMg, unit: 'mg' },
  ].filter(r => r.value != null);

const SPICE = ['Not spicy', 'Mild', 'Medium', 'Hot'];

export const MenuDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'MenuDetail'>>();
  const item = route.params.item;
  const { lines, add, setQuantity } = useCartStore();

  const { width } = useWindowDimensions();
  const photos = [...(item.imageUrl ? [item.imageUrl] : []), ...(item.galleryUrls ?? [])];
  const nutrition = nutritionRows(item);
  const ingredients = item.ingredients ?? [];
  const allergens = item.allergens ?? [];

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
        {photos.length > 0 && (
          <ScrollView
            horizontal
            pagingEnabled={photos.length > 1}
            showsHorizontalScrollIndicator={false}
            style={styles.gallery}
            accessibilityLabel={`${item.name} photos`}
          >
            {photos.map(uri => (
              <Image
                key={uri}
                source={{ uri }}
                accessibilityIgnoresInvertColors
                style={[styles.photo, { width: width - spacing.screen * 2 }]}
              />
            ))}
          </ScrollView>
        )}

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

        {nutrition.length > 0 && (
          <View style={styles.section}>
            <AppText variant="subheading">Nutrition</AppText>
            <AppText variant="caption" tone="ink3">
              {item.servingSize ? `Per serving · ${item.servingSize}` : 'Per serving'}
            </AppText>
            <View style={styles.nutritionGrid}>
              {nutrition.map(r => (
                <View key={r.label} style={styles.nutritionCell}>
                  <AppText variant="bodyMedium">
                    {r.value}
                    <AppText variant="caption" tone="ink3">{` ${r.unit}`}</AppText>
                  </AppText>
                  <AppText variant="caption" tone="ink3">
                    {r.label}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        )}

        {ingredients.length > 0 && (
          <View style={styles.section}>
            <AppText variant="subheading">Ingredients</AppText>
            <AppText variant="body" tone="ink2" style={styles.sectionBody}>
              {ingredients.join(', ')}
            </AppText>
          </View>
        )}

        {allergens.length > 0 && (
          <View style={styles.section}>
            <AppText variant="subheading">Allergens</AppText>
            <AppText variant="body" tone="ink2" style={styles.sectionBody}>
              Contains {allergens.join(', ')}
            </AppText>
          </View>
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
  gallery: { marginBottom: spacing.lg, marginHorizontal: 0 },
  photo: { height: 220, borderRadius: radius.lg, backgroundColor: colors.sunken },
  section: { marginTop: spacing.xl },
  sectionBody: { marginTop: spacing.xs },
  nutritionGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md, gap: spacing.md },
  nutritionCell: {
    minWidth: '30%',
    flexGrow: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.sunken,
  },
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
