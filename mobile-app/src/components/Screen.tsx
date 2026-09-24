import React from 'react';
import { RefreshControlProps, ScrollView, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';
import { AppText } from './AppText';

interface ScreenProps {
  /** Large serif page title. Omit on stack screens that already have a native header. */
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  /** Adds top safe-area padding — use on tab screens without a native header. */
  topInset?: boolean;
  /** Extra bottom space so content clears the floating SOS button / sticky bars. */
  bottomSpace?: number;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  contentStyle?: StyleProp<ViewStyle>;
}

export const Screen: React.FC<ScreenProps> = ({
  title,
  eyebrow,
  subtitle,
  headerRight,
  children,
  topInset,
  bottomSpace = 120,
  refreshControl,
  contentStyle,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topInset ? insets.top + spacing.lg : spacing.xl, paddingBottom: bottomSpace },
        contentStyle,
      ]}
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {title && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {eyebrow && (
              <AppText variant="caption" tone="ink3" style={styles.eyebrow}>
                {eyebrow}
              </AppText>
            )}
            <AppText variant="display">{title}</AppText>
            {subtitle && (
              <AppText variant="callout" tone="ink3" style={styles.subtitle}>
                {subtitle}
              </AppText>
            )}
          </View>
          {headerRight}
        </View>
      )}
      {children}
    </ScrollView>
  );
};

/** Small caption that introduces a group of content. */
export const SectionLabel: React.FC<{ children: string; action?: React.ReactNode }> = ({ children, action }) => (
  <View style={styles.section}>
    <AppText variant="label" tone="ink3">
      {children}
    </AppText>
    {action}
  </View>
);

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: spacing.screen },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  headerText: { flex: 1 },
  eyebrow: { marginBottom: 6 },
  subtitle: { marginTop: 6 },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxl + 4,
    marginBottom: spacing.md,
  },
});

/** Bottom action bar that stays above the home indicator. Pair with `bottomSpace` on the Screen. */
export const StickyFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[footerStyles.bar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>{children}</View>
  );
};

const footerStyles = StyleSheet.create({
  bar: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    backgroundColor: colors.canvas,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.lineStrong,
  },
});
