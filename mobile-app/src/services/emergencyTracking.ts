import * as Location from 'expo-location';
import { medicalService } from './medical.service';

// Foreground GPS sharing for an active emergency.
// TODO: background updates (expo-task-manager), battery-aware intervals,
// and offline queueing. The screen stops tracking when the incident ends.

const PING_INTERVAL_MS = 5_000;

let subscription: Location.LocationSubscription | null = null;

export const emergencyTracking = {
  isTracking: () => subscription !== null,

  start: async (emergencyId: string): Promise<boolean> => {
    if (subscription) return true;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return false;

    subscription = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: PING_INTERVAL_MS, distanceInterval: 5 },
      pos => {
        medicalService
          .sendEmergencyLocation(emergencyId, {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracyM: pos.coords.accuracy ?? undefined,
          })
          .catch(() => {
            // A dropped ping is fine; the next fix replaces it.
          });
      }
    );
    return true;
  },

  stop: () => {
    subscription?.remove();
    subscription = null;
  },
};
