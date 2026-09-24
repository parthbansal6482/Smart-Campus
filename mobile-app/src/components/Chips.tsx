import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { AppText } from './AppText';

interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface ChipsProps<T extends string> {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Scrolls horizontally, bleeding to the screen edges. */
  scroll?: boolean;
}

export function Chips<T extends string>({ options, value, onChange, scroll = true }: ChipsProps<T>) {
  const chips = options.map(option => {
    const active = option.value === value;
    return (
      <Pressable
        key={option.value}
        onPress={() => onChange(option.value)}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        style={[styles.chip, active ? styles.active : styles.inactive]}
      >
        <AppText variant="label" tone={active ? 'onInk' : 'ink2'}>
          {option.label}
        </AppText>
      </Pressable>
    );
  });

  if (!scroll) return <View style={styles.wrap}>{chips}</View>;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.bleed}
      contentContainerStyle={styles.row}
    >
      {chips}
    </ScrollView>
  );
}

interface SegmentedProps<T extends string> {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Two or three mutually exclusive options that share one row, e.g. Pickup / Dine in. */
export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <View style={styles.segmented}>
      {options.map(option => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <AppText variant="label" tone={active ? 'ink' : 'ink3'}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bleed: { marginHorizontal: -spacing.screen },
  row: { paddingHorizontal: spacing.screen, gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  active: { backgroundColor: colors.ink, borderColor: colors.ink },
  inactive: { backgroundColor: colors.surface, borderColor: colors.line },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.sunken,
    borderRadius: radius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.line,
  },
  segment: {
    flex: 1,
    height: 40,
    borderRadius: radius.sm + 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
});
