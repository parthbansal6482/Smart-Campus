import { create } from 'zustand';
import { CAMPUS } from '../data/mock';
import { CampusSettings } from '../types';
import { settingsService } from '../services/settings.service';
import { notificationService } from '../services/notification.service';
import { realtimeEvents, REALTIME_EVENTS } from '../services/realtimeEvents';

interface CampusState {
  settings: CampusSettings;
  unreadNotifications: number;
}

// Until the server answers (or if it can't be reached) the app falls back to the bundled defaults.
const fallback: CampusSettings = {
  securityPhone: CAMPUS.securityPhone,
  medicalCenterPhone: CAMPUS.medicalCenterPhone,
  medicalCenterLocation: CAMPUS.medicalCenterLocation,
  cafeteriaOpensAt: '',
  cafeteriaClosesAt: '',
  buildingMatchRadiusMeters: 300,
  maxBookingDaysAhead: 30,
};

/** Campus-wide values an admin can change (hotline, kitchen hours...) plus the unread badge count. */
export const useCampusStore = create<CampusState>(() => ({ settings: fallback, unreadNotifications: 0 }));

const loadSettings = () =>
  settingsService
    .get()
    .then(settings => useCampusStore.setState({ settings }))
    .catch(() => undefined);

const loadUnread = () =>
  notificationService
    .list()
    .then(r => useCampusStore.setState({ unreadNotifications: r.unreadCount }))
    .catch(() => undefined);

// The socket announces a change (and also fires once on every (re)connect), so these double as the initial load.
realtimeEvents.on(REALTIME_EVENTS.settingsChanged, loadSettings);
realtimeEvents.on(REALTIME_EVENTS.notificationsChanged, loadUnread);

const to12h = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

/** "8:00 AM – 9:00 PM", or null when the kitchen has no set hours. */
export const kitchenHoursLabel = (s: CampusSettings) =>
  s.cafeteriaOpensAt && s.cafeteriaClosesAt ? `${to12h(s.cafeteriaOpensAt)} – ${to12h(s.cafeteriaClosesAt)}` : null;

/** True when the kitchen is open at `when` (or has no hours set). */
export const isKitchenOpenAt = (s: CampusSettings, when: Date) => {
  if (!s.cafeteriaOpensAt || !s.cafeteriaClosesAt) return true;
  const minutes = when.getHours() * 60 + when.getMinutes();
  const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));
  return minutes >= toMin(s.cafeteriaOpensAt) && minutes <= toMin(s.cafeteriaClosesAt);
};
