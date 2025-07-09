import { useState, useEffect } from 'react';
import { notificationService, NotificationItem } from '../services/notificationService';

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to unread count changes
    const unsubscribe = notificationService.subscribeToUnreadCount(setUnreadCount);
    
    // Load initial notifications
    setNotifications(notificationService.getNotifications());
    setLoading(false);

    return unsubscribe;
  }, []);

  const markAsRead = (notificationId: string) => {
    notificationService.markAsRead(notificationId);
    setNotifications(notificationService.getNotifications());
  };

  const markAllAsRead = () => {
    notificationService.markAllAsRead();
    setNotifications(notificationService.getNotifications());
  };

  const addNotification = (notification: Omit<NotificationItem, 'id' | 'timestamp'>) => {
    notificationService.addNotification(notification);
    setNotifications(notificationService.getNotifications());
  };

  const simulateNewNotification = () => {
    notificationService.simulateNewNotification();
    setNotifications(notificationService.getNotifications());
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    addNotification,
    simulateNewNotification
  };
} 