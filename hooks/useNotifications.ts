import { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
  type?: string;
  data?: any;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to unread count changes
    const unsubscribe = notificationService.subscribeToUnreadCount(setUnreadCount);
    
    // Initial setup
    setLoading(false);

    return unsubscribe;
  }, []);

  const markAsRead = (notificationId: string) => {
    // Mark single notification as read
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    // Update unread count
    const newUnreadCount = notifications.filter(n => !n.read && n.id !== notificationId).length;
    notificationService.setUnreadCount(newUnreadCount);
  };

  const markAllAsRead = () => {
    // Mark all notifications as read
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    notificationService.markAsRead();
  };

  const addNotification = (notification: Omit<NotificationItem, 'id' | 'timestamp'>) => {
    const newNotification: NotificationItem = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    notificationService.incrementUnreadCount();
  };

  const simulateNewNotification = () => {
    addNotification({
      title: '🎬 Test Notification',
      body: 'This is a test notification!',
      type: 'TEST',
      read: false
    });
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