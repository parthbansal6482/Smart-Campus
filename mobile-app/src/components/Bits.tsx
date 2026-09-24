import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Minus, Plus, LucideIcon } from 'lucide-react-native';
import { colors, radius, spacing } from '../theme';
import { AppText } from './AppText';

/** Indian food-labelling mark: green square for veg, red for non-veg. */
export const VegMark: React.FC<{ isVeg: boolean }> = ({ isVeg }) => {
  const color = isVeg ? colors.ok : colors.critical;
  return (
    <View
      accessibilityLabel={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
      style={[styles.vegBox, { borderColor: color }]}
    >
      <View style={[styles.vegDot, { backgroundColor: color }]} />
    </View>
  );
};

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  compact?: boolean;
}

export const Stepper: React.FC<StepperProps> = ({ value, onChange, min = 0, max = 20, compact }) => {
  const size = compact ? 32 : 40;
  return (
    <View style={[styles.stepper, { height: size + 2 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        disabled={value <= min}
        onPress={() => onChange(Math.max(min, value - 1))}
        style={[styles.stepBtn, { width: size, height: size }, value <= min && styles.stepDisabled]}
      >
        <Minus size={16} color={colors.ink} />
      </Pressable>
      <AppText variant="bodyMedium" style={styles.stepValue}>
        {value}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        disabled={value >= max}
        onPress={() => onChange(Math.min(max, value + 1))}
        style={[styles.stepBtn, { width: size, height: size }, value >= max && styles.stepDisabled]}
      >
        <Plus size={16} color={colors.ink} />
      </Pressable>
    </View>
  );
};

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => (
  <View style={styles.empty}>
    <View style={styles.emptyIcon}>
      <Icon size={20} color={colors.ink3} strokeWidth={1.75} />
    </View>
    <AppText variant="subheading" align="center">
      {title}
    </AppText>
    {description && (
      <AppText variant="callout" tone="ink3" align="center" style={styles.emptyText}>
        {description}
      </AppText>
    )}
    {action && <View style={styles.emptyAction}>{action}</View>}
  </View>
);

/** Thin horizontal progress through a fixed sequence of steps. */
export const StepProgress: React.FC<{ steps: number; current: number; tone?: 'ink' | 'critical' }> = ({
  steps,
  current,
  tone = 'ink',
}) => (
  <View style={styles.progress}>
    {Array.from({ length: steps }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.progressStep,
          i <= current && { backgroundColor: i === steps - 1 ? colors.ok : colors[tone] },
        ]}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  vegBox: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegDot: { width: 6, height: 6, borderRadius: 3 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  stepBtn: { alignItems: 'center', justifyContent: 'center' },
  stepDisabled: { opacity: 0.3 },
  stepValue: { minWidth: 24, textAlign: 'center' },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl + 8, paddingHorizontal: spacing.xxl },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyText: { marginTop: 6 },
  emptyAction: { marginTop: spacing.xl, alignSelf: 'stretch' },
  progress: { flexDirection: 'row', gap: 4 },
  progressStep: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.line },
});
