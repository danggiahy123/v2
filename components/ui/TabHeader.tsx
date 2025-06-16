import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface TabHeaderProps {
  title: string;
  onSearchPress?: () => void;
  onNotificationPress?: () => void;
  opacity?: Animated.AnimatedValue;
}

export default function TabHeader({ 
  title,
  onSearchPress,
  onNotificationPress,
  opacity = new Animated.Value(1),
}: TabHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          paddingTop: insets.top,
          opacity
        }
      ]}
    >
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.93)', 'rgba(0, 0, 0, 0.75)', 'transparent']}
        style={styles.gradient}
        pointerEvents="none"
      />
      {title ? (
        <Text style={styles.title}>{title}</Text>
      ) : (
        <Image source={require('../../assets/anh/logo.png')} style={styles.logoImage} />
      )}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={onSearchPress}
        >
          <Ionicons name="search" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={onNotificationPress}
        >
          <Ionicons name="notifications" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    paddingBottom: 10,
    paddingHorizontal: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 999,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150, // Adjust this value to control how far down the gradient extends
    zIndex: -1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  logoImage: {
    width: 160,
    height: 70,
    resizeMode: 'contain',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
}); 