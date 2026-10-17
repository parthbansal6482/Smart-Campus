import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ShoppingBag } from 'lucide-react-native';
import { RootStackParamList } from '../types';
import { isKitchenOpenAt, kitchenHoursLabel, useCampusStore } from '../store/campusStore';
import { CampusSettings } from '../types';
import { lineProblem, maxQuantityFor, useCartStore, cartTotal } from '../store/cartStore';
import { cafeteriaService } from '../services/cafeteria.service';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Chips, Segmented } from '../components/Chips';
import { Field } from '../components/Field';
import { Screen, SectionLabel, StickyFooter } from '../components/Screen';
import { EmptyState, Stepper, VegMark } from '../components/Bits';
import { colors, radius, spacing } from '../theme';
import { formatCurrency, formatTime, getErrorMessage } from '../lib/format';

const pickupOptions = (settings: CampusSettings) => {
  const now = new Date();
  return [15, 30, 45, 60, 90, 120]
    .map(minutes => {
      const at = new Date(now.getTime() + minutes * 60000);
      // Round to the next 5 minutes so times read naturally.
      at.setMinutes(Math.ceil(at.getMinutes() / 5) * 5, 0, 0);
      return { minutes, at };
    })
    // Only offer times the kitchen is actually open.
    .filter(({ at }) => isKitchenOpenAt(settings, at))
    // The choice is kept as "minutes from now" so it survives the clock ticking; the exact time is computed when ordering.
    .map(({ minutes, at }) => ({ value: String(minutes), at, label: minutes === 15 ? `ASAP · ${formatTime(at)}` : formatTime(at) }));
};

export const CartScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { lines, setQuantity, clear } = useCartStore();

  const campus = useCampusStore(state => state.settings);
  // Re-evaluate every 30 s so slot times and the open/closed state don't go stale on a screen left open.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const slots = useMemo(() => pickupOptions(campus), [campus, tick]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const kitchenOpen = useMemo(() => isKitchenOpenAt(campus, new Date()), [campus, tick]);
  const [orderType, setOrderType] = useState<'PICKUP' | 'DINE_IN'>('PICKUP');
  const [chosenSlot, setPickupTime] = useState('');
  // If the chosen time is no longer offered (hours changed, time passed) fall back to the first open slot.
  const pickupTime = slots.some(o => o.value === chosenSlot) ? chosenSlot : slots[0]?.value ?? '';
  const [note, setNote] = useState('');
  const [table, setTable] = useState('');
  const [placing, setPlacing] = useState(false);

  const total = cartTotal(lines);
  const blocked = lines.some(l => lineProblem(l) !== null);

  const handlePlace = async () => {
    if (!kitchenOpen) {
      Alert.alert('The kitchen is closed', `Orders open again during kitchen hours (${kitchenHoursLabel(campus)}).`);
      return;
    }
    if (orderType === 'PICKUP' && !pickupTime) {
      Alert.alert('No pickup times left', 'The kitchen closes soon — try dine in, or order again tomorrow.');
      return;
    }
    if (orderType === 'DINE_IN' && !table.trim()) {
      Alert.alert('Add your table number', 'Tell us where to bring your order, e.g. T4.');
      return;
    }
    // Work out the exact pickup time now, from the freshest clock reading.
    const slot = orderType === 'PICKUP' ? pickupOptions(campus).find(o => o.value === pickupTime) : undefined;
    if (orderType === 'PICKUP' && !slot) {
      Alert.alert('That pickup time has passed', 'Pick another time and try again.');
      return;
    }
    if (placing) return;
    setPlacing(true);
    try {
      const order = await cafeteriaService.placeOrder({
        orderType,
        pickupTime: slot?.at.toISOString(),
        tableNumber: orderType === 'DINE_IN' ? table.trim() : undefined,
        note: note.trim() || undefined,
        items: lines.map(l => ({ menuItemId: l.item.id, quantity: l.quantity })),
      });
      clear();
      navigation.replace('Orders', { placedOrderId: order.id });
    } catch (error) {
      Alert.alert('Could not place order', getErrorMessage(error));
    } finally {
      setPlacing(false);
    }
  };

  if (lines.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon={ShoppingBag}
          title="Your order is empty"
          description="Add something from today’s menu to get started."
          action={<Button title="Browse the menu" variant="secondary" onPress={() => navigation.goBack()} />}
        />
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen bottomSpace={32}>
        <View style={styles.lines}>
          {lines.map((line, index) => (
            <View key={line.item.id} style={[styles.line, index < lines.length - 1 && styles.lineDivider]}>
              <View style={styles.lineText}>
                <View style={styles.nameRow}>
                  <VegMark isVeg={line.item.isVeg} />
                  <AppText variant="bodyMedium" style={styles.flexText}>
                    {line.item.name}
                  </AppText>
                </View>
                <AppText variant="caption" tone="ink3" style={styles.linePrice}>
                  {formatCurrency(line.item.price * line.quantity)}
                </AppText>
                {lineProblem(line) && (
                  <AppText variant="caption" tone="critical">
                    {lineProblem(line)}
                  </AppText>
                )}
              </View>
              <Stepper compact max={maxQuantityFor(line.item)} value={line.quantity} onChange={q => setQuantity(line.item.id, q)} />
            </View>
          ))}
        </View>

        <SectionLabel>How would you like it?</SectionLabel>
        <Segmented
          value={orderType}
          onChange={setOrderType}
          options={[
            { value: 'PICKUP', label: 'Pick up' },
            { value: 'DINE_IN', label: 'Dine in' },
          ]}
        />

        {orderType === 'PICKUP' && (
          <>
            <SectionLabel>Pickup time</SectionLabel>
            {slots.length > 0 ? (
              <Chips value={pickupTime} onChange={setPickupTime} options={slots} />
            ) : (
              <AppText variant="callout" tone="critical">
                {kitchenOpen ? 'The kitchen is closing — no pickup times left today.' : `The kitchen is closed (${kitchenHoursLabel(campus)}).`}
              </AppText>
            )}
            <AppText variant="caption" tone="ink3" style={styles.helper}>
              We’ll start cooking so it’s ready when you arrive. Collect from the counter with your order number.
            </AppText>
          </>
        )}

        {orderType === 'DINE_IN' && (
          <>
            <SectionLabel>Table number</SectionLabel>
            <Field value={table} onChangeText={setTable} placeholder="e.g. T4" autoCapitalize="characters" maxLength={10} />
          </>
        )}

        <SectionLabel>Note for the kitchen</SectionLabel>
        <Field value={note} onChangeText={setNote} placeholder="Optional — e.g. less spicy, no onions" />

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <AppText variant="subheading">Total</AppText>
            <AppText variant="heading">{formatCurrency(total)}</AppText>
          </View>
        </View>
      </Screen>

      <StickyFooter>
        <Button
          title={blocked ? 'Update unavailable items' : `Place order · ${formatCurrency(total)}`}
          onPress={handlePlace}
          isLoading={placing}
          disabled={blocked || !kitchenOpen}
        />
      </StickyFooter>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.canvas },
  lines: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  lineDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.lineStrong },
  lineText: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flexText: { flex: 1 },
  linePrice: { marginTop: 2, marginLeft: 22 },
  helper: { marginTop: spacing.sm },
  totals: {
    marginTop: spacing.xxl,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.lineStrong,
    gap: spacing.sm,
  },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
});
