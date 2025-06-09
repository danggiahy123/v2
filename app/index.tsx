import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { restoreAuthState } from '../store/slices/authSlice';

export default function Index() {
  const [isInitialized, setIsInitialized] = useState(false);
  const { userId, isLoggedIn, loading } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const initializeAuth = async () => {
      const result = await dispatch(restoreAuthState());
      
      if (restoreAuthState.fulfilled.match(result)) {
        if (result.payload) {
          console.log('✅ Auth restored for user:', result.payload.user.full_name);
        } else {
          console.log('🔑 No auth data found, showing login');
        }
      }
      
      setIsInitialized(true);
    };

    initializeAuth();
  }, [dispatch]);

  if (!isInitialized || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 16, color: '#666' }}>Đang kiểm tra đăng nhập...</Text>
      </View>
    );
  }

  if (!isLoggedIn || !userId) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)" />;
} 