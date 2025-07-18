import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

export default function Devices() {
  const router = useRouter();
  const auth = useSelector((state: RootState) => state.auth);

  if (!auth.isLoggedIn || !auth.userId) {
    return (
      <View style={{ flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="lock-closed-outline" size={64} color="#666" style={{ marginBottom: 24 }} />
        <Text style={{ color: '#fff', fontSize: 18, marginBottom: 16, textAlign: 'center' }}>
          Vui lòng đăng nhập để quản lý thiết bị
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#D11030',
            paddingHorizontal: 32,
            paddingVertical: 12,
            borderRadius: 20,
          }}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.8}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Custom header with back button
  const Header = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 40, paddingBottom: 16, backgroundColor: '#111', paddingHorizontal: 12 }}>
      <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginRight: 8 }}>
        <Ionicons name="arrow-back" size={28} color="#fff" />
      </TouchableOpacity>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>Quản lý thiết bị</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#111' }}>
      <Header />
      {/* Placeholder for device list or other content */}
      <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center', marginTop: 20 }}>
        Chức năng quản lý thiết bị đang được phát triển.
      </Text>
    </View>
  );
} 