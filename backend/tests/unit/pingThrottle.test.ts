import { describe, it, expect } from 'vitest';
import { PingThrottle } from '../../src/utils/pingThrottle';

describe('PingThrottle', () => {
  it('allows the first event and blocks one inside the interval', () => {
    const t = new PingThrottle(1000);
    expect(t.tryAcquire('a', 0)).toBe(true);
    expect(t.tryAcquire('a', 500)).toBe(false);
  });

  it('allows again once the interval has passed', () => {
    const t = new PingThrottle(1000);
    t.tryAcquire('a', 0);
    expect(t.tryAcquire('a', 1000)).toBe(true);
  });

  it('tracks keys independently', () => {
    const t = new PingThrottle(1000);
    t.tryAcquire('a', 0);
    expect(t.tryAcquire('b', 10)).toBe(true);
  });

  it('does not extend the window when an event is blocked', () => {
    const t = new PingThrottle(1000);
    t.tryAcquire('a', 0);
    t.tryAcquire('a', 900);
    expect(t.tryAcquire('a', 1000)).toBe(true);
  });

  it('release() forgets a key', () => {
    const t = new PingThrottle(1000);
    t.tryAcquire('a', 0);
    t.release('a');
    expect(t.tryAcquire('a', 1)).toBe(true);
  });
});
