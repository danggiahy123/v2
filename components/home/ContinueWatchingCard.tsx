import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { formatRemainingTime } from '../../utils/watchingHelper';

const { width: screenWidth } = Dimensions.get('window');

export interface ContinueWatchingItem {
  movieId: string;
  title: string;
  poster: string;
  movieType: 'Phim lẻ' | 'Phim bộ';
  progress: number; // 0-1
  progressPercentage: number; // 0-100
  currentTime: number; // seconds
  duration: number; // seconds
  remainingTime: number; // seconds
  remainingTimeFormatted: string; // "15 phút còn lại"
  lastWatchedAt: string;
  episodeId: string;
  episodeNumber?: number; // For series
  episodeTitle?: string; // For series
  hasRentalAccess?: boolean; // Whether user has rental access
}

interface ContinueWatchingCardProps {
  item: ContinueWatchingItem;
  onPress: (movieId: string) => void;
  width?: number;
  style?: any;
}

export const ContinueWatchingCard: React.FC<ContinueWatchingCardProps> = ({
  item,
  onPress,
  width = 280,
  style,
}) => {
  const cardHeight = (width * 9) / 16; // 16:9 aspect ratio

  // Removed duplicate formatRemainingTime function - now using from watchingHelper

  const getEpisodeInfo = (): string => {
    // Show episode info if episodeNumber exists
    if (item.episodeNumber) {
      return `Tập ${item.episodeNumber}`;
    }
    return '';
  };

  return (
    <TouchableOpacity
      style={[styles.container, { width, height: cardHeight }, style]}
      onPress={() => onPress(item.movieId)}
      activeOpacity={0.8}
    >
      {/* Poster Image */}
      <Image
        source={{ uri: item.poster }}
        style={styles.poster}
        resizeMode="cover"
      />

      {/* Gradient Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.gradientOverlay}
        locations={[0.4, 1]}
      />

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(Math.max(item.progressPercentage, 0), 100)}%` },
            ]}
          />
        </View>
      </View>

      {/* Content Overlay */}
      <View style={styles.contentOverlay}>
        {/* Play Icon */}
        <View style={styles.playIconContainer}>
          <Ionicons name="play-circle" size={40} color="rgba(255,255,255,0.9)" />
        </View>

        {/* Text Content */}
        <View style={styles.textContent}>
          {/* Episode Info (for series) */}
          {getEpisodeInfo() && (
            <Text style={styles.episodeText}>{getEpisodeInfo()}</Text>
          )}
          
          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>

          {/* Bottom Row: Remaining Time */}
          <View style={styles.bottomRow}>
            <Text style={styles.remainingTime}>
              {formatRemainingTime(item.remainingTime)}
            </Text>
          </View>
        </View>
      </View>  
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginRight: 12,
  },
  poster: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 0,
  },
  progressBackground: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 0,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E50914',
    borderRadius: 0,
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingBottom: 8, // Account for progress bar
  },
  playIconContainer: {
    position: 'absolute',
    width: 40,
    height: 40,
    top: 2,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    flex: 1,
  },
  episodeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  remainingTime: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '400',
  },
  typeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
});

export default ContinueWatchingCard; 