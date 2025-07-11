import { Provider } from 'react-redux';
import { store } from './store/store';
import { Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePushNotifications } from './hooks/usePushNotifications';

function AppContent() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize push notifications with userId
  const pushNotifications = usePushNotifications(userId || undefined);

  useEffect(() => {
    // Get userId from storage when app starts
    const initializeApp = async () => {
      try {
        // Assuming you store userId in AsyncStorage after login
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
          console.log('📱 App initialized with userId:', storedUserId);
        } else {
          console.log('📱 No userId found, user needs to login');
        }
      } catch (error) {
        console.error('❌ Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Show loading screen while getting userId
  if (isLoading) {
    return <Slot />;
  }

  return <Slot />;
}

export default function App() {
  return (
    <Provider store={store}>
      <Slot />
    </Provider>
  );
} 