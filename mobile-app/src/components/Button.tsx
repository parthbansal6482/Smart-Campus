import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius } from '../theme';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const palette: Record<Variant, { bg: string; pressed: string; fg: 'onInk' | 'ink' | 'ink2'; border?: string }> = {
  primary: { bg: colors.ink, pressed: '#33312D', fg: 'onInk' },
  secondary: { bg: colors.surface, pressed: colors.sunken, fg: 'ink', border: colors.lineStrong },
  ghost: { bg: 'transparent', pressed: colors.sunken, fg: 'ink2' },
  danger: { bg: colors.critical, pressed: colors.criticalPressed, fg: 'onInk' },
};

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  isLoading,
  disabled,
  icon,
  trailing,
  style,
}) => {
  const p = palette[variant];
  const inactive = disabled || isLoading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!isLoading }}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        { backgroundColor: pressed ? p.pressed : p.bg },
        p.border && { borderWidth: 1, borderColor: p.border },
        inactive && !isLoading && styles.disabled,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={p.fg === 'onInk' ? colors.onInk : colors.ink} />
      ) : (
        <View style={styles.content}>
          {icon}
          <AppText variant="label" tone={p.fg} style={size === 'lg' && styles.lgText}>
            {title}
          </AppText>
          {trailing}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  lg: { minHeight: 52 },
  md: { minHeight: 40, paddingHorizontal: 14, borderRadius: radius.sm + 2 },
  lgText: { fontSize: 15 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  disabled: { opacity: 0.45 },
});
