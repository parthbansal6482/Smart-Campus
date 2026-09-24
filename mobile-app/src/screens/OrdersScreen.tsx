import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Check, ReceiptText } from 'lucide-react-native';
import { Order, RootStackParamList } from '../types';
import { useCartStore } from '../store/cartStore';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen, SectionLabel } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState, StepProgress } from '../components/Bits';
import { colors, spacing, Tone } from '../theme';
import { formatCurrency, formatTime } from '../lib/format';

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
  const orders = useCartStore(state => state.orders);

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
            <OrderCard order={justPlaced} bare />
          </View>
        </View>
      )}

      {active.length > 0 && (
        <>
          <SectionLabel>In progress</SectionLabel>
          <View style={styles.list}>
            {active.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </View>
        </>
      )}

      {past.length > 0 && (
        <>
          <SectionLabel>Past orders</SectionLabel>
          <View style={styles.list}>
            {past.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
};

const OrderCard: React.FC<{ order: Order; bare?: boolean }> = ({ order, bare }) => {
  const step = FLOW.indexOf(order.status === 'ACCEPTED' ? 'PLACED' : order.status);
  const content = (
    <>
      <View style={styles.header}>
        <View>
          <AppText variant="heading">{order.orderToken}</AppText>
          <AppText variant="caption" tone="ink3" style={styles.meta}>
            {placedAt(order.createdAt)} · {order.orderType === 'PICKUP' ? 'Pick up' : 'Dine in'}
          </AppText>
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
          <View key={line.id} style={styles.itemRow}>
            <AppText variant="callout" tone="ink2" style={styles.flex}>
              {line.quantity}× {line.menuItem.name}
            </AppText>
            <AppText variant="callout" tone="ink3">
              {formatCurrency(line.unitPrice * line.quantity)}
            </AppText>
          </View>
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
