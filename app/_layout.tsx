import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import { restoreAuthState } from '../store/slices/authSlice';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useAppSelector } from '../store/hooks';

function RootLayoutContent() {
  // Get userId from auth state for push notifications
  const { userId, isLoggedIn } = useAppSelector((state) => state.auth);
  
  // Initialize push notifications with userId
  const pushNotifications = usePushNotifications(userId || undefined);

  useEffect(() => {
    // Initialize auth state from storage when app starts
    console.log('🔐 [RootLayout] Initializing auth state...');
    store.dispatch(restoreAuthState());
  }, []);

  useEffect(() => {
    if (isLoggedIn && userId) {
      console.log('📱 [RootLayout] User logged in, push notifications initialized for:', userId);
    } else {
      console.log('📱 [RootLayout] User not logged in, push notifications not initialized');
    }
  }, [isLoggedIn, userId]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      {/* Deep linking route */}
      <Stack.Screen 
        name="movie/[id]" 
        options={{ headerShown: false }}
      />
    </Stack>
  );
}

export default function Layout() {
  return (
    <Provider store={store}>
      <RootLayoutContent />
    </Provider>
  );
}
