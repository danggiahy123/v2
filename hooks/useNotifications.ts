import { useState, useEffect, useCallback } from 'react';
import { notificationService, UserNotification, BackendNotification } from '../services/notificationService';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: string;
  imageUrl?: string;
  actionType?: string;
  actionData?: any;
  deep_link?: string;
  priority?: 'high' | 'normal' | 'low';
  event_type?: string;
  // Backend data
  _id?: string;
  notification_id?: string;
  user_id?: string;
  backend_notification?: BackendNotification;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  date_from?: string;
  date_to?: string;
}

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<NotificationPagination | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Convert backend notification to NotificationItem
  const convertBackendNotification = useCallback((userNotification: UserNotification): NotificationItem => {
    const notification = userNotification.notification;

    console.log('🔄 [convertBackendNotification] Converting:', {
      userNotificationId: userNotification._id,
      notificationTitle: notification?.title,
      notificationBody: notification?.body,
      hasNotification: !!notification
    });

    return {
      id: userNotification._id,
      _id: userNotification._id,
      notification_id: userNotification.notification_id,
      user_id: userNotification.user_id,
      title: notification?.title || 'Thông báo',
      message: notification?.body || 'Không có nội dung',
      timestamp: userNotification.created_at,
      read: userNotification.is_read,
      type: notification?.type || 'manual',
      event_type: notification?.event_type,
      imageUrl: notification?.image_url,
      deep_link: notification?.deep_link,
      priority: notification?.priority || 'normal',
      backend_notification: notification,
    };
  }, []);

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async (filters: NotificationFilters = {}, append: boolean = false) => {
    if (!userId) {
      console.log('🔍 [useNotifications] No userId provided, skipping fetch');
      setLoading(false);
      return;
    }

    try {
      if (!append) {
        setLoading(true);
      }
      setError(null);

      console.log('🔍 [useNotifications] Fetching notifications...', { userId, filters });

      const response = await notificationService.getNotifications(userId, filters);
      const convertedNotifications = response.data.notifications.map(convertBackendNotification);
      if (append) {
        setNotifications(prev => [...prev, ...convertedNotifications]);
      } else {
        setNotifications(convertedNotifications);
      }

      setPagination(response.data.pagination);
      setUnreadCount(response.data.unread_count);

      console.log('✅ [useNotifications] Notifications fetched successfully', {
        count: convertedNotifications.length,
        unreadCount: response.data.unread_count,
      });
    } catch (err) {
      console.error('❌ [useNotifications] Failed to fetch notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, convertBackendNotification]);

  // Load more notifications (pagination)
  const loadMoreNotifications = useCallback(async () => {
    if (!pagination?.has_next || loading) return;

    const nextPage = pagination.page + 1;
    await fetchNotifications({ page: nextPage, limit: pagination.limit }, true);
  }, [pagination, loading, fetchNotifications]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
  }, [fetchNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!userId) return;

    try {
      console.log('📖 [useNotifications] Marking notification as read...', { notificationId });

      const success = await notificationService.markNotificationAsRead(notificationId, userId);

      if (success) {
        // Update local state
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId
              ? { ...notif, read: true }
              : notif
          )
        );

        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));

        console.log('✅ [useNotifications] Notification marked as read successfully');
      } else {
        console.error('❌ [useNotifications] Failed to mark notification as read');
      }
    } catch (err) {
      console.error('❌ [useNotifications] Error marking notification as read:', err);
    }
  }, [userId]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!userId) return;

    try {
      console.log('🗑️ [useNotifications] Deleting notification...', { notificationId });

      const success = await notificationService.deleteNotification(notificationId, userId);

      if (success) {
        // Update local state
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));

        console.log('✅ [useNotifications] Notification deleted successfully');
      } else {
        console.error('❌ [useNotifications] Failed to delete notification');
      }
    } catch (err) {
      console.error('❌ [useNotifications] Error deleting notification:', err);
    }
  }, [userId]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!userId || notifications.length === 0) return;

    try {
      console.log('📖 [useNotifications] Marking all notifications as read...');

      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter(n => !n.read);
      const markPromises = unreadNotifications.map(notif =>
        notificationService.markNotificationAsRead(notif.id, userId)
      );

      await Promise.all(markPromises);

      // Update local state
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setUnreadCount(0);

      console.log('✅ [useNotifications] All notifications marked as read successfully');
    } catch (err) {
      console.error('❌ [useNotifications] Error marking all notifications as read:', err);
    }
  }, [userId, notifications]);

  // Get unread count from backend
  const updateUnreadCount = useCallback(async () => {
    if (!userId) return;

    try {
      const count = await notificationService.getUnreadCountFromBackend(userId);
      setUnreadCount(count);
    } catch (err) {
      console.error('❌ [useNotifications] Error updating unread count:', err);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId, fetchNotifications]);

  // Subscribe to unread count changes from notification service
  useEffect(() => {
    const unsubscribe = notificationService.subscribeToUnreadCount(setUnreadCount);
    return unsubscribe;
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refreshing,
    pagination,
    fetchNotifications,
    loadMoreNotifications,
    refreshNotifications,
    markAsRead,
    deleteNotification,
    markAllAsRead,
    updateUnreadCount,
  };
} 