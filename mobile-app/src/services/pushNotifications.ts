import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { api } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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
