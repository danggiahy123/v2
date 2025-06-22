import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

// **1️⃣ ANIMATED LOADING SKELETON**
interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const shimmer = () => {
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: -1,
          duration: 0,
          useNativeDriver: true,
        }),
      ]).start(() => shimmer());
    };

    shimmer();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-screenWidth, screenWidth],
  });

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

// **2️⃣ ANIMATED BUTTON WITH PRESS EFFECTS**
interface AnimatedButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  onPress,
  children,
  style,
  disabled = false,
  variant = 'primary',
  size = 'medium',
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        tension: 150,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled) return;

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 150,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary': return styles.buttonPrimary;
      case 'secondary': return styles.buttonSecondary;
      case 'outline': return styles.buttonOutline;
      default: return styles.buttonPrimary;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small': return styles.buttonSmall;
      case 'medium': return styles.buttonMedium;
      case 'large': return styles.buttonLarge;
      default: return styles.buttonMedium;
    }
  };

  const buttonStyle = [
    styles.animatedButton,
    getVariantStyle(),
    getSizeStyle(),
    { opacity: disabled ? 0.5 : 1 },
    style,
  ];

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
          buttonStyle,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {children}
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

// **4️⃣ SLIDE IN NOTIFICATION**
interface NotificationProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onHide?: () => void;
}

export const SlideNotification: React.FC<NotificationProps> = ({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onHide,
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide
      if (duration > 0) {
        const timer = setTimeout(() => {
          hideNotification();
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      hideNotification();
    }
  }, [visible]);

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  const getNotificationColor = () => {
    switch (type) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'warning': return '#FF9800';
      default: return '#2196F3';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'close-circle';
      case 'warning': return 'warning';
      default: return 'information-circle';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.notification,
        {
          backgroundColor: getNotificationColor(),
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Ionicons name={getIcon() as any} size={20} color="#fff" />
      <Text style={styles.notificationText}>{message}</Text>
      <TouchableOpacity onPress={hideNotification} style={styles.notificationClose}>
        <Ionicons name="close" size={16} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

// **5️⃣ PULSE ANIMATION FOR LIKE BUTTON**
interface PulseAnimationProps {
  children: React.ReactNode;
  trigger: boolean;
  color?: string;
}

export const PulseAnimation: React.FC<PulseAnimationProps> = ({
  children,
  trigger,
  color = '#ff6b6b',
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (trigger) {
      // Pulse effect
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // Ring pulse effect
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 2,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [trigger]);

  return (
    <View style={styles.pulseContainer}>
      {/* Pulse ring */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            borderColor: color,
            transform: [{ scale: pulseAnim }],
            opacity: pulseAnim.interpolate({
              inputRange: [1, 2],
              outputRange: [0.7, 0],
            }),
          },
        ]}
      />
      
      {/* Main element */}
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}
      >
        {children}
      </Animated.View>
    </View>
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

  // Notification
  notification: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  notificationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginLeft: 8,
  },
  notificationClose: {
    padding: 4,
    marginLeft: 8,
  },

  // Pulse Animation
  pulseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
  },
});

export default {
  SkeletonLoader,
  AnimatedButton,
  FloatingActionButton,
  SlideNotification,
  PulseAnimation,
}; 