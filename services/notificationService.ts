import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { isNotificationMuted } from '../utils/notificationSettingsHelper';

// Local IP configuration for Expo Go testing
export const API_BASE_URL = 'http://192.168.5.119:3003'; // Change to your backend URL if needed

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: !(await isNotificationMuted()),
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  type: 'NEW_MOVIE' | 'NEW_EPISODE' | 'REMINDER';
  movieId?: string;
  seriesId?: string;
  episodeNumber?: number;
  movieTitle?: string;
  seriesTitle?: string;
  moviePoster?: string;
  action?: string;
}

// Backend notification interface
export interface BackendNotification {
  _id: string;
  title: string;
  body: string;
  type: 'manual' | 'auto';
  event_type: string;
  deep_link?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  sent_at?: string;
  priority: 'high' | 'normal' | 'low';
}

// User notification interface
export interface UserNotification {
  _id: string;
  user_id: string;
  notification_id: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  notification?: BackendNotification;
}

// Pagination interface
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// API response interface
export interface NotificationResponse {
  success: boolean;
  message: string;
  data: {
    notifications: UserNotification[];
    pagination: PaginationInfo;
    unread_count: number;
  };
}

export class NotificationService {
  private static instance: NotificationService;
  private pushToken: string | null = null;
  private userId: string | null = null;
  private unreadCount: number = 0;
  private unreadCountListeners: ((count: number) => void)[] = [];

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(userId: string) {
    console.log('🔄 [NotificationService] Initializing with userId:', userId);
    this.userId = userId;
    
    try {
      console.log('📱 [NotificationService] Starting push token registration...');
      const token = await this.registerForPushNotificationsAsync();
      console.log('📱 [NotificationService] Push token received:', token ? 'SUCCESS' : 'FAILED');
      
      if (token) {
        this.pushToken = token;
        console.log('💾 [NotificationService] Saving token to backend...');
        const saveResult = await this.saveTokenToBackend(token, userId);
        console.log('💾 [NotificationService] Save result:', saveResult ? 'SUCCESS' : 'FAILED');
      } else {
        console.log('❌ [NotificationService] No push token received');
      }
    } catch (error) {
      console.error('❌ [NotificationService] Failed to initialize notifications:', error);
    }
  }

  async registerForPushNotificationsAsync(): Promise<string | null> {
    console.log('🔍 [NotificationService] Starting push token registration...');
    let token = null;

    if (Platform.OS === 'android') {
      console.log('📱 [NotificationService] Setting up Android notification channel...');
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    console.log('🔍 [NotificationService] Device check:', {
      isDevice: Device.isDevice,
      platform: Platform.OS,
      deviceType: Device.deviceType
    });

    if (Device.isDevice) {
      console.log('✅ [NotificationService] Running on physical device');
      
      console.log('🔐 [NotificationService] Checking permissions...');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('🔐 [NotificationService] Existing permission status:', existingStatus);
      
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        console.log('❓ [NotificationService] Requesting permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('🔐 [NotificationService] Permission request result:', status);
      }

      if (finalStatus !== 'granted') {
        console.log('❌ [NotificationService] Push notification permissions not granted:', finalStatus);
        return null;
      }

      console.log('✅ [NotificationService] Permissions granted, getting push token...');
      try {
        // For Expo Go with EAS, use projectId from config
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        console.log('🆔 [NotificationService] Using projectId:', projectId);
        
        let expoPushToken;
        
        if (projectId) {
          // Use projectId for EAS-enabled projects
          expoPushToken = await Notifications.getExpoPushTokenAsync({
            projectId: projectId
          });
          console.log('✅ [NotificationService] Token generated with EAS projectId');
        } else {
          // Fallback for projects without EAS
          try {
            expoPushToken = await Notifications.getExpoPushTokenAsync();
            console.log('✅ [NotificationService] Token generated without projectId');
          } catch (error) {
            console.log('❌ [NotificationService] Failed without projectId, trying with fallback...');
            throw error;
          }
        }
        
        token = expoPushToken.data;
        console.log('✅ [NotificationService] Push token generated successfully:', token);
      } catch (e) {
        console.log('❌ [NotificationService] Error getting push token:', e);
        console.log('💡 [NotificationService] Note: Push notifications may not work in Expo Go SDK 53+. Use development build instead.');
        return null;
      }
    } else {
      console.log('❌ [NotificationService] Must use physical device for Push Notifications');
      console.log('🔍 [NotificationService] Current environment:', {
        isDevice: Device.isDevice,
        platform: Platform.OS,
        __DEV__: __DEV__
      });
    }

    return token;
  }

  async saveTokenToBackend(token: string, userId: string): Promise<boolean> {
    console.log('💾 [NotificationService] Saving token to backend...', {
      token: token ? `${token.substring(0, 20)}...` : 'null',
      userId,
      apiUrl: `${API_BASE_URL}/api/auth/push-token`
    });

    try {
      console.log('🌐 [NotificationService] Making API request...');
      const response = await fetch(`${API_BASE_URL}/api/auth/push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          expoPushToken: token,
        }),
      });

      console.log('📡 [NotificationService] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const data = await response.json();
      console.log('📦 [NotificationService] Response data:', data);
      
      if (data.success) {
        console.log('✅ [NotificationService] Push token saved successfully');
        return true;
      } else {
        console.error('❌ [NotificationService] Failed to save push token:', data.message);
        return false;
      }
    } catch (error) {
      console.error('💥 [NotificationService] Network error saving push token:', error);
      return false;
    }
  }

  async updateNotificationSettings(settings: any): Promise<boolean> {
    if (!this.userId) {
      console.error('User ID not set');
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/notification-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.userId,
          ...settings,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('Notification settings updated successfully');
        return true;
      } else {
        console.error('Failed to update notification settings:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return false;
    }
  }

  // NEW: Get notifications from backend
  async getNotifications(userId: string, filters: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    date_from?: string;
    date_to?: string;
  } = {}): Promise<NotificationResponse> {
    console.log('🔍 [NotificationService] Fetching notifications from backend...', {
      userId,
      filters,
      apiUrl: `${API_BASE_URL}/api/notifications`
    });

    try {
      const params = new URLSearchParams({
        userId,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== undefined)
        )
      });

      const response = await fetch(`${API_BASE_URL}/api/notifications?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ [NotificationService] Notifications fetched successfully');
        
        // Update local unread count
        this.setUnreadCount(data.data.unread_count);
        
        return data;
      } else {
        console.error('❌ [NotificationService] Failed to fetch notifications:', data.message);
        throw new Error(data.message || 'Failed to fetch notifications');
      }
    } catch (error) {
      console.error('💥 [NotificationService] Network error fetching notifications:', error);
      throw error;
    }
  }

  // NEW: Mark notification as read
  async markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
    console.log('📖 [NotificationService] Marking notification as read...', {
      notificationId,
      userId,
      apiUrl: `${API_BASE_URL}/api/notifications/${notificationId}/read`
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ [NotificationService] Notification marked as read successfully');
        
        // Decrement unread count
        this.setUnreadCount(Math.max(0, this.unreadCount - 1));
        
        return true;
      } else {
        console.error('❌ [NotificationService] Failed to mark notification as read:', data.message);
        return false;
      }
    } catch (error) {
      console.error('💥 [NotificationService] Network error marking notification as read:', error);
      return false;
    }
  }

  // NEW: Delete notification
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    console.log('🗑️ [NotificationService] Deleting notification...', {
      notificationId,
      userId,
      apiUrl: `${API_BASE_URL}/api/notifications/${notificationId}`
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ [NotificationService] Notification deleted successfully');
        return true;
      } else {
        console.error('❌ [NotificationService] Failed to delete notification:', data.message);
        return false;
      }
    } catch (error) {
      console.error('💥 [NotificationService] Network error deleting notification:', error);
      return false;
    }
  }

  // NEW: Get unread count from backend
  async getUnreadCountFromBackend(userId: string): Promise<number> {
    console.log('🔢 [NotificationService] Fetching unread count from backend...', {
      userId,
      apiUrl: `${API_BASE_URL}/api/notifications/unread-count`
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ [NotificationService] Unread count fetched successfully:', data.data.count);
        
        // Update local unread count
        this.setUnreadCount(data.data.count);
        
        return data.data.count;
      } else {
        console.error('❌ [NotificationService] Failed to fetch unread count:', data.message);
        return 0;
      }
    } catch (error) {
      console.error('💥 [NotificationService] Network error fetching unread count:', error);
      return 0;
    }
  }

  // Add notification received listener
  addNotificationReceivedListener(listener: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(listener);
    }

  // Add notification response listener (when user taps notification)
  addNotificationResponseReceivedListener(listener: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  // Get notification data from notification
  getNotificationData(notification: Notifications.Notification): NotificationData | null {
    const data = notification.request.content.data;
    return data ? data as unknown as NotificationData : null;
  }

  // Get notification data from response
  getResponseData(response: Notifications.NotificationResponse): NotificationData | null {
    const data = response.notification.request.content.data;
    return data ? data as unknown as NotificationData : null;
  }

  // Subscribe to unread count changes
  subscribeToUnreadCount(listener: (count: number) => void): () => void {
    this.unreadCountListeners.push(listener);
    
    // Immediately call with current count
    listener(this.unreadCount);
    
    // Return unsubscribe function
    return () => {
      const index = this.unreadCountListeners.indexOf(listener);
      if (index > -1) {
        this.unreadCountListeners.splice(index, 1);
      }
    };
  }

  // Update unread count and notify listeners
  setUnreadCount(count: number) {
    this.unreadCount = count;
    this.unreadCountListeners.forEach(listener => listener(count));
  }

  // Get current unread count
  getUnreadCount(): number {
    return this.unreadCount;
  }

  // Increment unread count (when new notification received)
  incrementUnreadCount() {
    this.setUnreadCount(this.unreadCount + 1);
  }

  // Mark notifications as read
  markAsRead() {
    this.setUnreadCount(0);
  }

  getPushToken(): string | null {
    return this.pushToken;
  }

  getUserId(): string | null {
    return this.userId;
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance(); 