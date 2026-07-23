/**
 * useNotifications — React hook for real-time notifications
 *
 * Usage:
 *   const { notifications, unreadCount, markAllRead, markRead } = useNotifications();
 */
import { useEffect, useState } from "react";
import {
  subscribeNotifications,
  connectNotificationSocket,
  markAllRead as storeMarkAllRead,
  markRead    as storeMarkRead,
  clearAll    as storeClearAll,
  deleteNotification as storeDeleteNotification,
} from "../store/notificationStore";

export function useNotifications() {
  const [state, setState] = useState({
    notifications: [],
    unreadCount: 0,
    latestNotificationId: null,
  });

  useEffect(() => {
    // Connect socket with current user id
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      connectNotificationSocket(user?.id || user?._id || user?.employeeId);
    } catch {
      connectNotificationSocket();
    }

    const unsub = subscribeNotifications(setState);
    return unsub;
  }, []);

  return {
    notifications: state.notifications,
    unreadCount:   state.unreadCount,
    latestNotificationId: state.latestNotificationId,
    markAllRead:   storeMarkAllRead,
    markRead:      storeMarkRead,
    deleteNotification: storeDeleteNotification,
    clearAll:      storeClearAll,
  };
}
