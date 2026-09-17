import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Minus, Plus } from 'lucide-react-native';

export const MenuDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const item = route.params?.item;

  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState<'PICKUP' | 'DINE_IN'>('PICKUP');
  const [loading, setLoading] = useState(false);

  const total = (item?.price || 4.5) * quantity;

  const handlePlaceOrder = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Order Placed! 🍔',
        `Your order for ${quantity}x ${item?.name || 'Item'} has been sent to the kitchen.`,
        [
          {
            text: 'Track Order',
            onPress: () => navigation.navigate('Orders'),
          },
        ]
      );
    }, 600);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.name}>{item?.name || 'Cold Brew Artisan Coffee'}</Text>
        <Text style={styles.desc}>
          {item?.description || 'Freshly made with certified organic campus ingredients.'}
        </Text>
        <Text style={styles.price}>\${(item?.price || 4.5).toFixed(2)}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionLabel}>Order Mode</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, orderType === 'PICKUP' && styles.toggleActive]}
            onPress={() => setOrderType('PICKUP')}
          >
            <Text style={[styles.toggleText, orderType === 'PICKUP' && styles.toggleTextActive]}>
              Counter Pickup
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, orderType === 'DINE_IN' && styles.toggleActive]}
            onPress={() => setOrderType('DINE_IN')}
          >
            <Text style={[styles.toggleText, orderType === 'DINE_IN' && styles.toggleTextActive]}>
              Dine-In
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Quantity</Text>
        <View style={styles.quantityRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Minus size={18} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQuantity(quantity + 1)}
          >
            <Plus size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalAmount}>\${total.toFixed(2)}</Text>
        </View>

        <Button
          title={`Place Order • \$${total.toFixed(2)}`}
          onPress={handlePlaceOrder}
          isLoading={loading}
          style={{ marginTop: spacing.lg }}
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  name: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  desc: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  price: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  sectionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: spacing.borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  toggleText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.primary,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  totalLabel: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  totalAmount: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
});
