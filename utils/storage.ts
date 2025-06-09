import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthData } from '../types/auth';

// Storage keys
export const STORAGE_KEYS = {
  USER_ID: 'userId',
  USER: 'user',
} as const;

/**
 * Save auth data to AsyncStorage
 */
export const saveAuthData = async (authData: AuthData): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.USER_ID, authData.userId),
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(authData.user)),
    ]);
    console.log('✅ Auth data saved to storage');
  } catch (error) {
    console.error('❌ Failed to save auth data:', error);
    throw new Error('Failed to save auth data');
  }
};

/**
 * Get auth data from AsyncStorage
 */
export const getAuthData = async (): Promise<AuthData | null> => {
  try {
    const [userId, userStr] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.USER_ID),
      AsyncStorage.getItem(STORAGE_KEYS.USER),
    ]);

    if (userId && userStr) {
      const user = JSON.parse(userStr);
      console.log('✅ Auth data retrieved from storage');
      return { userId, user };
    }

    console.log('📭 No auth data found in storage');
    return null;
  } catch (error) {
    console.error('❌ Failed to get auth data:', error);
    throw new Error('Failed to retrieve auth data');
  }
};

/**
 * Clear auth data from AsyncStorage
 */
export const clearAuthData = async (): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.USER_ID),
      AsyncStorage.removeItem(STORAGE_KEYS.USER),
    ]);
    console.log('✅ Auth data cleared from storage');
  } catch (error) {
    console.error('❌ Failed to clear auth data:', error);
    throw new Error('Failed to clear auth data');
  }
};

/**
 * Clear all app data from AsyncStorage
 */
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
    console.log('✅ All data cleared from storage');
  } catch (error) {
    console.error('❌ Failed to clear all data:', error);
    throw new Error('Failed to clear all data');
  }
}; 