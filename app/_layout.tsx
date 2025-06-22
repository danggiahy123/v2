import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '../store/store';
import { restoreAuthState } from '../store/slices/authSlice';

function RootLayoutContent() {
  useEffect(() => {
    // Initialize auth state from storage when app starts
    console.log('🔐 [RootLayout] Initializing auth state...');
    store.dispatch(restoreAuthState());
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      {/* Movie Detail */}
      <Stack.Screen name="movie/[id]" options={{ title: 'Movie Detail' }} />
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
