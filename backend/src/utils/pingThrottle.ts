// Minimal per-key throttle for high-frequency streams (e.g. GPS pings). In
// memory, so it is per server process — enough to stop a misbehaving client
// from flooding the database, not a global rate limit.
export class PingThrottle {
  private lastSeen = new Map<string, number>();

  constructor(private readonly minIntervalMs: number) {}

  /** Returns true if an event for `key` is allowed now, and records it. */
  tryAcquire(key: string, now = Date.now()): boolean {
    const last = this.lastSeen.get(key);
    if (last !== undefined && now - last < this.minIntervalMs) return false;
    this.lastSeen.set(key, now);
    return true;
  }

  /** Forget a key, e.g. once its emergency is closed. */
  release(key: string): void {
    this.lastSeen.delete(key);
  }
}
