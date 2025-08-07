import { Provider } from 'react-redux';
import { store } from './store/store';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePushNotifications } from './hooks/usePushNotifications';
import { HomeReadyProvider } from './app/context/HomeReadyContext';
import { DeepLinkService } from './services/deepLinkService';

function AppContent() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();

  // Initialize push notifications with userId
  const pushNotifications = usePushNotifications(userId || undefined);

  // Track navigation changes to mark app as foreground
  useEffect(() => {
    if (segments.length > 0) {
      // User is navigating within the app - mark as foreground
      const deepLinkService = DeepLinkService.getInstance();
      deepLinkService.setAppInForeground(true);
    }
  }, [segments]);

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
      <HomeReadyProvider>
        <Slot />
      </HomeReadyProvider>
    </Provider>
  );
}