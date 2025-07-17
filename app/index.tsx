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
          console.log('🔑 No auth data found, user can browse without login');
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
        <Text style={{ marginTop: 16, color: '#666' }}>Đang khởi tạo ứng dụng...</Text>
      </View>
    );
  }

  // Tất cả người dùng đều vào flash trước khi vào app
  return <Redirect href="/(auth)/flash" />;
} 