/**
 * Firebase Cloud Messaging (FCM) & Real-Time Notification Engine for SIET
 * Handles browser push registration, FCM tokens, background service worker sync,
 * and Firestore real-time in-app approval/rejection notifications.
 */

import { app, db } from "@/lib/firebase";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  Messaging,
} from "firebase/messaging";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  writeBatch,
  getDocs,
} from "firebase/firestore";
import { toast } from "sonner";
import { setCookie, getStoredCookiePreferences } from "@/lib/cookies";

export type NotificationType =
  | "approval"
  | "rejection"
  | "forwarded"
  | "submitted"
  | "reminder"
  | "system";

export interface InAppNotification {
  id: string;
  recipientUid: string;
  title: string;
  body: string;
  type: NotificationType;
  leaveId?: string;
  read: boolean;
  createdAt: any;
  metadata?: {
    actorName?: string;
    actorRole?: string;
    leaveType?: string;
    startDate?: string;
    endDate?: string;
    remarks?: string;
  };
}

export interface SendNotificationPayload {
  recipientUid: string;
  title: string;
  body: string;
  type: NotificationType;
  leaveId?: string;
  metadata?: InAppNotification["metadata"];
}

let messagingInstance: Messaging | null = null;

/**
 * Lazily initialize and return Firebase Messaging if supported
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (messagingInstance) return messagingInstance;
  try {
    const supported = await isSupported();
    if (supported && typeof window !== "undefined" && "serviceWorker" in navigator) {
      messagingInstance = getMessaging(app);
      return messagingInstance;
    }
  } catch (err) {
    console.warn("Firebase Messaging is not supported in this runtime environment:", err);
  }
  return null;
}

/**
 * Register Service Worker for FCM Background Push
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
    });
    return registration;
  } catch (err) {
    console.warn("ServiceWorker registration failed:", err);
    return null;
  }
}

/**
 * Request notification permissions and register FCM token
 */
export async function requestNotificationPermission(
  userId: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { success: false, error: "Browser does not support notifications." };
  }

  // Check Cookie consent
  const consent = getStoredCookiePreferences();
  if (consent && !consent.notifications) {
    return {
      success: false,
      error: "Notification cookies disabled in your privacy preferences.",
    };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setCookie("siet_push_permission", "denied", 30);
      return { success: false, error: "Notification permission was denied." };
    }

    setCookie("siet_push_permission", "granted", 365);

    // Get FCM instance
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      // In environments where FCM ServiceWorker is not yet wired or VAPID is absent,
      // permission is granted for native HTML5 notifications
      return { success: true };
    }

    const swRegistration = await registerServiceWorker();

    const vapidKey =
      import.meta.env.VITE_FIREBASE_VAPID_KEY ||
      // Standard public fallback demo/development VAPID key
      undefined;

    let token = "";
    try {
      token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: swRegistration || undefined,
      });
    } catch (tokenErr) {
      console.warn("FCM getToken deferred (check VAPID key in .env):", tokenErr);
    }

    if (token) {
      // Persist token in Firestore
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        fcmToken: token,
        fcmTokens: arrayUnion(token),
        "notificationSettings.pushEnabled": true,
        "notificationSettings.updatedAt": serverTimestamp(),
      });
    }

    return { success: true, token };
  } catch (err: any) {
    console.error("Error requesting notification permission:", err);
    return { success: false, error: err.message || "Failed to initialize notifications." };
  }
}

/**
 * Initialize Foreground FCM Push Listener
 */
export async function initForegroundNotificationListener(): Promise<() => void> {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return () => {};

  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      const title = payload.notification?.title || payload.data?.title || "SIET Leave Alert";
      const body = payload.notification?.body || payload.data?.body || "New leave update received.";

      // Display dynamic toast
      toast.info(title, {
        description: body,
        duration: 7000,
        action: payload.data?.leaveId
          ? {
              label: "View Request",
              onClick: () => {
                window.location.href = `/student/my-leaves`;
              },
            }
          : undefined,
      });

      // Show native Notification if page is unfocused
      if (document.hidden && Notification.permission === "granted") {
        try {
          new Notification(title, {
            body,
            icon: "/siet-emblem.png",
            badge: "/favicon.svg",
          });
        } catch (e) {
          console.warn("Native foreground alert display bypassed:", e);
        }
      }
    });

    return unsubscribe;
  } catch (err) {
    console.warn("Foreground message handler listener skipped:", err);
    return () => {};
  }
}

/**
 * Broadcast and log an official leave status notification in Firestore
 */
export async function sendLeaveNotification(payload: SendNotificationPayload): Promise<void> {
  try {
    const notificationsCol = collection(db, "notifications");
    await addDoc(notificationsCol, {
      recipientUid: payload.recipientUid,
      title: payload.title,
      body: payload.body,
      type: payload.type,
      leaveId: payload.leaveId || null,
      metadata: payload.metadata || {},
      read: false,
      createdAt: serverTimestamp(),
    });

    // Also trigger native browser notification if user is logged into this browser
    if (Notification.permission === "granted" && document.hidden) {
      new Notification(payload.title, {
        body: payload.body,
        icon: "/siet-emblem.png",
        badge: "/favicon.svg",
      });
    }
  } catch (err) {
    console.error("Failed to write in-app notification:", err);
  }
}

/**
 * Real-time subscription to user notifications
 */
export function subscribeToUserNotifications(
  userId: string,
  callback: (notifications: InAppNotification[]) => void
): () => void {
  try {
    const q = query(
      collection(db, "notifications"),
      where("recipientUid", "==", userId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifications: InAppNotification[] = [];
        snapshot.forEach((doc) => {
          notifications.push({
            id: doc.id,
            ...doc.data(),
          } as InAppNotification);
        });
        callback(notifications);
      },
      (err) => {
        console.warn("Notifications subscription index warning:", err);
        // Fallback without ordering if composite index is pending
        const simpleQ = query(
          collection(db, "notifications"),
          where("recipientUid", "==", userId)
        );
        onSnapshot(simpleQ, (s) => {
          const list: InAppNotification[] = [];
          s.forEach((d) => list.push({ id: d.id, ...d.data() } as InAppNotification));
          // Sort client side
          list.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
          });
          callback(list);
        });
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error("Failed to subscribe to notifications:", err);
    return () => {};
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notifRef = doc(db, "notifications", notificationId);
    await updateDoc(notifRef, {
      read: true,
      readAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to mark notification as read:", err);
  }
}

/**
 * Mark all user notifications as read
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const q = query(
      collection(db, "notifications"),
      where("recipientUid", "==", userId),
      where("read", "==", false)
    );
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.update(d.ref, { read: true, readAt: serverTimestamp() });
    });
    await batch.commit();
  } catch (err) {
    console.error("Failed to mark all notifications as read:", err);
  }
}
