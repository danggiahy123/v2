import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface NotificationBadgeProps {
  count: number;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ 
  count, 
  size = 'medium',
  style 
}) => {
  if (count === 0) return null;

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: 16,
          height: 16,
          minWidth: 16,
          borderRadius: 8,
          fontSize: 10,
        };
      case 'large':
        return {
          width: 28,
          height: 28,
          minWidth: 28,
          borderRadius: 14,
          fontSize: 12,
        };
      default: // medium
        return {
          width: 20,
          height: 20,
          minWidth: 20,
          borderRadius: 10,
          fontSize: 11,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={['#E50914', '#B81D24']}
        style={[
          styles.badge,
          {
            width: sizeStyles.width,
            height: sizeStyles.height,
            minWidth: sizeStyles.minWidth,
            borderRadius: sizeStyles.borderRadius,
          }
        ]}
      >
        <Text style={[styles.badgeText, { fontSize: sizeStyles.fontSize }]}>
          {count > 99 ? '99+' : count.toString()}
        </Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default NotificationBadge;
