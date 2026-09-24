import React from 'react';
import { Text, TextProps } from 'react-native';
import { colors, fonts, type, TypeVariant } from '../theme';

type Tone = 'ink' | 'ink2' | 'ink3' | 'ink4' | 'onInk' | 'critical' | 'ok' | 'warn' | 'info';

interface AppTextProps extends TextProps {
  variant?: TypeVariant;
  tone?: Tone;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  tone = 'ink',
  italic,
  align,
  style,
  ...props
}) => (
  <Text
    {...props}
    style={[
      type[variant],
      { color: colors[tone] },
      italic && { fontFamily: fonts.serifItalic },
      align && { textAlign: align },
      style,
    ]}
  />
);
