/**
 * notificationStore.js — Real-time Notification Store
 * Live notifications arrive through Socket.io.
 * Zustand-free — simple JS store with listeners
 */

import { io } from "socket.io-client";
import api from "../services/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5002";

// ── State ─────────────────────────────────────────────────────────────────────
let socket = null;
let notifications = [];
let listeners = new Set();
let unreadCount = 0;
let latestNotificationId = null;
let notificationSequence = 0;
let hasLoadedInitialNotifications = false;

function notify() {
  listeners.forEach((fn) => fn({ notifications, unreadCount, latestNotificationId }));
}

function getCurrentPanel() {
  if (typeof window === "undefined") return "admin";

  const hostname = window.location.hostname;
  if (hostname.startsWith("erp.")) return "employee";
  if (hostname.startsWith("admin.")) return "admin";

  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.role === "employee" ? "employee" : "admin";
  } catch {
    return "admin";
  }
}

function isForCurrentPanel(notification = {}) {
  const panel = getCurrentPanel();
  const recipientType = notification.recipientType || notification.recipient_type || notification.audience;
  const link = String(notification.link || "");

  if (recipientType && recipientType !== panel) return false;
  if (panel === "admin" && link.startsWith("/employee")) return false;
  if (panel === "employee" && link.startsWith("/admin")) return false;

  return true;
}

function emitBrowserEvent(name, detail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function createNotification(notification = {}) {
  if (!isForCurrentPanel(notification)) return;

  const id = notification.id || `${Date.now()}-${notificationSequence++}`;
  const notif = {
    id,
    type:      notification.type      || "info",
    title:     notification.title     || "Notification",
    message:   notification.message   || "",
    link:      notification.link      || null,
    read:      Boolean(notification.read),
    createdAt: notification.createdAt || new Date().toISOString(),
    recipientType: notification.recipientType || notification.recipient_type || notification.audience,
    recipientId: notification.recipientId || notification.recipient_id,
  };

  const existingIndex = notifications.findIndex((n) => String(n.id) === String(id));
  if (existingIndex >= 0) {
    notifications = notifications.map((n, index) =>
      index === existingIndex ? { ...n, ...notif } : n
    );
  } else {
    notifications = [notif, ...notifications].slice(0, 50);
  }
  unreadCount = notifications.filter((n) => !n.read).length;
  latestNotificationId = id;
  notify();
  emitBrowserEvent("app:notification", notif);
}

function notifyFromPayload(payload = {}, fallback = {}) {
  createNotification(payload.notification || payload || fallback);
}

function notifyFromExplicitPayload(payload = {}) {
  if (!payload?.notification) return;
  createNotification(payload.notification);
}

function replaceNotifications(nextNotifications = []) {
  notifications = nextNotifications.filter(isForCurrentPanel).slice(0, 50);
  unreadCount = notifications.filter((n) => !n.read).length;
  latestNotificationId = notifications[0]?.id || null;
  notify();
}

// ── Socket Connection ─────────────────────────────────────────────────────────
export function connectNotificationSocket(userId) {
  if (socket) return;

  const token = localStorage.getItem("token");
  if (!token) return;

  socket = io(API_URL, {
    auth: { token },
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    console.log("🔔 Notification socket connected");
    if (userId) socket.emit("join", userId);
  });

  // ── Real-time events ──────────────────────────────────────────────────────
  socket.on("notification", (data) => {
    createNotification(data);
  });

  socket.on("leave:created", (data) => {
    notifyFromPayload(data, {
      type: "leave",
      title: "New leave request",
      message: "A new leave request was submitted.",
      link: "/admin/leaves",
    });
    emitBrowserEvent("leave:created", data);
  });

  socket.on("leave:updated", (data) => {
    notifyFromExplicitPayload(data);
    emitBrowserEvent("leave:updated", data);
  });

  socket.on("leave:deleted", (data) => {
    notifyFromPayload(data, {
      type: "leave",
      title: "Leave request deleted",
      message: "A leave request was deleted.",
      link: "/admin/leaves",
    });
    emitBrowserEvent("leave:deleted", data);
  });

  socket.on("attendance:created", (data) => {
    notifyFromPayload(data, {
      type: "attendance",
      title: "Attendance marked",
      message: "New attendance was marked.",
      link: "/admin/attendance",
    });
    emitBrowserEvent("attendance:updated", data);
  });

  socket.on("attendance:updated", (data) => {
    notifyFromPayload(data, {
      type: "attendance",
      title: "Attendance updated",
      message: "Attendance record was updated.",
      link: "/admin/attendance",
    });
    emitBrowserEvent("attendance:updated", data);
  });

  socket.on("leave_update", (data) => {
    createNotification({
      type:    "leave",
      title:   "Leave Update",
      message: data.message || "A leave request was updated.",
      link:    "/admin/leaves",
    });
  });

  socket.on("attendance_alert", (data) => {
    createNotification({
      type:    "attendance",
      title:   "Attendance Alert",
      message: data.message || "New attendance marked.",
      link:    "/admin/attendance",
    });
    emitBrowserEvent("attendance:updated", data);
  });

  socket.on("new_message", (data) => {
    createNotification({
      type:    "chat",
      title:   "New Message",
      message: data.message || "You have a new message.",
      link:    "/admin/chat/inbox",
    });
  });

  socket.on("disconnect", () => {
    console.log("🔔 Notification socket disconnected");
  });
}

export function disconnectNotificationSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  hasLoadedInitialNotifications = false;
}

export async function loadNotifications() {
  if (hasLoadedInitialNotifications) return;
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await api.get("/notifications");
    const list = res.data?.data ?? res.data;
    if (Array.isArray(list)) {
      replaceNotifications(list);
      hasLoadedInitialNotifications = true;
    }
  } catch (error) {
    console.error("Notifications load failed:", error.response?.data?.message || error.message);
  }
}

// ── Actions ───────────────────────────────────────────────────────────────────
export function addNotification({ type, title, message, link }) {
  createNotification({ type, title, message, link });
}

export function markAllRead() {
  notifications = notifications.map((n) => ({ ...n, read: true }));
  unreadCount   = 0;
  notify();
}

export function markRead(id) {
  notifications = notifications.map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
  unreadCount = notifications.filter((n) => !n.read).length;
  notify();
}

export function clearAll() {
  notifications = [];
  unreadCount   = 0;
  notify();
}

// ── Subscribe for the React hook ──────────────────────────────────────────────
export function subscribeNotifications(fn) {
  listeners.add(fn);
  fn({ notifications, unreadCount, latestNotificationId }); // immediately current state de do
  return () => listeners.delete(fn);
}

export function deleteNotification(id) {
  notifications = notifications.filter((n) => n.id !== id);
  unreadCount = notifications.filter((n) => !n.read).length;
  if (latestNotificationId === id) {
    latestNotificationId = notifications[0]?.id || null;
  }
  notify();

  if (/^\d+$/.test(String(id))) {
    api.delete(`/notifications/${id}`).catch(() => {
      // Local dismissal should still work if the backend route is unavailable.
    });
  }
}

export function getNotifications() {
  return { notifications, unreadCount, latestNotificationId };
}
