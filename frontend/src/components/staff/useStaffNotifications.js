import { useEffect, useRef, useState } from "react";
import { useNotification } from "../../context/NotificationContext";

const STORAGE_KEY = "staff_notifications";
const MAX_NOTIFICATIONS = 50;
const DEFAULT_MESSAGE = "You have a visitor waiting for you";

function loadSavedNotifications() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved)
      ? saved.filter((item) => item?.type === "appointment")
      : [];
  } catch {
    return [];
  }
}

export default function useStaffNotifications(onIncoming) {
  const { subscribeToForegroundMessages } = useNotification();
  const [notifications, setNotifications] = useState(loadSavedNotifications);
  const onIncomingRef = useRef(onIncoming);

  useEffect(() => {
    onIncomingRef.current = onIncoming;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error("Failed to save notifications:", error);
    }
  }, [notifications]);

  useEffect(() => {
    if (!subscribeToForegroundMessages) return undefined;
    let unsubscribe = null;
    let isCancelled = false;

    const handleMessage = ({ notification, data }) => {
      const message = notification?.body || DEFAULT_MESSAGE;
      const entry = {
        id: Date.now(),
        message,
        type: "appointment",
        read: false,
        timestamp: new Date().toISOString(),
        data,
      };
      setNotifications((prev) => [entry, ...prev].slice(0, MAX_NOTIFICATIONS));
      onIncomingRef.current?.(message);
    };

    const keepUnsubscribe = (callback) => {
      if (typeof callback !== "function") return;
      if (isCancelled) callback();
      else unsubscribe = callback;
    };

    void Promise.resolve(subscribeToForegroundMessages(handleMessage)).then(
      keepUnsubscribe,
    );

    return () => {
      isCancelled = true;
      unsubscribe?.();
    };
  }, [subscribeToForegroundMessages]);

  const markRead = (id) =>
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  const dismiss = (id) =>
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  const clearAll = () => setNotifications([]);

  return { notifications, markRead, dismiss, clearAll };
}
