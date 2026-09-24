import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ShoppingBag } from 'lucide-react-native';
import { RootStackParamList } from '../types';
import { useCartStore, cartTotal } from '../store/cartStore';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Chips, Segmented } from '../components/Chips';
import { Field } from '../components/Field';
import { Screen, SectionLabel, StickyFooter } from '../components/Screen';
import { EmptyState, Stepper, VegMark } from '../components/Bits';
import { colors, radius, spacing } from '../theme';
import { formatCurrency, formatTime } from '../lib/format';

const pickupOptions = () => {
  const now = new Date();
  return [15, 30, 45, 60].map(minutes => {
    const at = new Date(now.getTime() + minutes * 60000);
    // Round to the next 5 minutes so times read naturally.
    at.setMinutes(Math.ceil(at.getMinutes() / 5) * 5, 0, 0);
    return { value: at.toISOString(), label: minutes === 15 ? `ASAP · ${formatTime(at)}` : formatTime(at) };
  });
};

export const CartScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { lines, setQuantity, placeOrder } = useCartStore();

  const slots = useMemo(pickupOptions, []);
  const [orderType, setOrderType] = useState<'PICKUP' | 'DINE_IN'>('PICKUP');
  const [pickupTime, setPickupTime] = useState(slots[0].value);
  const [note, setNote] = useState('');
  const [placing, setPlacing] = useState(false);

  const total = cartTotal(lines);

  const handlePlace = () => {
    setPlacing(true);
    setTimeout(() => {
      const order = placeOrder({
        orderType,
        pickupTime: orderType === 'PICKUP' ? pickupTime : undefined,
        note: note.trim() || undefined,
      });
      setPlacing(false);
      navigation.replace('Orders', { placedOrderId: order.id });
    }, 600);
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
              </View>
              <Stepper compact value={line.quantity} onChange={q => setQuantity(line.item.id, q)} />
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
            <Chips value={pickupTime} onChange={setPickupTime} options={slots} />
            <AppText variant="caption" tone="ink3" style={styles.helper}>
              We’ll start cooking so it’s ready when you arrive. Collect from the counter with your order number.
            </AppText>
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
        <Button title={`Place order · ${formatCurrency(total)}`} onPress={handlePlace} isLoading={placing} />
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
