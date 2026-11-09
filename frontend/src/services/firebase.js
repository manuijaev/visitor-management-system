import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

let messagingInstance = null;
let cachedVapidKey = null;

async function getVapidKey() {
  if (cachedVapidKey) return cachedVapidKey;

  try {
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
    const response = await fetch(`${baseUrl}/vapid-public-key/`);
    if (response.ok) {
      const data = await response.json();
      if (data.vapid_public_key) {
        cachedVapidKey = data.vapid_public_key;
        return cachedVapidKey;
      }
    }
  } catch (e) {
    console.warn("Failed to fetch VAPID key from backend:", e);
  }

  cachedVapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  return cachedVapidKey;
}

async function getMessagingInstance() {
  const supported = await isSupported();
  if (!supported || !("Notification" in window)) return null;
  if (!messagingInstance) {
    messagingInstance = getMessaging(app);
  }
  return messagingInstance;
}

export async function requestFcmToken() {
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const vapidKey = await getVapidKey();
  if (!vapidKey) {
    throw new Error("Missing VAPID key");
  }

  let registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    registration = await navigator.serviceWorker.register("/sw.js");
  }

  return getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });
}

export async function listenForForegroundMessages(onNotification) {
  const messaging = await getMessagingInstance();
  if (!messaging || typeof onNotification !== "function") return () => {};
  return onMessage(messaging, (payload) => {
    onNotification(payload);
  });
}
