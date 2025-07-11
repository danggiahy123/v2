import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Production configuration for Render deployment
const API_BASE_URL = 'https://backend-app-lou3.onrender.com';
// Local IP configuration for Expo Go testing 
// const API_BASE_URL = 'http://192.168.9.155:3003';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
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