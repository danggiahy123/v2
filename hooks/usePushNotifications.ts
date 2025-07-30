import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';
import { NotificationService, notificationService } from '../services/notificationService';
import { DeepLinkService } from '../services/deepLinkService';

export function usePushNotifications(userId?: string) {
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const deepLinkService = DeepLinkService.getInstance();

  useEffect(() => {
    // Initialize services
    if (userId) {
      notificationService.initialize(userId);
    }
    deepLinkService.initialize();

    // Register notification listeners
    notificationListener.current = notificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('📱 [usePushNotifications] Notification received:', {
          title: notification.request.content.title,
          body: notification.request.content.body,
          data: notification.request.content.data
        });
        
        // Increment unread count when notification is received
        notificationService.incrementUnreadCount();
        
        const data = notificationService.getNotificationData(notification);
        if (data) {
          console.log('✅ [usePushNotifications] Extracted notification data:', data);
          
          // Show in-app alert for foreground notifications

          // Alert.alert(
          //   notification.request.content.title || 'Thông báo mới',
          //   data.movieTitle 
          //     ? `🎬 ${data.movieTitle} - Khám phá ngay!` 
          //     : notification.request.content.body || 'Bạn có thông báo mới',
          //   [
          //     { text: 'Đóng', style: 'cancel' },
          //     { 
          //       text: 'Xem ngay', 
          //       onPress: () => {
          //         console.log('👆 [usePushNotifications] User tapped "Xem ngay" for notification');
          //         // Mark as read when user views
          //         notificationService.markAsRead();
          //         // Navigate to the content
          //         deepLinkService.handleNotificationTap(data);
          //       }
          //     }
          //   ],
          //   { cancelable: true }
          // );

          // COMMENTED OUT: Disable in-app alert popup
          /*
          Alert.alert(
            notification.request.content.title || 'Thông báo mới',
            data.movieTitle 
              ? `🎬 ${data.movieTitle} - Khám phá ngay!` 
              : notification.request.content.body || 'Bạn có thông báo mới',
            [
              { text: 'Đóng', style: 'cancel' },
              { 
                text: 'Xem ngay', 
                onPress: () => {
                  console.log('👆 [usePushNotifications] User tapped "Xem ngay" for notification');
                  // Mark as read when user views
                  notificationService.markAsRead();
                  // Navigate to the content
                  deepLinkService.handleNotificationTap(data);
                }
              }
            ],
            { cancelable: true }
          );
          */

        } else {
          console.warn('⚠️ [usePushNotifications] Could not extract notification data');
        }
      }
    );

    responseListener.current = notificationService.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 [usePushNotifications] Notification tapped:', {
          title: response.notification.request.content.title,
          body: response.notification.request.content.body,
          data: response.notification.request.content.data
        });
        
        // Mark notifications as read when user taps
        notificationService.markAsRead();
        
        const data = notificationService.getResponseData(response);
        if (data) {
          console.log('✅ [usePushNotifications] Extracted response data:', data);
          // Navigate based on notification data
          deepLinkService.handleNotificationTap(data);
        } else {
          console.warn('⚠️ [usePushNotifications] Could not extract response data');
        }
      }
    );

    // Cleanup function
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      deepLinkService.cleanup();
    };
  }, [userId]);

  // Return useful methods
  return {
    updateNotificationSettings: (settings: any) => {
      return notificationService.updateNotificationSettings(settings);
    },
    getPushToken: () => {
      return notificationService.getPushToken();
    },
    getUserId: () => {
      return notificationService.getUserId();
    },
    getUnreadCount: () => {
      return notificationService.getUnreadCount();
    },
    markAsRead: () => {
      notificationService.markAsRead();
    },
    // NEW: Backend API methods
    getNotifications: (filters?: any) => {
      if (!userId) return Promise.reject('User ID required');
      return notificationService.getNotifications(userId, filters);
    },
    markNotificationAsRead: (notificationId: string) => {
      if (!userId) return Promise.reject('User ID required');
      return notificationService.markNotificationAsRead(notificationId, userId);
    },
    deleteNotification: (notificationId: string) => {
      if (!userId) return Promise.reject('User ID required');
      return notificationService.deleteNotification(notificationId, userId);
    },
    getUnreadCountFromBackend: () => {
      if (!userId) return Promise.reject('User ID required');
      return notificationService.getUnreadCountFromBackend(userId);
    },
  };
} 