import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Episode } from '../../types/episode';

interface EpisodeCardProps {
  episode: Episode;
  moviePoster?: string;
  movieTitle?: string;
  watchingProgress?: {
    episodeId: string;
    watchPercentage: number;
    currentTime: number;
    duration?: number;
    completed: boolean;
  } | null;
  onPress: (episode: Episode) => void;
  disabled?: boolean;
  isLocked?: boolean;
  showUpdateStatus?: boolean;
  isCurrentEpisode?: boolean; // 🔧 NEW: Prop để highlight tập đang xem
}

export const EpisodeCard: React.FC<EpisodeCardProps> = ({
  episode,
  moviePoster,
  movieTitle,
  watchingProgress,
  onPress,
  disabled = false,
  isLocked = false,
  showUpdateStatus = false,
  isCurrentEpisode = false, // 🔧 NEW: Default false
}) => {
  // Kiểm tra xem episode này có progress không
  const hasProgress = watchingProgress && watchingProgress.episodeId === episode._id;
  const progressPercent = hasProgress ? watchingProgress.watchPercentage : 0;
  const isCompleted = hasProgress && watchingProgress.completed;
  
  // Đảm bảo duration có giá trị hợp lệ
  const episodeDuration = episode.duration || 0;

  const formatDuration = (duration: number): string => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        disabled && styles.containerDisabled,
        isCurrentEpisode && styles.containerCurrentEpisode // 🔧 NEW: Style cho tập đang xem
      ]}
      onPress={() => !disabled && onPress(episode)}
      disabled={disabled}
    >
      {/* Poster Container */}
      <View style={styles.posterContainer}>
        <Image
          source={{ 
            uri: moviePoster || 'https://via.placeholder.com/80x120/333/666?text=No+Image'
          }}
          style={styles.poster}
          resizeMode="cover"
        />
        
     
        
        {/* Progress Bar Overlay - Chỉ hiển thị cho episodes đang xem dở, không hiển thị cho episodes đã hoàn thành */}
        {hasProgress && progressPercent > 0 && !isCompleted && (
          <View style={styles.progressOverlay}>
            <View style={styles.progressBackground}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min(Math.max(progressPercent, 0), 100)}%`,
                    backgroundColor: '#FF0000' // 🔧 NEW: Màu đỏ cho tất cả episodes
                  }
                ]} 
              />
            </View>
          </View>
        )}

        {/* Locked Badge */}
        {isLocked && (
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedText}>🔒</Text>
          </View>
        )}
      </View>

      {/* Episode Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.episodeNumber}>
          Tập {episode.episode_number}
        </Text>
        <Text style={[
          styles.episodeTitle,
          disabled && styles.episodeTitleDisabled
        ]}>
          {episode.episode_title}
        </Text>
        <Text style={styles.episodeDuration}>
          {formatDuration(episodeDuration)}
        </Text>
        
        {/* Status Text */}
        {isLocked && (
          <Text style={styles.statusText}>Cần kích hoạt</Text>
        )}
        {showUpdateStatus && (
          <Text style={styles.updateStatusText}>Đang cập nhật</Text>
        )}
        
        {/* 🔧 NEW: Current Episode Status */}
        {isCurrentEpisode && (
          <Text style={styles.currentEpisodeStatus}>Đang xem</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  containerDisabled: {
    opacity: 0.5,
    backgroundColor: '#1a1a1a',
  },
  containerCompleted: {
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  // 🔧 NEW: Style cho tập đang xem - viền đỏ
  containerCurrentEpisode: {
    borderColor: '#FF0000',
    borderWidth: 2,
    backgroundColor: '#2a2a2a',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  posterContainer: {
    position: 'relative',
    marginRight: 12,
  },
  poster: {
    width: 80,
    height: 120,
    borderRadius: 8,
  },
  // 🔧 NEW: Badge cho tập đang xem - màu đỏ
  currentEpisodeBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#FF0000',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentEpisodeText: {
    fontSize: 12,
  },
  progressOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  progressBackground: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF0000', // Màu đỏ cho tất cả episodes
    borderRadius: 2,
  },
  completedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lockedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedText: {
    fontSize: 12,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  episodeNumber: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  episodeTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    marginBottom: 4,
    lineHeight: 20,
  },
  episodeTitleDisabled: {
    color: '#666',
  },
  episodeDuration: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#FF6B6B',
    fontStyle: 'italic',
  },
  updateStatusText: {
    fontSize: 12,
    color: '#FFA500',
    fontStyle: 'italic',
  },
  // 🔧 NEW: Style cho status tập đang xem - màu đỏ
  currentEpisodeStatus: {
    fontSize: 12,
    color: '#FF0000',
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
}); 