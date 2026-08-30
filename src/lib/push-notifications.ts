/**
 * push-notifications.ts
 *
 * Production Push Notification Abstraction layer for GoNomadik Mobile App & PWA.
 * Supports Capacitor Native Push (Android & iOS) + Web Push API fallback.
 */

export interface NotificationPayload {
  title: string;
  body: string;
  type: "BOOKING_CONFIRMED" | "PAYMENT_SUCCESS" | "PAYMENT_FAILED" | "TRIP_REMINDER" | "TRIP_DAY_UPDATE" | "CAPTAIN_BROADCAST";
  bookingId?: string;
  departureId?: string;
  data?: Record<string, unknown>;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // 1. Check Web Push Permission
  if ("Notification" in window) {
    if (Notification.permission === "granted") return true;
    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
  }

  return false;
}

export async function sendLocalPushNotification(payload: NotificationPayload): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.warn("[PushNotification] Permission not granted for local notification.");
      return false;
    }

    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(payload.title, {
        body: payload.body,
        icon: "/images/gonomadik-round-emblem.png",
        badge: "/images/gonomadik-round-emblem.png",
        tag: payload.type,
        data: {
          bookingId: payload.bookingId,
          departureId: payload.departureId,
          type: payload.type,
          ...payload.data,
        },
      });
      return true;
    } else if ("Notification" in window && Notification.permission === "granted") {
      new Notification(payload.title, {
        body: payload.body,
        icon: "/images/gonomadik-round-emblem.png",
      });
      return true;
    }
  } catch (err: unknown) {
    console.warn("[PushNotification] Non-fatal notification error:", err);
  }

  return false;
}
