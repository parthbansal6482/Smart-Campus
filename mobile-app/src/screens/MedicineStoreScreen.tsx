import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Pill, Search } from 'lucide-react-native';
import { MEDICINES } from '../data/mock';
import { Medicine, MedicineCategory } from '../types';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Chips, Segmented } from '../components/Chips';
import { Field } from '../components/Field';
import { Screen, StickyFooter } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState, Stepper } from '../components/Bits';
import { colors, radius, spacing } from '../theme';
import { formatCurrency, humanize } from '../lib/format';

type CategoryFilter = 'ALL' | MedicineCategory;
const CATEGORIES: CategoryFilter[] = ['ALL', 'PAIN_RELIEF', 'COLD_FEVER', 'FIRST_AID', 'PRESCRIPTION_ONLY'];
const LOW_STOCK = 20;

export const MedicineStoreScreen: React.FC = () => {
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('ALL');
  const [basket, setBasket] = useState<Record<string, number>>({});
  const [fulfilment, setFulfilment] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [placing, setPlacing] = useState(false);

  const medicines = MEDICINES.filter(m => {
    if (category !== 'ALL' && m.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q);
    }
    return true;
  });

  const lines = MEDICINES.filter(m => basket[m.id]);
  const count = lines.reduce((sum, m) => sum + basket[m.id], 0);
  const total = lines.reduce((sum, m) => sum + m.price * basket[m.id], 0);
  const needsPrescription = lines.some(m => m.requiresPrescription);

  const setQuantity = (medicine: Medicine, quantity: number) => {
    if (quantity > 0 && !basket[medicine.id] && medicine.requiresPrescription) {
      Alert.alert(
        'Prescription needed',
        `${medicine.name} needs a campus doctor’s prescription. You’ll be asked to upload a photo of it before the pharmacist can hand it over.`
      );
    }
    setBasket(prev => {
      const next = { ...prev };
      if (quantity <= 0) delete next[medicine.id];
      else next[medicine.id] = quantity;
      return next;
    });
  };

  const placeOrder = () => {
    setPlacing(true);
    setTimeout(() => {
      setPlacing(false);
      Alert.alert(
        'Order placed',
        fulfilment === 'PICKUP'
          ? 'We’ll let you know when it’s ready to collect from the medical centre pharmacy.'
          : 'The pharmacy will call you to confirm where to deliver it.',
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    }, 600);
  };

  return (
    <View style={styles.flex}>
      <Screen bottomSpace={32}>
        <Field
          value={search}
          onChangeText={setSearch}
          placeholder="Search medicines"
          leading={<Search size={18} color={colors.ink4} />}
          autoCorrect={false}
        />
        <View style={styles.filters}>
          <Chips
            value={category}
            onChange={setCategory}
            options={CATEGORIES.map(c => ({ value: c, label: c === 'ALL' ? 'All' : c === 'PRESCRIPTION_ONLY' ? 'Prescription' : humanize(c) }))}
          />
        </View>

        {medicines.length === 0 ? (
          <EmptyState icon={Pill} title="No medicines found" description="Try a different name or category." />
        ) : (
          <View style={styles.list}>
            {medicines.map((m, index) => (
              <View key={m.id} style={[styles.row, index < medicines.length - 1 && styles.divider]}>
                <View style={styles.flexText}>
                  <AppText variant="subheading">{m.name}</AppText>
                  {m.description && (
                    <AppText variant="caption" tone="ink3" style={styles.description}>
                      {m.description}
                    </AppText>
                  )}
                  <View style={styles.meta}>
                    <AppText variant="bodyMedium">{formatCurrency(m.price)}</AppText>
                    {m.requiresPrescription && <StatusBadge label="Prescription" tone="warn" />}
                    {m.stock < LOW_STOCK && <StatusBadge label={`Only ${m.stock} left`} tone="neutral" />}
                  </View>
                </View>
                {basket[m.id] ? (
                  <Stepper compact value={basket[m.id]} onChange={q => setQuantity(m, q)} max={Math.min(m.stock, 10)} />
                ) : (
                  <Pressable
                    onPress={() => setQuantity(m, 1)}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${m.name}`}
                    style={({ pressed }) => [styles.addButton, pressed && { backgroundColor: colors.sunken }]}
                  >
                    <AppText variant="label">Add</AppText>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}
      </Screen>

      {count > 0 && (
        <StickyFooter>
          <Segmented
            value={fulfilment}
            onChange={setFulfilment}
            options={[
              { value: 'PICKUP', label: 'Pick up' },
              { value: 'DELIVERY', label: 'Delivery' },
            ]}
          />
          {needsPrescription && (
            <AppText variant="caption" tone="warn" style={styles.rxNote}>
              Includes a prescription medicine — keep your prescription ready.
            </AppText>
          )}
          <Button
            title={`Order ${count} ${count === 1 ? 'item' : 'items'} · ${formatCurrency(total)}`}
            onPress={placeOrder}
            isLoading={placing}
            style={styles.orderButton}
          />
        </StickyFooter>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.canvas },
  filters: { marginBottom: spacing.xl },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.lg },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.lineStrong },
  flexText: { flex: 1 },
  description: { marginTop: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  addButton: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: radius.sm + 2,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    justifyContent: 'center',
  },
  rxNote: { marginTop: spacing.sm },
  orderButton: { marginTop: spacing.md },
});
