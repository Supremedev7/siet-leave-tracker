/**
 * Service Worker for SIET Academic Portal - Firebase Cloud Messaging (FCM)
 * Handles background push notifications, badge updates, and click routing.
 */

/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyCdgmz1NV1elxn06lkysIczw3nTwCDABlo",
  authDomain: "siet-84c4a.firebaseapp.com",
  projectId: "siet-84c4a",
  storageBucket: "siet-84c4a.firebasestorage.app",
  messagingSenderId: "38709053152",
  appId: "1:38709053152:web:a82b78a383a6dbc0d5f285",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background notification reception
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Background notification received:", payload);

  const title =
    payload.notification?.title ||
    payload.data?.title ||
    "SIET Leave Portal Alert";

  const body =
    payload.notification?.body ||
    payload.data?.body ||
    "You have an update regarding your leave application.";

  const options = {
    body,
    icon: "/siet-emblem.png",
    badge: "/favicon.svg",
    vibrate: [200, 100, 200],
    data: {
      url: payload.data?.url || "/student/my-leaves",
      leaveId: payload.data?.leaveId,
    },
    actions: [
      {
        action: "view",
        title: "View Details",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  };

  return self.registration.showNotification(title, options);
});

// Handle notification interaction click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if already open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
