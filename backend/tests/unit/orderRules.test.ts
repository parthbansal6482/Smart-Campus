import { describe, it, expect } from 'vitest';
import { OrderStatus } from '@prisma/client';
import { averageRating, canTransition, isValidPickupTime, isWithinOpeningHours } from '../../src/modules/cafeteria/orderRules';

const { PLACED, ACCEPTED, PREPARING, READY, COLLECTED, CANCELLED } = OrderStatus;

describe('canTransition', () => {
  it('moves forward, including skipping steps', () => {
    expect(canTransition(PLACED, ACCEPTED)).toBe(true);
    expect(canTransition(PLACED, PREPARING)).toBe(true);
    expect(canTransition(READY, COLLECTED)).toBe(true);
  });

  it('never moves backward or stays put', () => {
    expect(canTransition(PREPARING, ACCEPTED)).toBe(false);
    expect(canTransition(READY, PLACED)).toBe(false);
    expect(canTransition(PREPARING, PREPARING)).toBe(false);
  });

  it('allows cancelling until collected', () => {
    for (const from of [PLACED, ACCEPTED, PREPARING, READY]) expect(canTransition(from, CANCELLED)).toBe(true);
    expect(canTransition(COLLECTED, CANCELLED)).toBe(false);
  });

  it('treats collected and cancelled as final', () => {
    for (const to of [PLACED, ACCEPTED, READY, COLLECTED]) {
      expect(canTransition(CANCELLED, to)).toBe(false);
      expect(canTransition(COLLECTED, to)).toBe(false);
    }
  });
});

describe('isWithinOpeningHours', () => {
  const at = (h: number, m = 0) => new Date(2026, 9, 12, h, m);

  it('handles hours that run past midnight', () => {
    expect(isWithinOpeningHours(at(23), '20:00', '02:00')).toBe(true);
    expect(isWithinOpeningHours(at(1), '20:00', '02:00')).toBe(true);
    expect(isWithinOpeningHours(at(12), '20:00', '02:00')).toBe(false);
  });

  it('is always open when no hours are configured', () => {
    expect(isWithinOpeningHours(at(3))).toBe(true);
    expect(isWithinOpeningHours(at(3), '08:00')).toBe(true);
  });

  it('includes both boundaries and excludes outside times', () => {
    expect(isWithinOpeningHours(at(8, 0), '08:00', '20:00')).toBe(true);
    expect(isWithinOpeningHours(at(20, 0), '08:00', '20:00')).toBe(true);
    expect(isWithinOpeningHours(at(7, 59), '08:00', '20:00')).toBe(false);
    expect(isWithinOpeningHours(at(20, 1), '08:00', '20:00')).toBe(false);
  });
});

describe('isValidPickupTime', () => {
  const now = new Date('2026-10-12T10:00:00Z');

  it('accepts times from now up to a day ahead', () => {
    expect(isValidPickupTime(new Date('2026-10-12T10:20:00Z'), now)).toBe(true);
    expect(isValidPickupTime(new Date('2026-10-13T10:00:00Z'), now)).toBe(true);
  });

  it('rejects the past and far future, with a minute of clock-skew grace', () => {
    expect(isValidPickupTime(new Date('2026-10-12T09:59:30Z'), now)).toBe(true);
    expect(isValidPickupTime(new Date('2026-10-12T09:00:00Z'), now)).toBe(false);
    expect(isValidPickupTime(new Date('2026-10-13T10:01:00Z'), now)).toBe(false);
  });
});

describe('averageRating', () => {
  it('rounds to one decimal', () => {
    expect(averageRating([5, 4, 4])).toBe(4.3);
    expect(averageRating([5])).toBe(5);
  });

  it('falls back when there are no ratings', () => {
    expect(averageRating([])).toBe(4.5);
    expect(averageRating([], 0)).toBe(0);
  });
});
