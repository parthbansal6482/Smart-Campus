import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Check, ReceiptText } from 'lucide-react-native';
import { MenuItem, Order, RootStackParamList } from '../types';
import { useCartStore } from '../store/cartStore';
import { cafeteriaService } from '../services/cafeteria.service';
import { realtimeEvents, REALTIME_EVENTS } from '../services/realtimeEvents';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen, SectionLabel } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState, StepProgress } from '../components/Bits';
import { colors, spacing, Tone } from '../theme';
import { formatCurrency, formatTime, getErrorMessage } from '../lib/format';

const FLOW: Order['status'][] = ['PLACED', 'PREPARING', 'READY', 'COLLECTED'];

const statusLabel: Record<Order['status'], string> = {
  PLACED: 'Received',
  ACCEPTED: 'Received',
  PREPARING: 'Preparing',
  READY: 'Ready to collect',
  COLLECTED: 'Collected',
  CANCELLED: 'Cancelled',
};

const statusTone: Record<Order['status'], Tone> = {
  PLACED: 'info',
  ACCEPTED: 'info',
  PREPARING: 'warn',
  READY: 'ok',
  COLLECTED: 'neutral',
  CANCELLED: 'critical',
};

const isActive = (o: Order) => o.status !== 'COLLECTED' && o.status !== 'CANCELLED';

const placedAt = (iso: string) => {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return `${sameDay ? 'Today' : d.toLocaleDateString([], { day: 'numeric', month: 'short' })}, ${formatTime(d)}`;
};

export const OrdersScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'Orders'>>();
  const { add } = useCartStore();
  const [latest, setLatest] = useState<Order[]>([]);
  // Older pages are appended on demand; the newest page is refreshed on realtime events.
  const [older, setOlder] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busyReorder, setBusyReorder] = useState<string | null>(null);

  const orders = [...latest, ...older.filter(o => !latest.some(l => l.id === o.id))];

  const pageRef = useRef(1);
  pageRef.current = page;

  const loadOrders = useCallback(async () => {
    try {
      const first = await cafeteriaService.getMyOrders(1);
      setLatest(first.orders);
      setTotalPages(first.totalPages);
      // Keep any older pages the user has already opened in step with the server too.
      if (pageRef.current > 1) {
        const rest = await Promise.all(
          Array.from({ length: pageRef.current - 1 }, (_, i) => cafeteriaService.getMyOrders(i + 2))
        );
        setOlder(rest.flatMap(r => r.orders));
      }
    } catch {
      /* keep what's on screen */
    }
  }, []);

  const loadOlder = async () => {
    try {
      const r = await cafeteriaService.getMyOrders(page + 1);
      setOlder(prev => [...prev, ...r.orders]);
      setPage(page + 1);
      setTotalPages(r.totalPages);
    } catch (error) {
      Alert.alert('Could not load older orders', getErrorMessage(error, 'Please try again.'));
    }
  };

  const reorder = async (order: Order) => {
    setBusyReorder(order.id);
    try {
      const lines = await cafeteriaService.getReorderLines(order.id);
      const available = lines.filter(l => l.available);
      const unavailable = lines.filter(l => !l.available);
      available.forEach(l => add(l.menuItem, l.quantity));
      if (available.length === 0) {
        Alert.alert('Nothing to reorder', 'None of the dishes from this order are available right now.');
        return;
      }
      if (unavailable.length > 0) {
        Alert.alert('Some dishes were left out', `Not available right now: ${unavailable.map(l => l.menuItem.name).join(', ')}.`, [
          { text: 'Continue', onPress: () => navigation.navigate('Cart') },
        ]);
        return;
      }
      navigation.navigate('Cart');
    } catch (error) {
      Alert.alert('Could not reorder', getErrorMessage(error, 'Please try again.'));
    } finally {
      setBusyReorder(null);
    }
  };

  useEffect(() => {
    loadOrders();
    return realtimeEvents.on(REALTIME_EVENTS.cafeteriaOrdersChanged, loadOrders);
  }, [loadOrders]);

  const cancelOrder = (order: Order) => {
    Alert.alert('Cancel this order?', `${order.orderToken} will be cancelled. You can only do this before the kitchen starts on it.`, [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: async () => {
          try {
            await cafeteriaService.cancelOrder(order.id);
            loadOrders();
          } catch (error) {
            Alert.alert('Could not cancel', getErrorMessage(error, 'The kitchen may have already started on it.'));
            loadOrders();
          }
        },
      },
    ]);
  };

  const justPlaced = orders.find(o => o.id === route.params?.placedOrderId);
  const active = orders.filter(o => isActive(o) && o.id !== justPlaced?.id);
  const past = orders.filter(o => !isActive(o));

  if (orders.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon={ReceiptText}
          title="No orders yet"
          description="Order ahead from the cafeteria and track it here."
          action={<Button title="See the menu" variant="secondary" onPress={() => navigation.navigate('Main', { screen: 'CafeteriaTab' })} />}
        />
      </Screen>
    );
  }

  return (
    <Screen bottomSpace={48}>
      {justPlaced && (
        <View style={styles.confirmation}>
          <View style={styles.check}>
            <Check size={22} color={colors.ok} />
          </View>
          <AppText variant="caption" tone="ink3" align="center">
            Order placed · show this number at the counter
          </AppText>
          <AppText variant="display" align="center" style={styles.token}>
            {justPlaced.orderToken}
          </AppText>
          <AppText variant="callout" tone="ink2" align="center">
            {justPlaced.pickupTime
              ? `Ready for pickup around ${formatTime(new Date(justPlaced.pickupTime))}`
              : 'We’ll bring it to your table when it’s ready'}
          </AppText>
          <View style={styles.confirmationCard}>
            <OrderCard order={justPlaced} onCancel={cancelOrder} bare />
          </View>
        </View>
      )}

      {active.length > 0 && (
        <>
          <SectionLabel>In progress</SectionLabel>
          <View style={styles.list}>
            {active.map(order => (
              <OrderCard key={order.id} order={order} onCancel={cancelOrder} />
            ))}
          </View>
        </>
      )}

      {past.length > 0 && (
        <>
          <SectionLabel>Past orders</SectionLabel>
          <View style={styles.list}>
            {past.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onReorder={reorder}
                reordering={busyReorder === order.id}
                onOpenDish={item => navigation.navigate('MenuDetail', { item })}
              />
            ))}
          </View>
          {page < totalPages && <Button title="Show older orders" variant="secondary" onPress={loadOlder} style={styles.older} />}
        </>
      )}
    </Screen>
  );
};

interface OrderCardProps {
  order: Order;
  onCancel?: (order: Order) => void;
  onReorder?: (order: Order) => void;
  reordering?: boolean;
  /** Opens a dish from the order (collected orders link to its page so it can be rated). */
  onOpenDish?: (item: MenuItem) => void;
  bare?: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onCancel, onReorder, reordering, onOpenDish, bare }) => {
  const step = FLOW.indexOf(order.status === 'ACCEPTED' ? 'PLACED' : order.status);
  const content = (
    <>
      <View style={styles.header}>
        <View>
          <AppText variant="heading">{order.orderToken}</AppText>
          <AppText variant="caption" tone="ink3" style={styles.meta}>
            {placedAt(order.createdAt)} · {order.orderType === 'PICKUP' ? 'Pick up' : `Dine in${order.tableNumber ? ` · table ${order.tableNumber}` : ''}`}
          </AppText>
          {isActive(order) && order.orderType === 'PICKUP' && order.pickupTime && (
            <AppText variant="caption" tone="ink3" style={styles.meta}>
              Pickup around {formatTime(new Date(order.pickupTime))}
            </AppText>
          )}
        </View>
        <StatusBadge label={statusLabel[order.status]} tone={statusTone[order.status]} />
      </View>

      {isActive(order) && step >= 0 && (
        <View style={styles.progress}>
          <StepProgress steps={FLOW.length} current={step} />
          <View style={styles.progressLabels}>
            {['Received', 'Preparing', 'Ready', 'Collected'].map((label, i) => (
              <AppText key={label} variant="micro" tone={i === step ? 'ink' : 'ink4'}>
                {label}
              </AppText>
            ))}
          </View>
        </View>
      )}

      <View style={styles.items}>
        {order.orderItems?.map(line => (
          <Pressable
            key={line.id}
            style={styles.itemRow}
            disabled={!onOpenDish || order.status !== 'COLLECTED'}
            onPress={() => onOpenDish?.(line.menuItem)}
            accessibilityRole={order.status === 'COLLECTED' ? 'button' : undefined}
            accessibilityHint={order.status === 'COLLECTED' ? 'Opens the dish so you can rate it' : undefined}
          >
            <AppText variant="callout" tone="ink2" style={styles.flex}>
              {line.quantity}× {line.menuItem.name}
            </AppText>
            <AppText variant="callout" tone="ink3">
              {formatCurrency(line.unitPrice * line.quantity)}
            </AppText>
          </Pressable>
        ))}
      </View>

      {order.note && (
        <AppText variant="caption" tone="ink3" style={styles.note}>
          “{order.note}”
        </AppText>
      )}

      <View style={styles.totalRow}>
        <AppText variant="label" tone="ink3">
          Total
        </AppText>
        <AppText variant="bodyMedium">{formatCurrency(order.totalAmount)}</AppText>
      </View>

      {order.status === 'COLLECTED' && onOpenDish && (
        <AppText variant="caption" tone="ink3" style={styles.note}>
          Tap a dish to rate it.
        </AppText>
      )}

      {onReorder && (
        <Button title="Order again" variant="secondary" onPress={() => onReorder(order)} isLoading={reordering} style={styles.cancel} />
      )}

      {onCancel && order.status === 'PLACED' && (
        <Button title="Cancel order" variant="secondary" onPress={() => onCancel(order)} style={styles.cancel} />
      )}
    </>
  );

  return bare ? <View>{content}</View> : <Card>{content}</Card>;
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  confirmation: { alignItems: 'stretch', marginBottom: spacing.lg },
  check: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.okSoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  token: { fontSize: 52, lineHeight: 58, marginVertical: spacing.sm },
  confirmationCard: {
    marginTop: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
  },
  list: { gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  meta: { marginTop: 2 },
  progress: { marginTop: spacing.lg },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  items: { marginTop: spacing.lg, gap: 6 },
  itemRow: { flexDirection: 'row', gap: spacing.md },
  note: { marginTop: spacing.sm },
  cancel: { marginTop: spacing.md },
  older: { marginTop: spacing.lg },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.lineStrong,
  },
});
