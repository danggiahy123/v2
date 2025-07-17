/**
 * NOTIFICATION COMPONENT - Minimal & Modern Toast Notification
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, useColorScheme, Platform, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

interface NotificationProps {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'sync';
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
  progress?: number;
}

interface TypeStyle {
  color: string;
  bg: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = Platform.OS === 'ios' ? 44 : 56;
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 47 : 24;

const SWIPE_THRESHOLD = -30; // Ngưỡng vuốt để đóng thông báo

const Notification: React.FC<NotificationProps> = ({
  visible,
  message,
  type,
  onClose,
  autoClose = true,
  duration = 3000,
  progress,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const translateAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const swipeAnim = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        // Chỉ cho phép vuốt lên
        if (gestureState.dy < 0) {
          swipeAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < SWIPE_THRESHOLD) {
          // Vuốt đủ xa - đóng thông báo
          Animated.timing(swipeAnim, {
            toValue: -100,
            duration: 200,
            useNativeDriver: true,
          }).start(() => handleClose());
        } else {
          // Không vuốt đủ xa - trả về vị trí cũ
          Animated.spring(swipeAnim, {
            toValue: 0,
            tension: 120,
            friction: 12,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Define handleClose first to avoid hoisting issues
  const handleClose = React.useCallback(() => {
    // Prevent closing sync notifications that are still in progress
    if (type === 'sync' && progress !== undefined && progress < 100) return;

    // Only close if currently visible to avoid duplicate calls
    if (!visible) return;

    Animated.parallel([
      Animated.timing(translateAnim, {
        toValue: -100,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Call onClose after animation completes
      onClose();
    });
  }, [type, progress, visible, translateAnim, opacityAnim, scaleAnim, onClose]);

  // Handle show/hide animations
  useEffect(() => {
    if (visible) {
      // Reset swipe animation
      swipeAnim.setValue(0);
      
      // Show notification with animations
      Animated.parallel([
        Animated.spring(translateAnim, {
          toValue: 0,
          tension: 120,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations when hidden
      translateAnim.setValue(-100);
      opacityAnim.setValue(0);
      scaleAnim.setValue(0.95);
    }
  }, [visible, translateAnim, opacityAnim, scaleAnim, swipeAnim]);

  // Handle auto-close timer separately
  useEffect(() => {
    if (visible && autoClose && type !== 'sync') {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, autoClose, duration, type, handleClose]);

  const getTypeStyles = (): TypeStyle => {
    const baseColor = '#D11030';
    const styles: Record<string, TypeStyle> = {
      success: {
        color: '#ffffff',
        bg: baseColor,
        icon: 'checkmark-outline',
      },
      error: {
        color: '#ffffff',
        bg: baseColor,
        icon: 'alert-outline',
      },
      sync: {
        color: '#ffffff',
        bg: baseColor,
        icon: 'sync-outline',
      },
    };
    return styles[type] || styles.success;
  };

  const typeStyle = getTypeStyles();

  // Thay Modal bằng View overlay
  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.overlay,
        {
          opacity: opacityAnim,
          transform: [
            { translateY: translateAnim },
            { scale: scaleAnim }
          ],
        },
      ]}
    >
      <Animated.View 
        {...panResponder.panHandlers}
        style={[
          styles.container, 
          { 
            backgroundColor: typeStyle.bg,
            opacity: 0.9,
            transform: [{ translateY: swipeAnim }]
          }
        ]}
      >
        <View style={styles.content}>
          <Ionicons 
            name={typeStyle.icon}
            size={16} 
            color={typeStyle.color}
            style={styles.icon} 
          />
          <Text style={styles.message} numberOfLines={1}>
            {message}
          </Text>
        </View>

        {type === 'sync' && progress !== undefined && (
          <Animated.View 
            style={[
              styles.progressBar,
              { 
                width: Animated.multiply(
                  progress, 
                  Animated.divide(width - 32, 100)
                )
              }
            ]} 
          />
        )}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: STATUS_BAR_HEIGHT + 25,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  container: {
    minWidth: 100,
    maxWidth: Math.min(width - 32, 240),
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 6,
  },
  message: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  progressBar: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default Notification;
