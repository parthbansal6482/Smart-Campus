import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, spacing } from '../theme';
import { AppText } from './AppText';

interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
}

/** A row inside a grouped list. Hairline dividers, 56pt minimum touch height. */
export const ListItem: React.FC<ListItemProps> = ({ title, subtitle, icon, trailing, onPress, last }) => (
  <Pressable
    onPress={onPress}
    disabled={!onPress}
    accessibilityRole={onPress ? 'button' : undefined}
    style={({ pressed }) => [styles.row, pressed && onPress && styles.pressed]}
  >
    {icon && <View style={styles.icon}>{icon}</View>}
    <View style={[styles.body, !last && styles.divider]}>
      <View style={styles.text}>
        <AppText variant="bodyMedium">{title}</AppText>
        {subtitle && (
          <AppText variant="caption" tone="ink3" style={styles.subtitle}>
            {subtitle}
          </AppText>
        )}
      </View>
      {trailing}
      {onPress && !trailing && <ChevronRight size={18} color={colors.ink4} />}
    </View>
  </Pressable>
);

export const ListGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.group}>{children}</View>
);

const styles = StyleSheet.create({
  group: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.lg,
    minHeight: 56,
  },
  pressed: { backgroundColor: colors.canvas },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.sunken,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    paddingRight: spacing.lg,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.lineStrong,
  },
  text: { flex: 1 },
  subtitle: { marginTop: 2 },
});
