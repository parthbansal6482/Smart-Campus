import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { AuthNavigator } from './AuthNavigator';
import { BottomTabNavigator } from './BottomTabNavigator';
import { BookRoomScreen } from '../screens/BookRoomScreen';
import { EmergencyScreen } from '../screens/EmergencyScreen';
import { MenuDetailScreen } from '../screens/MenuDetailScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { EmergencyFab } from '../components/EmergencyFab';
import { useAuthStore } from '../store/authStore';
import { colors, typography } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <View style={styles.container}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: { fontWeight: typography.weights.bold },
          headerTintColor: colors.textPrimary,
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={BottomTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="BookRoom"
              component={BookRoomScreen}
              options={{ title: 'Reserve Classroom' }}
            />
            <Stack.Screen
              name="MenuDetail"
              component={MenuDetailScreen}
              options={{ title: 'Menu Item' }}
            />
            <Stack.Screen
              name="Orders"
              component={OrdersScreen}
              options={{ title: 'My Food Orders' }}
            />
            <Stack.Screen
              name="EmergencyModal"
              component={EmergencyScreen}
              options={{
                presentation: 'fullScreenModal',
                headerShown: false,
              }}
            />
          </>
        )}
      </Stack.Navigator>

      {/* Always-accessible Floating SOS button for authenticated students & faculty */}
      {isAuthenticated && <EmergencyFab />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
