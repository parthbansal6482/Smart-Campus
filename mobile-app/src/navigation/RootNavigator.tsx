import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { AuthNavigator } from './AuthNavigator';
import { BottomTabNavigator } from './BottomTabNavigator';
import { BookRoomScreen } from '../screens/BookRoomScreen';
import { EmergencyScreen } from '../screens/EmergencyScreen';
import { MedicineStoreScreen } from '../screens/MedicineStoreScreen';
import { TalkToStaffScreen } from '../screens/TalkToStaffScreen';
import { MedicalCenterInfoScreen } from '../screens/MedicalCenterInfoScreen';
import { MenuDetailScreen } from '../screens/MenuDetailScreen';
import { CartScreen } from '../screens/CartScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { useAuthStore } from '../store/authStore';
import { colors, fonts } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.canvas },
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
        headerTintColor: colors.ink,
        headerBackTitleVisible: false,
        contentStyle: { backgroundColor: colors.canvas },
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="Main" component={BottomTabNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="BookRoom" component={BookRoomScreen} options={{ title: 'Book a room' }} />
          <Stack.Screen name="MedicineStore" component={MedicineStoreScreen} options={{ title: 'Pharmacy' }} />
          <Stack.Screen name="TalkToStaff" component={TalkToStaffScreen} options={{ title: 'Talk to a nurse' }} />
          <Stack.Screen name="MedicalCenterInfo" component={MedicalCenterInfoScreen} options={{ title: 'Medical centre' }} />
          <Stack.Screen name="MenuDetail" component={MenuDetailScreen} options={{ title: '' }} />
          <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Your order' }} />
          <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: 'Orders' }} />
          <Stack.Screen
            name="EmergencyModal"
            component={EmergencyScreen}
            options={{ presentation: 'fullScreenModal', headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
