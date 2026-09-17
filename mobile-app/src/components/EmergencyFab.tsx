import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { AlertCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

export const EmergencyFab: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => navigation.navigate('EmergencyModal')}
      style={styles.fab}
    >
      <View style={styles.pulseContainer}>
        <AlertCircle color="#ffffff" size={24} strokeWidth={2.5} />
        <Text style={styles.text}>SOS</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 85,
    right: 20,
    backgroundColor: colors.emergency,
    borderRadius: spacing.borderRadius.full,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.emergency,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
    zIndex: 999,
  },
  pulseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    color: '#ffffff',
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
    letterSpacing: 0.5,
  },
});
