/**
 * UI COMPONENTS WITH ANIMATIONS
 * 
 * MÔ TẢ:
 * Collection of reusable animated UI components.
 * Each component is optimized for performance and reusability.
 * 
 * COMPONENTS:
 * 1. SkeletonLoader - Loading placeholder with shimmer effect
 * 2. AnimatedButton - Button with scale and opacity animations
 * 3. FloatingActionButton - FAB with entrance and rotation animations
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// **1️⃣ SKELETON LOADER WITH SHIMMER**
interface SkeletonProps {
  width: number | string;
  height: number;
  style?: any;
  borderRadius?: number;
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({
  width,
  height,
  style,
  borderRadius = 4,
}) => {
  const animWidth = typeof width === 'string' ? parseInt(width) : width;
  const translateX = useRef(new Animated.Value(-animWidth)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: animWidth,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -animWidth,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animWidth]);

  return (
    <View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
};

// **2️⃣ ANIMATED BUTTON**
interface AnimatedButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  disabled?: boolean;
  style?: any;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  size = 'medium',
  icon,
  disabled = false,
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.buttonSecondary;
      case 'outline':
        return styles.buttonOutline;
      default:
        return styles.buttonPrimary;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return styles.buttonSmall;
      case 'large':
        return styles.buttonLarge;
      default:
        return styles.buttonMedium;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          styles.animatedButton,
          getVariantStyle(),
          getSizeStyle(),
          { transform: [{ scale: scaleAnim }] },
          disabled && { opacity: 0.6 },
          style,
        ]}
      >
        {icon && <Ionicons name={icon as any} size={24} color="#fff" style={{ marginRight: 8 }} />}
        <Text style={{ color: variant === 'outline' ? '#007AFF' : '#fff', fontWeight: '600' }}>
          {title}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// **3️⃣ FLOATING ACTION BUTTON WITH ANIMATIONS**
interface FABProps {
  onPress: () => void;
  icon: string;
  backgroundColor?: string;
  size?: number;
  bottom?: number;
  right?: number;
}

export const FloatingActionButton: React.FC<FABProps> = ({
  onPress,
  icon,
  backgroundColor = '#007AFF',
  size = 56,
  bottom = 20,
  right = 20,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.sequence([
      Animated.delay(500),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous rotation
    const rotate = () => {
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => {
        rotateAnim.setValue(0);
        rotate();
      });
    };
    rotate();
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        tension: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        {
          bottom,
          right,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Animated.View
        style={{
          transform: [
            { scale: scaleAnim },
            { rotate: rotation },
          ],
        }}
      >
        <Ionicons name={icon as any} size={size * 0.4} color="#fff" />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Skeleton Loader
  skeleton: {
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },

  // Animated Button
  animatedButton: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonSecondary: {
    backgroundColor: '#6c757d',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
  },
  buttonMedium: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 40,
  },
  buttonLarge: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    minHeight: 48,
  },

  // FAB
  fab: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default {
  SkeletonLoader,
  AnimatedButton,
  FloatingActionButton,
}; 