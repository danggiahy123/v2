import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { userInteractionService } from '../../../services/userInteractionService';

const { width: screenWidth } = Dimensions.get('window');

interface Episode {
  _id: string;
  episode_title: string;
  episode_number: number;
  video_url?: string;
  uri?: string; // Alternative field name
  duration?: number;
}

interface VideoPlayerProps {
  episode: Episode;
  userId: string;
  movieId: string;
  movieType?: string; // 'Phim lẻ' | 'Phim bộ'
  showTitle?: boolean; // Có hiển thị title bên dưới không
  onProgressUpdate?: (progress: number) => void;
  onEpisodeComplete?: () => void;
}

// Helper function to validate video URL
const isValidVideoUrl = (url: string): boolean => {
  if (!url) return false;
  
  // Check if it's a valid HTTP/HTTPS URL
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    // If it's not a valid URL, check if it's a relative path (which we consider invalid for video playback)
    return false;
  }
};

// Helper function to get video URL from episode
const getVideoUrl = (episode: Episode): string | null => {
  const url = episode.video_url || episode.uri;
  if (!url) return null;
  
  // If it's already a valid URL, return it
  if (isValidVideoUrl(url)) {
    return url;
  }
  
  // If it's a relative path like "media/movie.mp4", we know it's not a real video
  console.log('⚠️ [VideoPlayer] Invalid video URL detected:', url);
  return null;
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  episode,
  userId,
  movieId,
  movieType = 'Phim bộ',
  showTitle = false,
  onProgressUpdate,
  onEpisodeComplete,
}) => {
  const videoUrl = getVideoUrl(episode);
  
  console.log('🎬 [VideoPlayer] Component initialized:', {
    episodeId: episode._id,
    episodeTitle: episode.episode_title,
    videoUrl: videoUrl,
    originalUrl: episode.video_url || episode.uri,
    userId,
    movieId,
    movieType,
    hasVideoUrl: !!videoUrl
  });
  
  const [status, setStatus] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedProgress, setLastSavedProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const videoRef = useRef<Video>(null);
  const progressSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear interval on unmount
  useEffect(() => {
    const intervalRef = progressSaveIntervalRef.current;
    return () => {
      if (intervalRef) {
        clearInterval(intervalRef);
      }
    };
  }, []);

  // Auto-save progress every 10 seconds
  useEffect(() => {
    if (status.isLoaded && status.positionMillis && !status.isBuffering) {
      const currentTime = Math.floor(status.positionMillis / 1000);
      const duration = Math.floor(status.durationMillis / 1000);
      const watchPercentage = Math.floor((currentTime / duration) * 100);

      // Save progress every 10 seconds and if change is significant
      if (currentTime - lastSavedProgress >= 10 && watchPercentage > 0) {
        saveProgress(currentTime, watchPercentage, duration);
        setLastSavedProgress(currentTime);
      }

      // Callback for parent component
      if (onProgressUpdate) {
        onProgressUpdate(watchPercentage);
      }

      // Check if episode is completed (90% watched)
      if (watchPercentage >= 90 && onEpisodeComplete) {
        onEpisodeComplete();
      }
    }
  }, [status.positionMillis, status.isLoaded, status.isBuffering, status.durationMillis, lastSavedProgress, onProgressUpdate, onEpisodeComplete]);

  const saveProgress = async (currentTime: number, watchPercentage: number, duration: number) => {
    try {
      const completed = watchPercentage >= 90;
      await userInteractionService.updateWatchingProgress(
        episode._id,
        currentTime,
        watchPercentage,
        userId,
        completed
      );
      console.log(`⏯️ [VideoPlayer] Progress saved: ${watchPercentage}%`);
    } catch (error) {
      console.error('❌ [VideoPlayer] Failed to save progress:', error);
    }
  };

  const handlePlaybackStatusUpdate = (playbackStatus: any) => {
    console.log('📊 [VideoPlayer] Playback status update:', {
      isLoaded: playbackStatus.isLoaded,
      isPlaying: playbackStatus.isPlaying,
      positionMillis: playbackStatus.positionMillis,
      durationMillis: playbackStatus.durationMillis,
      isBuffering: playbackStatus.isBuffering,
      error: playbackStatus.error
    });
    
    // Log buffering state changes
    if (playbackStatus.isBuffering !== status.isBuffering) {
      if (playbackStatus.isBuffering) {
        console.log('⏳ [VideoPlayer] Started buffering');
      } else {
        console.log('✅ [VideoPlayer] Buffering completed'); 
      }
    }
    
    setStatus(playbackStatus);
    
    if (playbackStatus.isLoaded) {
      console.log('✅ [VideoPlayer] Video loaded successfully');
      setIsLoading(false);
      setError(null);
      setRetryCount(0);
    } else if (playbackStatus.error) {
      console.error('❌ [VideoPlayer] Playback error:', playbackStatus.error);
      setIsLoading(false);
      setError(playbackStatus.error);
    }
  };

  const handleRetry = () => {
    console.log('🔄 [VideoPlayer] Retrying video load...');
    setIsLoading(true);
    setError(null);
    setRetryCount(prev => prev + 1);
    
    // Force video reload
    if (videoRef.current) {
      videoRef.current.unloadAsync().then(() => {
        videoRef.current?.loadAsync({ uri: videoUrl! }, {}, false);
      });
    }
  };

  // No valid video URL available
  if (!videoUrl) {
    console.log('❌ [VideoPlayer] No valid video URL available:', {
      episode,
      hasVideoUrl: !!videoUrl,
      originalUrl: episode.video_url || episode.uri
    });
    
    return (
      <View style={styles.wrapper}>
        <View style={styles.container}>
          <View style={styles.placeholderContainer}>
            <Ionicons name="videocam-off" size={64} color="#666" />
            <Text style={styles.placeholderTitle}>Video đang được cập nhật</Text>
            <Text style={styles.placeholderSubtitle}>
              Tập phim này sẽ sớm có sẵn. Vui lòng quay lại sau.
            </Text>
            {(episode.video_url || episode.uri) && (
              <Text style={styles.debugText}>
                URL: {episode.video_url || episode.uri}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  }

  console.log('✅ [VideoPlayer] Rendering video player with URL:', videoUrl);
  
  return (
    <View style={styles.wrapper}>
      {/* Video Container */}
      <View style={styles.container}>
        <Video
          ref={videoRef}
          style={styles.video}
          source={{ uri: videoUrl }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping={false}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          onError={(error) => {
            console.error('❌ [VideoPlayer] Video component error:', error);
            setIsLoading(false);
            setError(error.toString());
          }}
          shouldPlay={false} // Don't auto-play
          onLoad={(status) => {
            console.log('📱 [VideoPlayer] Video onLoad event:', status);
          }}
          onLoadStart={() => {
            console.log('🔄 [VideoPlayer] Video loading started');
          }}
        />
        
        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#E50914" />
            <Text style={styles.loadingText}>Đang tải video...</Text>
          </View>
        )}

        {/* Buffering Overlay - Shows during playback buffering */}
        {!isLoading && !error && status.isLoaded && status.isBuffering && (
          <View style={styles.bufferingOverlay}>
            <View style={styles.bufferingIndicator}>
              <ActivityIndicator size="large" color="#E50914" />
              <Text style={styles.bufferingText}>Đang tải...</Text>
            </View>
          </View>
        )}

        {/* Error Overlay with Retry */}
        {error && (
          <View style={styles.errorOverlay}>
            <Ionicons name="warning" size={48} color="#ff6b6b" />
            <Text style={styles.errorText}>Không thể phát video</Text>
            <Text style={styles.errorSubText}>
              Máy chủ video chưa được cấu hình đúng cách
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={handleRetry}
              disabled={retryCount >= 3}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.retryButtonText}>
                {retryCount >= 3 ? 'Đã thử tối đa' : 'Thử lại'}
              </Text>
            </TouchableOpacity>
            {retryCount > 0 && (
              <Text style={styles.retryCountText}>
                Lần thử: {retryCount}/3
              </Text>
            )}
          </View>
        )}
      </View>
      
      {/* Episode Title Below Video - Clean UI like Netflix */}
      {showTitle && (
        <View style={styles.titleContainer}>
          <Text style={styles.videoTitle}>
            {movieType === 'Phim lẻ' 
              ? episode.episode_title // Chỉ hiện tên phim cho phim lẻ
              : `Tập ${episode.episode_number}: ${episode.episode_title}` // Hiện đầy đủ cho phim bộ
            }
          </Text>
          {status.isLoaded && status.durationMillis && (
            <Text style={styles.videoDuration}>
              {Math.floor(status.durationMillis / 60000)} phút
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: screenWidth, // Full width màn hình
  },
  container: {
    width: screenWidth, // Full width màn hình
    height: screenWidth * 9 / 16, // Tỷ lệ 16:9 theo width màn hình
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 10,
  },
  errorSubText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 20,
  },
  // Placeholder styles for invalid video URLs
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  placeholderTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  placeholderSubtitle: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  debugText: {
    color: '#666',
    fontSize: 10,
    marginTop: 15,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  // Retry button styles
  retryButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  retryCountText: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  // Title below video - Clean Netflix style
  titleContainer: {
    paddingHorizontal: 20, // Padding để text không dính sát mép màn hình
    paddingVertical: 12,
  },
  videoTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  videoDuration: {
    color: '#aaa',
    fontSize: 14,
  },
  bufferingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)', // Lighter background
    justifyContent: 'center',
    alignItems: 'center',
  },
  bufferingIndicator: {
    backgroundColor: 'rgba(0,0,0,0.8)', // Darker container for the indicator
    padding: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
  },
  bufferingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default VideoPlayer; 