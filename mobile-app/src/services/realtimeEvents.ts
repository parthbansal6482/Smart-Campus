type Handler = (...args: any[]) => void;

/**
 * Minimal pub/sub so screens can react to live socket events without
 * holding a reference to the socket itself (which is torn down and
 * recreated across login/logout). socket.ts re-emits backend events here;
 * screens subscribe with `on` and unsubscribe using the returned function.
 */
class RealtimeEvents {
  private handlers: Record<string, Set<Handler>> = {};

  on(event: string, handler: Handler): () => void {
    (this.handlers[event] ??= new Set()).add(handler);
    return () => this.handlers[event]?.delete(handler);
  }

  emit(event: string, ...args: any[]): void {
    this.handlers[event]?.forEach(handler => handler(...args));
  }
}

export const realtimeEvents = new RealtimeEvents();

export const REALTIME_EVENTS = {
  cafeteriaOrdersChanged: 'cafeteria-orders-changed',
  classroomsChanged: 'classrooms-changed',
  medicalChanged: 'medical-changed',
} as const;
