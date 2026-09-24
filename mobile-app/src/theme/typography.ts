import { TextStyle } from 'react-native';

export const fonts = {
  serif: 'InstrumentSerif_400Regular',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
};

export const type = {
  display: { fontFamily: fonts.serif, fontSize: 40, lineHeight: 44, letterSpacing: -0.2 },
  title: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 34 },
  heading: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 28 },
  subheading: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22 },
  callout: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  micro: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14, letterSpacing: 0.2 },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;
