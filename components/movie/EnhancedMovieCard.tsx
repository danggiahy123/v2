/**
 * 🎬 ENHANCED MOVIE CARD
 * 
 * Movie card component với continue watching badge integration
 * Sử dụng cho các movie lists có thể có watching progress
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GridMovie } from '../../types/movie';
import { movieDetailService } from '../../services/movieDetailService';
import { shouldShowContinueBadge, getResumeButtonText } from '../../utils/watchingHelper';
import { shouldShowPaidBadge } from '../../utils/moviePriceHelper';

interface EnhancedMovieCardProps {
  item: GridMovie;
  onPress: () => void;
  userId?: string;
  width?: number;
  height?: number;
  showContinueBadge?: boolean;
}

export const EnhancedMovieCard: React.FC<EnhancedMovieCardProps> = ({
  item,
  onPress,
  userId,
  width = 160,
  height = 240,
  showContinueBadge = true,
}) => {
  const [watchingProgress, setWatchingProgress] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const scaleAnim = new Animated.Value(1);

  // Load watching progress if user is logged in and showContinueBadge is true
  useEffect(() => {
    if (userId && showContinueBadge) {
      loadWatchingProgress();
    }
  }, [userId, item.movieId, showContinueBadge]);

  const loadWatchingProgress = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const movieDetail = await movieDetailService.getMovieDetail(item.movieId, userId);
      
      if (movieDetail) {
        const progress = movieDetail.userInteractions?.watchingProgress;
        setWatchingProgress(progress);
      }
    } catch (error) {
      console.log('Error loading watching progress:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // Create mock movieDetail for badge logic
  const mockMovieDetail = {
    userInteractions: {
      watchingProgress: watchingProgress
    }
  };

  const shouldShowBadge = showContinueBadge && watchingProgress && shouldShowContinueBadge(mockMovieDetail as any);
  const buttonText = shouldShowBadge ? getResumeButtonText(mockMovieDetail as any) : '';
  const progressPercent = watchingProgress?.watchPercentage || 0;

  return (
    <Animated.View style={[styles.container, { width, height, transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.card}
      >
        <View style={styles.posterContainer}>
          <Image 
            source={{ uri: item.poster }} 
            style={styles.poster} 
            resizeMode="cover"
          />
          
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          />
          
          {/* Play Button Overlay */}
          <View style={styles.playOverlay}>
            <View style={styles.playButton}>
              <Ionicons name="play" size={16} color="#fff" />
            </View>
          </View>

          {/* Continue Watching Badge */}
          {shouldShowBadge && (
            <View style={styles.continueContainer}>
              <View style={styles.continueBadge}>
                <Ionicons name="play-circle" size={10} color="#ffffff" />
                <Text style={styles.continueText}>{buttonText}</Text>
              </View>
              
              {/* Progress bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${Math.min(Math.max(progressPercent, 0), 100)}%` }
                    ]} 
                  />
                </View>
              </View>
            </View>
          )}

          {/* Paid Badge */}
          {shouldShowPaidBadge(item) && (
            <View style={[styles.paidBadge, item.rating ? styles.paidBadgeWithRating : null]}>
              <Ionicons name="card" size={10} color="#fff" />
              <Text style={styles.paidText}>Trả phí</Text>
            </View>
          )}

          {/* Rating Badge */}
          {item.rating && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={10} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          )}
        </View>

        <View style={styles.movieInfo}>
          <Text style={styles.movieTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.movieMeta}>
            <Text style={styles.movieType}>{item.movieType}</Text>
            {item.year && (
              <>
                <Text style={styles.metaDivider}>•</Text>
                <Text style={styles.movieYear}>{item.year}</Text>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  posterContainer: {
    position: 'relative',
    flex: 1,
  },
  poster: {
    width: '100%',
    height: '70%',
    backgroundColor: '#2A2A2A',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: '30%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    opacity: 0,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(229,9,20,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueContainer: {
    position: 'absolute',
    bottom: '30%',
    left: 6,
    right: 6,
  },
  continueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 9, 20, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 3,
  },
  continueText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '600',
    marginLeft: 3,
  },
  progressContainer: {
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBackground: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E50914',
  },
  paidBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 9, 20, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  paidBadgeWithRating: {
    top: 8,
    right: 8,
    transform: [{ translateY: -26 }], // Đẩy lên trên rating badge
  },
  paidText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
    marginLeft: 2,
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  movieInfo: {
    padding: 12,
    height: '30%',
  },
  movieTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
    marginBottom: 4,
  },
  movieMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  movieType: {
    color: '#E50914',
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  metaDivider: {
    color: '#666',
    fontSize: 10,
    marginHorizontal: 4,
  },
  movieYear: {
    color: '#999',
    fontSize: 10,
  },
});

export default EnhancedMovieCard; 