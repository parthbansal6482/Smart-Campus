import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, DoorOpen, HeartPulse, UtensilsCrossed, CircleUser } from 'lucide-react-native';
import { MainTabParamList } from '../types';
import { HomeScreen } from '../screens/HomeScreen';
import { ClassroomsScreen } from '../screens/ClassroomsScreen';
import { MedicalHelpScreen } from '../screens/MedicalHelpScreen';
import { CafeteriaScreen } from '../screens/CafeteriaScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { EmergencyFab } from '../components/EmergencyFab';
import { colors, fonts } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_BAR_HEIGHT = 56;

export const BottomTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <View style={styles.container}>
      <Tab.Navigator
        sceneContainerStyle={{ backgroundColor: colors.canvas }}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.ink,
          tabBarInactiveTintColor: colors.ink4,
          tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11, marginTop: -2 },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.line,
            borderTopWidth: StyleSheet.hairlineWidth,
            height: TAB_BAR_HEIGHT + bottomInset,
            paddingTop: 6,
            paddingBottom: bottomInset,
            elevation: 0,
          },
        }}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color }) => <Home color={color} size={22} strokeWidth={1.75} />,
          }}
        />
        <Tab.Screen
          name="ClassroomsTab"
          component={ClassroomsScreen}
          options={{
            tabBarLabel: 'Rooms',
            tabBarIcon: ({ color }) => <DoorOpen color={color} size={22} strokeWidth={1.75} />,
          }}
        />
        <Tab.Screen
          name="MedicalHelpTab"
          component={MedicalHelpScreen}
          options={{
            tabBarLabel: 'Health',
            tabBarIcon: ({ color }) => <HeartPulse color={color} size={22} strokeWidth={1.75} />,
          }}
        />
        <Tab.Screen
          name="CafeteriaTab"
          component={CafeteriaScreen}
          options={{
            tabBarLabel: 'Food',
            tabBarIcon: ({ color }) => <UtensilsCrossed color={color} size={22} strokeWidth={1.75} />,
          }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileScreen}
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color }) => <CircleUser color={color} size={22} strokeWidth={1.75} />,
          }}
        />
      </Tab.Navigator>

      <EmergencyFab bottom={TAB_BAR_HEIGHT + bottomInset + 16} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
});
