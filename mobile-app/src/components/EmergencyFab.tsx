import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts, radius } from '../theme';
import { RootStackParamList } from '../types';
import { AppText } from './AppText';

/** Always-available SOS button, sitting just above the tab bar in the thumb zone. */
export const EmergencyFab: React.FC<{ bottom: number }> = ({ bottom }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Pressable
      onPress={() => navigation.navigate('EmergencyModal')}
      accessibilityRole="button"
      accessibilityLabel="Emergency SOS"
      accessibilityHint="Opens the emergency screen to request medical help"
      style={({ pressed }) => [
        styles.fab,
        { bottom },
        pressed && { backgroundColor: colors.criticalPressed },
      ]}
    >
      <AppText variant="label" tone="onInk" style={styles.text}>
        SOS
      </AppText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: radius.full,
    backgroundColor: colors.critical,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.canvas,
    shadowColor: '#1A1917',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 50,
  },
  text: { fontFamily: fonts.semibold, fontSize: 15, letterSpacing: 1 },
});
