/**
 * 🎬 CONTINUE WATCHING BADGE
 * 
 * Component hiển thị badge "Tiếp tục xem" trên movie cards
 * Sử dụng cho các movie cards có watching progress
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MovieDetail } from '../../types/movieDetail';
import { shouldShowContinueBadge, getResumeButtonText } from '../../utils/watchingHelper';

interface ContinueWatchingBadgeProps {
  movieDetail: MovieDetail;
  style?: any;
}

export const ContinueWatchingBadge: React.FC<ContinueWatchingBadgeProps> = ({
  movieDetail,
  style
}) => {
  // Kiểm tra có nên hiển thị badge không
  const shouldShow = shouldShowContinueBadge(movieDetail);
  
  if (!shouldShow) {
    return null;
  }

  const buttonText = getResumeButtonText(movieDetail);
  const watchingProgress = movieDetail.userInteractions?.watchingProgress;
  const progressPercent = watchingProgress?.watchPercentage || 0;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.badge}>
        <Ionicons name="play-circle" size={12} color="#ffffff" />
        <Text style={styles.badgeText}>{buttonText}</Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 9, 20, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  progressContainer: {
    height: 3,
    borderRadius: 1.5,
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
});

export default ContinueWatchingBadge; 