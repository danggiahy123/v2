import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';


export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopColor: '#333',
          height: 80,
        },
        tabBarActiveTintColor: '#D32F2F',
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'home' : 'home-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="series"
        options={{
          title: 'Phim bộ',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'tv' : 'tv-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="anime"
        options={{
          title: 'Hoạt hình',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'happy' : 'happy-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sports"
        options={{
          title: 'Thể thao',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'basketball' : 'basketball-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Mở rộng',
          tabBarIcon: ({ color, focused }) => ( 
            <Ionicons 
              name={focused ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline'} 
              size={24} 
              color={color} 
            />
            
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null, 
        }}
      />
    </Tabs>
  );
}
