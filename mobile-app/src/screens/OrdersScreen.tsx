import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { Clock, Utensils } from 'lucide-react-native';

const MOCK_ORDERS = [
  {
    id: 'ord-101',
    status: 'PREPARING' as const,
    orderType: 'PICKUP' as const,
    totalAmount: 13.45,
    items: ['1x Cold Brew Artisan Coffee', '1x Avocado & Grilled Chicken Panini'],
    createdAt: '12:30 PM',
  },
  {
    id: 'ord-098',
    status: 'COMPLETED' as const,
    orderType: 'DINE_IN' as const,
    totalAmount: 3.25,
    items: ['1x Butter Croissant'],
    createdAt: 'Yesterday, 9:15 AM',
  },
];

export const OrdersScreen: React.FC = () => {
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'PREPARING':
        return 'info';
      case 'READY':
        return 'success';
      case 'COMPLETED':
        return 'neutral';
      default:
        return 'warning';
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={MOCK_ORDERS}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.header}>
              <View>
                <Text style={styles.orderId}>#{item.id}</Text>
                <Text style={styles.time}>{item.createdAt} • {item.orderType}</Text>
              </View>
              <StatusBadge label={item.status} variant={getBadgeVariant(item.status)} />
            </View>

            <View style={styles.itemList}>
              {item.items.map((it, idx) => (
                <Text key={idx} style={styles.itemText}>
                  • {it}
                </Text>
              ))}
            </View>

            <View style={styles.footer}>
              <Text style={styles.totalLabel}>Total Paid</Text>
              <Text style={styles.totalPrice}>\${item.totalAmount.toFixed(2)}</Text>
            </View>
          </Card>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  orderId: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  time: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemList: {
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    gap: 4,
  },
  itemText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  totalLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  totalPrice: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
});
