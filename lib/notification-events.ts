// lib/notification-events.ts
type NotificationEventType = 'refresh' | 'countUpdated';

class NotificationEventEmitter {
  private listeners: Map<NotificationEventType, (() => void)[]> = new Map();

  on(event: NotificationEventType, callback: () => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: NotificationEventType, callback: () => void) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: NotificationEventType) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback());
    }
  }
}

export const notificationEvents = new NotificationEventEmitter();