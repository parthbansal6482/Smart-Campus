import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme';
import { AppText } from './AppText';

interface FieldProps extends TextInputProps {
  label?: string;
  hint?: string;
  leading?: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, hint, leading, style, multiline, ...props }) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && (
        <AppText variant="label" style={styles.label}>
          {label}
        </AppText>
      )}
      <View style={[styles.control, multiline && styles.multiline, focused && styles.focused]}>
        {leading && <View style={styles.leading}>{leading}</View>}
        <TextInput
          {...props}
          multiline={multiline}
          placeholderTextColor={colors.ink4}
          onFocus={e => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          style={[styles.input, multiline && styles.inputMultiline, style]}
        />
      </View>
      {hint && (
        <AppText variant="caption" tone="ink3" style={styles.hint}>
          {hint}
        </AppText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.lg },
  label: { marginBottom: 8 },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    paddingHorizontal: 14,
  },
  focused: { borderColor: colors.ink },
  multiline: { alignItems: 'flex-start', paddingVertical: 12 },
  leading: { marginRight: 10 },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 12,
  },
  inputMultiline: { minHeight: 88, paddingVertical: 0, textAlignVertical: 'top' },
  hint: { marginTop: 6 },
});
