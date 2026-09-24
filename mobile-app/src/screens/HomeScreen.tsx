import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowUpRight, DoorOpen, MessageCircle, Pill, UtensilsCrossed, LucideIcon } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { MENU, ROOMS } from '../data/mock';
import { AppText } from '../components/AppText';
import { Card } from '../components/Card';
import { Screen, SectionLabel } from '../components/Screen';
import { StatusBadge } from '../components/StatusBadge';
import { VegMark } from '../components/Bits';
import { colors, fonts, radius, spacing } from '../theme';
import { firstName, formatCurrency, greeting, initials } from '../lib/format';

interface Action {
  title: string;
  caption: string;
  icon: LucideIcon;
  onPress: () => void;
}

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const user = useAuthStore(state => state.user);
  const orders = useCartStore(state => state.orders);

  const activeOrder = orders.find(o => o.status !== 'COLLECTED' && o.status !== 'CANCELLED');
  const freeRoom = ROOMS.find(r => !r.isOccupied);
  const todaysPicks = MENU.filter(m => m.isAvailable && m.category === 'LUNCH');
  const today = new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });

  const actions: Action[] = [
    { title: 'Find a room', caption: 'See what’s free now', icon: DoorOpen, onPress: () => navigation.navigate('ClassroomsTab') },
    { title: 'Order food', caption: 'Skip the queue', icon: UtensilsCrossed, onPress: () => navigation.navigate('CafeteriaTab') },
    { title: 'Pharmacy', caption: 'Medicines & first aid', icon: Pill, onPress: () => navigation.navigate('MedicineStore') },
    { title: 'Talk to a nurse', caption: 'Call back or chat', icon: MessageCircle, onPress: () => navigation.navigate('TalkToStaff') },
  ];

  return (
    <Screen
      topInset
      eyebrow={today}
      title={`${greeting()},\n${firstName(user?.name) || 'there'}`}
      headerRight={
        <Pressable
          onPress={() => navigation.navigate('ProfileTab')}
          accessibilityRole="button"
          accessibilityLabel="Your profile"
          style={styles.avatar}
        >
          <AppText variant="label">{initials(user?.name)}</AppText>
        </Pressable>
      }
    >
      <View style={styles.grid}>
        {actions.map(action => {
          const Icon = action.icon;
          return (
            <Card key={action.title} onPress={action.onPress} style={styles.action} accessibilityLabel={action.title}>
              <Icon size={22} color={colors.ink} strokeWidth={1.6} />
              <View style={styles.actionText}>
                <AppText variant="subheading">{action.title}</AppText>
                <AppText variant="caption" tone="ink3">
                  {action.caption}
                </AppText>
              </View>
            </Card>
          );
        })}
      </View>

      <SectionLabel>Right now</SectionLabel>
      <View style={styles.stack}>
        {activeOrder && (
          <Card onPress={() => navigation.navigate('Orders')}>
            <View style={styles.rowBetween}>
              <AppText variant="caption" tone="ink3">
                Your order
              </AppText>
              <StatusBadge label={activeOrder.status === 'READY' ? 'Ready' : 'Being prepared'} tone={activeOrder.status === 'READY' ? 'ok' : 'warn'} />
            </View>
            <AppText variant="heading" style={styles.cardTitle}>
              {activeOrder.orderToken}
            </AppText>
            <AppText variant="callout" tone="ink3">
              {activeOrder.orderItems?.map(i => `${i.quantity}× ${i.menuItem.name}`).join(', ')}
            </AppText>
          </Card>
        )}

        {freeRoom && (
          <Card onPress={() => navigation.navigate('BookRoom', { room: freeRoom })}>
            <View style={styles.rowBetween}>
              <AppText variant="caption" tone="ink3">
                Free room nearby
              </AppText>
              <StatusBadge label="Free" tone="ok" />
            </View>
            <AppText variant="heading" style={styles.cardTitle}>
              {freeRoom.roomNumber}
            </AppText>
            <AppText variant="callout" tone="ink3">
              {freeRoom.building?.name} · {freeRoom.capacity} seats
            </AppText>
            <View style={styles.cardFooter}>
              <AppText variant="label" tone="ink2">
                {freeRoom.availability}
              </AppText>
              <View style={styles.inlineLink}>
                <AppText variant="label">Book</AppText>
                <ArrowUpRight size={16} color={colors.ink} />
              </View>
            </View>
          </Card>
        )}
      </View>

      <SectionLabel
        action={
          <Pressable onPress={() => navigation.navigate('CafeteriaTab')} hitSlop={8} accessibilityRole="button">
            <AppText variant="label">Full menu</AppText>
          </Pressable>
        }
      >
        Lunch today
      </SectionLabel>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.menuRow}>
        {todaysPicks.map(item => (
          <Card key={item.id} onPress={() => navigation.navigate('MenuDetail', { item })} style={styles.menuCard}>
            <VegMark isVeg={item.isVeg} />
            <AppText variant="subheading" style={styles.menuName} numberOfLines={2}>
              {item.name}
            </AppText>
            <AppText variant="callout" tone="ink2">
              {formatCurrency(item.price)}
            </AppText>
          </Card>
        ))}
      </ScrollView>

      <View style={styles.sosHint}>
        <AppText variant="caption" tone="ink3">
          In a medical emergency, press <AppText variant="caption" style={styles.sosWord}>SOS</AppText> — your location is
          sent to the campus ambulance.
        </AppText>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  action: { width: '47.8%', minHeight: 124, justifyContent: 'space-between' },
  actionText: { gap: 2 },
  stack: { gap: spacing.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { marginTop: spacing.sm, marginBottom: 2 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.lineStrong,
  },
  inlineLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  bleed: { marginHorizontal: -spacing.screen },
  menuRow: { paddingHorizontal: spacing.screen, gap: spacing.md },
  menuCard: { width: 150, minHeight: 132, justifyContent: 'space-between', borderRadius: radius.lg },
  menuName: { marginTop: spacing.md },
  sosHint: {
    marginTop: spacing.xxxl,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.lineStrong,
    paddingRight: 72,
  },
  sosWord: { fontFamily: fonts.semibold, color: colors.critical },
});
