import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface StatusBadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, variant = 'neutral' }) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: colors.pastelMint, text: colors.pastelMintDark };
      case 'warning':
        return { bg: colors.pastelAmber, text: colors.pastelAmberDark };
      case 'danger':
        return { bg: colors.emergencyLight, text: colors.emergencyDark };
      case 'info':
        return { bg: colors.pastelBlue, text: colors.pastelBlueDark };
      default:
        return { bg: colors.borderLight, text: colors.textSecondary };
    }
  };

  const styleColors = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: styleColors.bg }]}>
      <Text style={[styles.text, { color: styleColors.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: spacing.borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
  },
});
