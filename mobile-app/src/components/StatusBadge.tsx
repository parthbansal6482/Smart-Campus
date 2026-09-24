import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Tone, toneColors } from '../theme';
import { AppText } from './AppText';

interface StatusBadgeProps {
  label: string;
  tone?: Tone;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, tone = 'neutral' }) => {
  const c = toneColors[tone];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <View style={[styles.dot, { backgroundColor: c.fg }]} />
      <AppText variant="micro" style={{ color: c.fg }}>
        {label}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
