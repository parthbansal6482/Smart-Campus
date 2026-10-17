import { OrderStatus } from '@prisma/client';

/** The kitchen pipeline, in order. CANCELLED sits outside it. */
export const ORDER_FLOW: OrderStatus[] = [
  OrderStatus.PLACED,
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.COLLECTED,
];

export const isFinalStatus = (status: OrderStatus) => status === OrderStatus.COLLECTED || status === OrderStatus.CANCELLED;

/**
 * Orders only move forward through the pipeline (steps may be skipped, e.g. PLACED → PREPARING
 * for a quick item), never backwards. Cancelling is possible until the order is collected.
 */
export const canTransition = (from: OrderStatus, to: OrderStatus): boolean => {
  if (isFinalStatus(from) || from === to) return false;
  if (to === OrderStatus.CANCELLED) return true;
  return ORDER_FLOW.indexOf(to) > ORDER_FLOW.indexOf(from);
};

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** True when `when` falls inside [opensAt, closesAt] (HH:MM, server local time). No hours configured = always open. */
export const isWithinOpeningHours = (when: Date, opensAt?: string, closesAt?: string): boolean => {
  if (!opensAt || !closesAt) return true;
  const minutes = when.getHours() * 60 + when.getMinutes();
  const open = toMinutes(opensAt);
  const close = toMinutes(closesAt);
  // Hours that run past midnight (e.g. 20:00–02:00) wrap around.
  return open <= close ? minutes >= open && minutes <= close : minutes >= open || minutes <= close;
};

/** A pickup slot may be at most a minute in the past (clock skew) and no more than a day ahead. */
export const isValidPickupTime = (pickup: Date, now: Date = new Date()): boolean => {
  const delta = pickup.getTime() - now.getTime();
  return delta >= -60_000 && delta <= 24 * 60 * 60 * 1000;
};

/** Mean of ratings rounded to one decimal; falls back to `fallback` when there are none. */
export const averageRating = (ratings: number[], fallback = 4.5): number =>
  ratings.length === 0 ? fallback : Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
