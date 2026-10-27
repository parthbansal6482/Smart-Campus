import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { medicalService } from './medical.service';

/**
 * The incident id is persisted because Expo can recreate the JS runtime while
 * a native location task is still running. Responders should keep receiving
 * movement updates until the incident is explicitly closed.
 */
export const EMERGENCY_LOCATION_TASK = 'smart-campus-emergency-location';
const ACTIVE_EMERGENCY_KEY = 'smart_campus_active_emergency_id';
const PING_INTERVAL_MS = 5_000;

type LocationTaskData = { locations?: Location.LocationObject[] };

if (!TaskManager.isTaskDefined(EMERGENCY_LOCATION_TASK)) {
  TaskManager.defineTask<LocationTaskData>(EMERGENCY_LOCATION_TASK, async ({ data, error }) => {
    if (error || !data?.locations?.length) return;

    const emergencyId = await AsyncStorage.getItem(ACTIVE_EMERGENCY_KEY);
    const location = data.locations[data.locations.length - 1];
    if (!emergencyId || !location) return;

    await medicalService
      .sendEmergencyLocation(emergencyId, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracyM: location.coords.accuracy ?? undefined,
      })
      .catch(() => undefined);
  });
}

let foregroundSubscription: Location.LocationSubscription | null = null;
let backgroundRunning = false;

const sendFix = (emergencyId: string, location: Location.LocationObject) =>
  medicalService
    .sendEmergencyLocation(emergencyId, {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracyM: location.coords.accuracy ?? undefined,
    })
    .catch(() => undefined);

const startForegroundFallback = async (emergencyId: string) => {
  foregroundSubscription = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, timeInterval: PING_INTERVAL_MS, distanceInterval: 5 },
    location => void sendFix(emergencyId, location)
  );
};

export const emergencyTracking = {
  isTracking: () => foregroundSubscription !== null || backgroundRunning,

  start: async (emergencyId: string): Promise<boolean> => {
    if (emergencyTracking.isTracking()) return true;

    const foreground = await Location.requestForegroundPermissionsAsync();
    if (foreground.status !== 'granted') return false;

    await AsyncStorage.setItem(ACTIVE_EMERGENCY_KEY, emergencyId);

    // Background permission is intentionally best-effort. If the user only
    // grants foreground access, the alert still receives live fixes while the
    // app is visible instead of failing completely.
    try {
      const background = await Location.requestBackgroundPermissionsAsync();
      if (background.status === 'granted') {
        await Location.startLocationUpdatesAsync(EMERGENCY_LOCATION_TASK, {
          accuracy: Location.Accuracy.High,
          timeInterval: PING_INTERVAL_MS,
          distanceInterval: 5,
          pausesUpdatesAutomatically: false,
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: 'Emergency location sharing is active',
            notificationBody: 'Campus responders can see your latest location.',
            notificationColor: '#B42318',
          },
        });
        backgroundRunning = true;
        return true;
      }
    } catch {
      // Fall through to foreground tracking when background updates are not
      // supported by the current build or permission state.
    }

    await startForegroundFallback(emergencyId);
    return true;
  },

  /** Reattaches tracking after app restart or a recreated JS runtime. */
  resume: async (knownEmergencyId?: string): Promise<boolean> => {
    const emergencyId = knownEmergencyId ?? (await AsyncStorage.getItem(ACTIVE_EMERGENCY_KEY));
    if (knownEmergencyId) await AsyncStorage.setItem(ACTIVE_EMERGENCY_KEY, knownEmergencyId);
    if (!emergencyId) return false;
    try {
      if (await Location.hasStartedLocationUpdatesAsync(EMERGENCY_LOCATION_TASK)) {
        backgroundRunning = true;
        return true;
      }
    } catch {
      // The native task API may be unavailable in a simulator or Expo Go.
    }
    return emergencyTracking.start(emergencyId);
  },

  stop: async () => {
    foregroundSubscription?.remove();
    foregroundSubscription = null;
    let nativeTaskRunning = false;
    try {
      nativeTaskRunning = await Location.hasStartedLocationUpdatesAsync(EMERGENCY_LOCATION_TASK);
    } catch {
      // Nothing to stop when the native location module is unavailable.
    }
    if (backgroundRunning || nativeTaskRunning) {
      await Location.stopLocationUpdatesAsync(EMERGENCY_LOCATION_TASK).catch(() => undefined);
    }
    backgroundRunning = false;
    await AsyncStorage.removeItem(ACTIVE_EMERGENCY_KEY);
  },
};
