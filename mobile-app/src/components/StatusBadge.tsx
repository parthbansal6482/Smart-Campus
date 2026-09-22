import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface StatusBadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  dot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, variant = 'neutral', dot = true }) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0', dot: '#10b981' };
      case 'warning':
        return { bg: '#fffbeb', text: '#92400e', border: '#fde68a', dot: '#f59e0b' };
      case 'danger':
        return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca', dot: '#ef4444' };
      case 'info':
        return { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe', dot: '#3b82f6' };
      default:
        return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0', dot: '#64748b' };
    }
  };

  const c = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      {dot && <View style={[styles.dot, { backgroundColor: c.dot }]} />}
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
