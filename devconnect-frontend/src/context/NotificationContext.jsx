// ============================================================
//  DevConnect — Notification Context
//  Provides: notifications, unreadCount, markRead()
//  Real-time updates via Socket.io
// ============================================================

import { createContext, useContext, useState, useEffect } from "react";
import { notificationAPI } from "../services/api";
import { onNewNotification } from "../services/socket";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);

  // Fetch notifications when user logs in
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    fetchUnreadCount();
  }, [user]);

  // Listen for real-time notifications via socket
  useEffect(() => {
    if (!user) return;
    const cleanup = onNewNotification((notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });
    return cleanup;
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const data = await notificationAPI.getAll();
      setNotifications(data.data || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await notificationAPI.getUnreadCount();
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  };

  const markRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
};
