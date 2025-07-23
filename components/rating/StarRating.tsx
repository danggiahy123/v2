import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StarRatingProps {
  rating?: number; // Current rating (0-5)
  maxStars?: number; // Maximum stars (default 5)
  size?: number; // Star size
  readonly?: boolean; // Whether user can interact
  showRating?: boolean; // Show rating number
  showText?: boolean; // Show rating text
  onRatingChange?: (rating: number) => void;
  style?: any;
  starStyle?: any;
  textStyle?: any;
  starColor?: string; // Thêm prop màu sao
}

interface StarProps {
  filled: boolean;
  partial: number; // 0-1, tỉ lệ phần trăm sáng
  size: number;
  onPress?: () => void;
  readonly: boolean;
  starColor?: string;
}

const Star: React.FC<StarProps> = ({ filled, partial, size, onPress, readonly, starColor }) => {
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    if (!readonly) {
      Animated.spring(scaleAnim, {
        toValue: 1.2,
        useNativeDriver: true,
        tension: 150,
        friction: 4,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!readonly) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 150,
        friction: 4,
      }).start();
    }
  };

  // Nếu là sao đầy
  if (filled) {
    return (
      <TouchableOpacity 
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={readonly}
        activeOpacity={readonly ? 1 : 0.7}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Ionicons
            name={'star'}
            size={size}
            color={starColor || '#FFD700'}
          />
        </Animated.View>
      </TouchableOpacity>
    );
  }

  // Nếu là sao lẻ (partial > 0)
  if (partial > 0) {
    return (
      <TouchableOpacity 
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={readonly}
        activeOpacity={readonly ? 1 : 0.7}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }], position: 'relative', width: size, height: size }}>
          {/* Nền là star-outline */}
          <Ionicons
            name={'star-outline'}
            size={size}
            color={starColor || '#FFD700'}
            style={{ position: 'absolute', left: 0, top: 0 }}
          />
          {/* Overlay phần trăm vàng */}
          <View style={{ position: 'absolute', left: 0, top: 0, width: size * partial, height: size, overflow: 'hidden' }} pointerEvents="none">
            <Ionicons
              name={'star'}
              size={size}
              color={starColor || '#FFD700'}
              style={{ position: 'absolute', left: 0, top: 0 }}
            />
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  // Sao tối
  return (
    <TouchableOpacity 
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={readonly}
      activeOpacity={readonly ? 1 : 0.7}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons
          name={'star-outline'}
          size={size}
          color={'#333'}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const StarRating: React.FC<StarRatingProps> = ({
  rating = 0,
  maxStars = 5,
  size = 24,
  readonly = false,
  showRating = false,
  showText = false,
  onRatingChange,
  style,
  starStyle,
  textStyle,
  starColor = '#FFD700',
}) => {
  const [currentRating, setCurrentRating] = useState(rating);

  const handleStarPress = (starIndex: number) => {
    if (readonly) return;
    
    const newRating = starIndex + 1;
    setCurrentRating(newRating);
    onRatingChange?.(newRating);
  };

  const getRatingText = (rating: number) => {
    if (rating === 0) return 'Chưa đánh giá';
    if (rating <= 1) return 'Rất tệ';
    if (rating <= 2) return 'Tệ';
    if (rating <= 3) return 'Trung bình';
    if (rating <= 4) return 'Tốt';
    return 'Xuất sắc';
  };

  const renderStars = () => {
    const stars = [];
    // Nếu readonly thì dùng prop rating, còn không thì dùng currentRating
    const displayRating = readonly ? rating : currentRating;
    for (let i = 0; i < maxStars; i++) {
      let isFilled = false;
      let partial = 0;
      if (displayRating >= i + 1) {
        isFilled = true;
      } else if (displayRating > i) {
        partial = displayRating - i;
      }
      stars.push(
        <Star
          key={i}
          filled={isFilled}
          partial={partial}
          size={size}
          onPress={() => handleStarPress(i)}
          readonly={readonly}
          starColor={starColor}
        />
      );
    }
    return stars;
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.starContainer, starStyle]}>
        {renderStars()}
      </View>
      
      {showRating && (
        <Text style={[styles.ratingNumber, textStyle]}>
          {currentRating.toFixed(1)}
        </Text>
      )}
      
      {showText && (
        <Text style={[styles.ratingText, textStyle]}>
          {getRatingText(currentRating)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default StarRating; 