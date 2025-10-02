import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {
  fetchNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../utils/apiClient';
import { getAuthToken } from '../utils/auth';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  severity: string;
  status: string;
  bot_id?: number;
  trade_id?: number;
  extra_data?: any;
  created_at: string;
  read_at?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'status'>) => void;
  markAsRead: (id: number) => Promise<void>;
  clearNotification: (id: number) => void;
  clearAllNotifications: () => Promise<void>;
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications from backend
  const refreshNotifications = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const data = await fetchNotifications(undefined, 50, 0);
      setNotifications(data);
      
      // Also update unread count
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  };

  // Load notifications on mount and when user logs in
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      refreshNotifications();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(refreshNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  const addNotification = (notification: Omit<Notification, 'id' | 'created_at' | 'status'>) => {
    // This is kept for backward compatibility with Mantine toasts
    const newNotification: Notification = {
      ...notification,
      id: Date.now(),
      created_at: new Date().toISOString(),
      status: 'unread',
    };
    setNotifications((prev) => [newNotification, ...prev]);
    setUnreadCount((prev) => prev + 1);
  };

  const markAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id ? { ...notification, status: 'read', read_at: new Date().toISOString() } : notification,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const clearNotification = (id: number) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    const notification = notifications.find((n) => n.id === id);
    if (notification && notification.status === 'unread') {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const clearAllNotifications = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          status: 'read',
          read_at: new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        clearNotification,
        clearAllNotifications,
        unreadCount,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
