import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Stethoscope } from 'lucide-react-native';
import { Consultation, MedicineOrder } from '../types';
import { medicalService } from '../services/medical.service';
import { realtimeEvents, REALTIME_EVENTS } from '../services/realtimeEvents';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen, SectionLabel } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/Bits';
import { spacing, Tone } from '../theme';
import { formatCurrency, getErrorMessage, humanize } from '../lib/format';

const orderTone: Record<MedicineOrder['status'], Tone> = { PLACED: 'info', PREPARING: 'warn', READY: 'ok', DELIVERED: 'neutral', CANCELLED: 'critical' };
const orderLabel: Record<MedicineOrder['status'], string> = {
  PLACED: 'Received',
  PREPARING: 'Preparing',
  READY: 'Ready',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};
const consultTone: Record<Consultation['status'], Tone> = { REQUESTED: 'info', SCHEDULED: 'ok', COMPLETED: 'neutral', CANCELLED: 'critical' };

const placed = (iso: string) => new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export const HealthRequestsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<MedicineOrder[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [o, c] = await Promise.allSettled([medicalService.getMyMedicineOrders(), medicalService.getMyConsultations()]);
    if (o.status === 'fulfilled') setOrders(o.value);
    if (c.status === 'fulfilled') setConsultations(c.value);
    setLoaded(true);
  }, []);

  // Pharmacy staff moving an order along, or answering a request, shows up here live.
  useEffect(() => {
    load();
    return realtimeEvents.on(REALTIME_EVENTS.medicalChanged, load);
  }, [load]);

  const cancelOrder = (order: MedicineOrder) =>
    Alert.alert('Cancel this pharmacy order?', 'You can only do this before the pharmacy starts preparing it.', [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: async () => {
          setBusyId(order.id);
          try {
            await medicalService.cancelMedicineOrder(order.id);
            load();
          } catch (error) {
            Alert.alert('Could not cancel', getErrorMessage(error, 'The pharmacy may have already started on it.'));
            load();
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);

  if (loaded && orders.length === 0 && consultations.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon={Stethoscope}
          title="Nothing here yet"
          description="Your pharmacy orders and requests to talk to a nurse show up here."
          action={<Button title="Open the pharmacy" variant="secondary" onPress={() => navigation.navigate('MedicineStore')} />}
        />
      </Screen>
    );
  }

  return (
    <Screen bottomSpace={48}>
      {orders.length > 0 && (
        <>
          <SectionLabel>Pharmacy orders</SectionLabel>
          <View style={styles.list}>
            {orders.map(order => (
              <Card key={order.id}>
                <View style={styles.header}>
                  <View style={styles.flex}>
                    <AppText variant="heading">{formatCurrency(order.totalAmount)}</AppText>
                    <AppText variant="caption" tone="ink3">
                      {placed(order.createdAt)} · {order.pickupOrDelivery === 'DELIVERY' ? 'Delivery' : 'Pick up'}
                    </AppText>
                  </View>
                  <StatusBadge label={orderLabel[order.status]} tone={orderTone[order.status]} />
                </View>
                <View style={styles.items}>
                  {order.items?.map(line => (
                    <AppText key={line.id} variant="callout" tone="ink2">
                      {line.quantity}× {line.medicine.name}
                    </AppText>
                  ))}
                </View>
                {order.status === 'PLACED' && (
                  <Button title="Cancel order" variant="secondary" onPress={() => cancelOrder(order)} isLoading={busyId === order.id} style={styles.cancel} />
                )}
              </Card>
            ))}
          </View>
        </>
      )}

      {consultations.length > 0 && (
        <>
          <SectionLabel>Requests to staff</SectionLabel>
          <View style={styles.list}>
            {consultations.map(c => (
              <Card key={c.id}>
                <View style={styles.header}>
                  <View style={styles.flex}>
                    <AppText variant="heading">{humanize(c.type)}</AppText>
                    <AppText variant="caption" tone="ink3">
                      {placed(c.createdAt)}
                      {c.slotTime ? ` · for ${placed(c.slotTime)}` : ''}
                    </AppText>
                  </View>
                  <StatusBadge label={humanize(c.status)} tone={consultTone[c.status]} />
                </View>
                {!!c.note && (
                  <AppText variant="caption" tone="ink3" style={styles.note}>
                    “{c.note}”
                  </AppText>
                )}
              </Card>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  items: { marginTop: spacing.md, gap: 4 },
  note: { marginTop: spacing.sm },
  cancel: { marginTop: spacing.md },
});
