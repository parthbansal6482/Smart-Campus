import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MenuItem, MenuReview, RootStackParamList } from '../types';
import { cafeteriaService } from '../services/cafeteria.service';
import { realtimeEvents, REALTIME_EVENTS } from '../services/realtimeEvents';
import { Chips } from '../components/Chips';
import { Field } from '../components/Field';
import { Card } from '../components/Card';
import { useCartStore } from '../store/cartStore';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Screen, StickyFooter } from '../components/Screen';
import { Stepper, VegMark } from '../components/Bits';
import { colors, radius, spacing } from '../theme';
import { formatCurrency, getErrorMessage, humanize } from '../lib/format';

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

const RATINGS = ['1', '2', '3', '4', '5'] as const;

const ReviewsSection: React.FC<{ item: MenuItem }> = ({ item }) => {
  const [reviews, setReviews] = useState<MenuReview[]>([]);
  const [distribution, setDistribution] = useState<Record<number, number>>({});
  const [canReview, setCanReview] = useState(false);
  const [mine, setMine] = useState<MenuReview | null>(null);
  const [rating, setRating] = useState<(typeof RATINGS)[number]>('5');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [list, state] = await Promise.all([cafeteriaService.getReviews(item.id), cafeteriaService.getMyReviewState(item.id)]);
      setReviews(list.reviews);
      setDistribution(list.distribution);
      setCanReview(state.canReview);
      setMine(state.review);
      if (state.review) {
        setRating(String(state.review.rating) as (typeof RATINGS)[number]);
        setComment(state.review.comment ?? '');
      }
    } catch {
      /* reviews are optional; the dish page works without them */
    }
  }, [item.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Someone else's review (or removing mine on another device) updates the list live.
  useEffect(
    () =>
      realtimeEvents.on(REALTIME_EVENTS.menuReviewsChanged, (changedId?: string) => {
        if (!changedId || changedId === item.id) load();
      }),
    [item.id, load]
  );

  const total = reviews.length;
  if (total === 0 && !canReview) return null;

  const submit = async () => {
    setSaving(true);
    try {
      await cafeteriaService.saveReview(item.id, { rating: Number(rating), comment: comment.trim() || undefined });
      await load();
    } catch (error) {
      Alert.alert('Could not save your review', getErrorMessage(error, 'Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await cafeteriaService.deleteReview(item.id);
      setMine(null);
      setComment('');
      await load();
    } catch (error) {
      Alert.alert('Could not remove your review', getErrorMessage(error, 'Please try again.'));
    }
  };

  return (
    <View style={styles.section}>
      <AppText variant="subheading">Reviews</AppText>
      {total > 0 && (
        <>
          <AppText variant="caption" tone="ink3" style={styles.sectionBody}>
            {`${item.rating.toFixed(1)} average · ${total} ${total === 1 ? 'review' : 'reviews'}`}
          </AppText>
          <View style={styles.distribution}>
            {[5, 4, 3, 2, 1].map(star => (
              <View key={star} style={styles.distributionRow}>
                <AppText variant="caption" tone="ink3" style={styles.distributionLabel}>{`${star}★`}</AppText>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${((distribution[star] ?? 0) / total) * 100}%` }]} />
                </View>
                <AppText variant="caption" tone="ink3" style={styles.distributionCount}>
                  {distribution[star] ?? 0}
                </AppText>
              </View>
            ))}
          </View>
        </>
      )}

      {canReview && (
        <Card style={styles.reviewForm}>
          <AppText variant="bodyMedium">{mine ? 'Your review' : 'How was it?'}</AppText>
          <View style={styles.reviewChips}>
            <Chips value={rating} onChange={setRating} scroll={false} options={RATINGS.map(r => ({ value: r, label: `${r}★` }))} />
          </View>
          <Field placeholder="Add a comment (optional)" value={comment} onChangeText={setComment} multiline maxLength={500} />
          <Button title={mine ? 'Update review' : 'Post review'} onPress={submit} isLoading={saving} />
          {mine && <Button title="Remove my review" variant="secondary" onPress={remove} style={styles.removeReview} />}
        </Card>
      )}

      {reviews.map(review => (
        <View key={review.id} style={styles.review}>
          <AppText variant="bodyMedium">{`${review.user.name} · ${review.rating}★`}</AppText>
          {!!review.comment && (
            <AppText variant="body" tone="ink2" style={styles.sectionBody}>
              {review.comment}
            </AppText>
          )}
          <AppText variant="caption" tone="ink3">
            {new Date(review.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
          </AppText>
        </View>
      ))}
    </View>
  );
};

export const MenuDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'MenuDetail'>>();
  const [item, setItem] = useState(route.params.item);

  // The dish may be edited, sell out, or get a new rating while this screen is open.
  useEffect(
    () =>
      realtimeEvents.on(REALTIME_EVENTS.cafeteriaMenuChanged, () => {
        cafeteriaService
          .getMenuItem(route.params.item.id)
          .then(setItem)
          .catch(() => undefined);
      }),
    [route.params.item.id]
  );
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

        {(!!item.reviewCount || (item.stock != null && item.stock <= 5)) && (
          <AppText variant="caption" tone="ink3" style={styles.price}>
            {[
              item.reviewCount ? `★ ${item.rating.toFixed(1)} (${item.reviewCount})` : null,
              item.stock != null && item.stock <= 5 ? (item.stock === 0 ? 'Sold out' : `Only ${item.stock} left`) : null,
            ]
              .filter(Boolean)
              .join('  ·  ')}
          </AppText>
        )}

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

        <ReviewsSection item={item} />

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
  distribution: { marginTop: spacing.md, gap: 6 },
  distributionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  distributionLabel: { width: 28 },
  distributionCount: { width: 24, textAlign: 'right' },
  barTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.sunken, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3, backgroundColor: colors.ink },
  reviewForm: { marginTop: spacing.lg },
  reviewChips: { marginVertical: spacing.md },
  removeReview: { marginTop: spacing.sm },
  review: { marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.lineStrong },
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
