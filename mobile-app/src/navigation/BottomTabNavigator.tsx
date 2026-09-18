import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types';
import { HomeScreen } from '../screens/HomeScreen';
import { ClassroomsScreen } from '../screens/ClassroomsScreen';
import { MedicalHelpScreen } from '../screens/MedicalHelpScreen';
import { CafeteriaScreen } from '../screens/CafeteriaScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors, typography } from '../theme';
import { Home, GraduationCap, HeartPulse, UtensilsCrossed, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const BottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        },
        headerTitleStyle: {
          fontWeight: typography.weights.bold,
          fontSize: typography.sizes.lg,
          color: colors.textPrimary,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderLight,
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: typography.sizes.xs,
          fontWeight: typography.weights.medium,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'Campus Feed',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ClassroomsTab"
        component={ClassroomsScreen}
        options={{
          title: 'Classrooms & Labs',
          tabBarLabel: 'Classrooms',
          tabBarIcon: ({ color, size }) => <GraduationCap color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="MedicalHelpTab"
        component={MedicalHelpScreen}
        options={{
          title: 'Medical Help',
          tabBarLabel: 'Medical',
          tabBarIcon: ({ color, size }) => <HeartPulse color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="CafeteriaTab"
        component={CafeteriaScreen}
        options={{
          title: 'Campus Cafeteria',
          tabBarLabel: 'Cafeteria',
          tabBarIcon: ({ color, size }) => <UtensilsCrossed color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'My Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};
