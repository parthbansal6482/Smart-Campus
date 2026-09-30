import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { api } from './api';

// Expo Go (SDK 53+) no longer supports remote push, and merely importing
// expo-notifications there throws at module load. So the module is required
// lazily, and only in a development/production build.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

type NotificationsModule = typeof import('expo-notifications');
let notifications: NotificationsModule | null = null;

const getNotifications = (): NotificationsModule | null => {
  if (isExpoGo) return null;
  if (!notifications) {
    notifications = require('expo-notifications') as NotificationsModule;
    notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
  return notifications;
};

/**
 * Requests permission, obtains an Expo push token for this device, and saves
 * it to the backend. Safe to call on every app start / login — it's a no-op
 * (besides re-saving the same token) if permission was already granted.
 * Push tokens don't exist on simulators/emulators, so this silently gives up
 * there rather than throwing.
 */
export const registerForPushNotifications = async (): Promise<void> => {
  if (!Device.isDevice) {
    return;
  }

  try {
    const Notifications = getNotifications();
    if (!Notifications) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') {
      return;
    }

    // Outside of Expo Go, getExpoPushTokenAsync needs the EAS projectId to
    // know which push credentials to mint a token against; Expo Go fills
    // this in automatically so it's fine for it to be undefined there.
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    await api.put('/users/me/push-token', { expoPushToken });
  } catch {
    // Best-effort — an emergency/order alert simply won't reach this device
    // over push, but the rest of the app must keep working.
  }
};

/** Clears the device's push token registration server-side, e.g. on logout. */
export const unregisterPushNotifications = async (): Promise<void> => {
  try {
    await api.put('/users/me/push-token', { expoPushToken: null });
  } catch {
    // Best-effort — nothing meaningful to recover from on logout.
  }
};
