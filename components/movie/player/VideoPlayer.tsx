import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text, TouchableOpacity, Dimensions } from 'react-native';
import { VideoView, useVideoPlayer, VideoPlayerStatus } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { userInteractionService } from '../../../services/userInteractionService';
import { Episode, REQUIRED_EPISODE_FIELDS } from '../../../types/episode';

const { width: screenWidth } = Dimensions.get('window');

interface VideoPlayerProps {
  episode: Episode;
  userId: string;
  movieId: string;
  movieType?: string;
  showTitle?: boolean;
  resumeFromTime?: number;
  onProgressUpdate?: (progress: number) => void;
  onEpisodeComplete?: () => void;
}

interface PlaybackStatus {
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  isBuffering: boolean;
  shouldPlay: boolean;
  error?: string;
}

// Helper function to validate episode data
const validateEpisode = (episode: Episode): { isValid: boolean; missingFields: string[] } => {
  const missingFields = REQUIRED_EPISODE_FIELDS.filter(field => !episode[field]);
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

// Helper function to validate video URL
const isValidVideoUrl = (url: string): boolean => {
  if (!url || url.trim() === '') {
    console.error('❌ [VideoPlayer] Empty video URL detected');
    return false;
  }
  
  // Check if it's a valid HTTP/HTTPS URL
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    console.error('❌ [VideoPlayer] Invalid video URL format:', url);
    return false;
  }
};

// Helper function to get video URL from episode
const getVideoUrl = (episode: Episode): string | null => {
  if (!episode.uri || episode.uri.trim() === '') {
    console.error('❌ [VideoPlayer] Episode has no video URL:', episode);
    return null;
  }
  
  // If it's already a valid URL, return it
  if (isValidVideoUrl(episode.uri)) {
    return episode.uri;
  }
  
  console.error('❌ [VideoPlayer] Invalid video URL in episode:', { 
    episodeId: episode._id,
    episodeTitle: episode.episode_title,
    uri: episode.uri 
  });
  return null;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  episode,
  userId,
  movieId,
  movieType = 'Phim bộ',
  showTitle = false,
  resumeFromTime,
  onProgressUpdate,
  onEpisodeComplete,
}) => {
  const videoUrlMemo = useMemo(() => getVideoUrl(episode), [episode]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedProgress, setLastSavedProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [currentEpisodeId, setCurrentEpisodeId] = useState(episode._id);
  const [hasNotifiedCompletion, setHasNotifiedCompletion] = useState(false);
  const [hasSetResumeTime, setHasSetResumeTime] = useState(false);
  
  // Reset states when episode changes
  useEffect(() => {
    if (episode._id !== currentEpisodeId) {
      console.log('🔄 [VideoPlayer] Episode changed, resetting player:', {
        oldEpisodeId: currentEpisodeId,
        newEpisodeId: episode._id,
        newTitle: episode.episode_title
      });

      // Reset states
      setIsLoading(true);
      setIsPlaying(false);
      setError(null);
      setLastSavedProgress(0);
      setRetryCount(0);
      setCurrentEpisodeId(episode._id);
      setHasNotifiedCompletion(false);
      setHasSetResumeTime(false);

      // Stop current playback
      if (playerRef.current) {
        playerRef.current.pause();
        
        // Small delay before loading new video to ensure clean state
        setTimeout(() => {
          if (playerRef.current && videoUrlMemo) {
            console.log('🎬 [VideoPlayer] Loading new episode:', episode.episode_title);
            playerRef.current.replace(videoUrlMemo);
            
            // 🔧 FIX: Set resume time ONLY once and track it
            if (resumeFromTime && resumeFromTime > 0 && !hasSetResumeTime) {
              console.log('⏯️ [VideoPlayer] Setting resume time:', resumeFromTime);
              playerRef.current.currentTime = resumeFromTime;
              setHasSetResumeTime(true);
            }
            
            // Start playback
            playerRef.current.play();
          }
        }, 100);
      }
    }
  }, [episode._id, videoUrlMemo, resumeFromTime, hasSetResumeTime]);

  // Initialize video player
  const player = useVideoPlayer(videoUrlMemo || '', (player) => {
    console.log('⚡ [VideoPlayer] Player initialized for:', episode.episode_title);
    player.volume = 1.0;
    player.muted = false;
    
    // 🔧 FIX: Set resume time ONLY once during initialization
    if (resumeFromTime && resumeFromTime > 0 && !hasSetResumeTime) {
      console.log('⏯️ [VideoPlayer] Setting initial resume time:', resumeFromTime);
      player.currentTime = resumeFromTime;
      setHasSetResumeTime(true);
    }
    player.play();
  });

  // Store player reference
  const playerRef = useRef(player);

  // Update player when URL changes
  useEffect(() => {
    if (!videoUrlMemo) return;

    try {
      const currentPlayer = playerRef.current;
      if (currentPlayer) {
        console.log('🔄 [VideoPlayer] Updating player URL for:', episode.episode_title);
        currentPlayer.pause();
        currentPlayer.replace(videoUrlMemo);
        
        // Reset state
        setIsLoading(true);
        setError(null);
        setLastSavedProgress(0);
        setRetryCount(0);

        // Start playback after a short delay
        setTimeout(() => {
          // 🔧 FIX: Only set resume time if not already set
          if (resumeFromTime && resumeFromTime > 0 && !hasSetResumeTime) {
            console.log('⏯️ [VideoPlayer] Setting resume time on URL update:', resumeFromTime);
            currentPlayer.currentTime = resumeFromTime;
            setHasSetResumeTime(true);
          }
          currentPlayer.play();
        }, 100);
      }
    } catch (err) {
      console.error('❌ [VideoPlayer] Error updating player:', err);
      setError('Không thể cập nhật trình phát video');
      setIsLoading(false);
    }
  }, [videoUrlMemo, resumeFromTime, hasSetResumeTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        const currentPlayer = playerRef.current;
        if (currentPlayer && currentPlayer.status !== 'error') {
          console.log('🧹 [VideoPlayer] Cleaning up player');
          currentPlayer.pause();
          // Let the garbage collector handle cleanup
          // instead of manually nulling the ref
        }
      } catch (err) {
        console.log('⚠️ [VideoPlayer] Cleanup error:', err);
        // Silently handle cleanup errors
      }
    };
  }, []);

  // Handle player status changes
  useEffect(() => {
    const currentPlayer = playerRef.current;
    if (!currentPlayer) return;

    if (currentPlayer.status === 'error') {
      console.error('❌ [VideoPlayer] Player error - Status:', currentPlayer.status);
      setError('Video playback error');
      setIsLoading(false);
    }
  }, [player.status]);

  // Handle playback status update
  const handlePlaybackStatusUpdate = useCallback((currentTime: number, duration: number, isPlaying: boolean) => {
    const currentPlayer = playerRef.current;
    if (!currentPlayer) return;

    // Convert milliseconds to seconds
    const currentTimeSec = Math.floor(currentTime / 1000);
    const durationSec = Math.floor(duration / 1000);

    if (!currentTimeSec || !durationSec) {
      console.log('⚠️ [VideoPlayer] Missing time values:', { currentTimeSec, durationSec });
      return;
    }

    const watchPercentage = Math.floor((currentTimeSec / durationSec) * 100);
    
    if (
      (!isPlaying && currentTimeSec > 0 && currentTimeSec !== lastSavedProgress) || // Paused
      (currentTimeSec % 10 === 0 && currentTimeSec !== lastSavedProgress) || // Every 10 seconds
      (currentTimeSec >= durationSec - 1 && currentTimeSec !== lastSavedProgress) || // Video ended
      (Math.abs(currentTimeSec - lastSavedProgress) > 5) // Seeking
    ) {
      saveProgress(currentTimeSec, watchPercentage, durationSec);
      setLastSavedProgress(currentTimeSec);
    }
  }, [lastSavedProgress, hasNotifiedCompletion]);

  // Save progress to backend
  const saveProgress = async (currentTime: number, watchPercentage: number, duration: number) => {
    try {
      // Validate required data
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Get the episode ID
      const episodeId = episode._id;
      if (!episodeId) {
        throw new Error('Episode ID is required');
      }

      const completed = watchPercentage >= 90;
      
      // Save progress
      await userInteractionService.updateWatchingProgress(
        episodeId,
        currentTime,
        duration,
        userId,
        completed
      );
      
      console.log(`✅ [VideoPlayer] Progress saved successfully: ${watchPercentage}%`);

      // Call callbacks if provided
      if (onProgressUpdate) {
        onProgressUpdate(watchPercentage);
      }

      // 🔧 FIX: Only call onEpisodeComplete once per episode
      if (completed && onEpisodeComplete && !hasNotifiedCompletion) {
        console.log('🎬 [VideoPlayer] Episode completed! Calling onEpisodeComplete callback');
        setHasNotifiedCompletion(true);
        onEpisodeComplete();
      }
    } catch (error) {
      console.error('❌ [VideoPlayer] Failed to save progress:', error);
    }
  };

  // Update progress periodically
  useEffect(() => {
    const currentPlayer = playerRef.current;
    if (!currentPlayer) return;

    const intervalId = setInterval(() => {
      handlePlaybackStatusUpdate(
        currentPlayer.currentTime * 1000,
        currentPlayer.duration * 1000,
        currentPlayer.playing
      );
    }, 1000);

    return () => clearInterval(intervalId);
  }, [handlePlaybackStatusUpdate]);

  // Add new effect to handle loading state based on player status
  useEffect(() => {
    if (!player) return;

    const handlePlayingState = () => {
      if (player.playing) {
        setIsPlaying(true);
        setIsLoading(false);
      } else {
        setIsPlaying(false);
      }
    };

    // Initial check
    handlePlayingState();

    // Setup interval to check playing state
    const intervalId = setInterval(handlePlayingState, 200);

    return () => clearInterval(intervalId);
  }, [player]);

  // Validate episode data
  const { isValid, missingFields } = validateEpisode(episode);
  const hasValidUrl = !!videoUrlMemo;

  if (!isValid || !hasValidUrl) {
    console.error('❌ [VideoPlayer] Cannot play video:', { 
      episode,
      missingFields,
      hasValidUrl,
      videoUrl: episode.uri
    });
    
    return (
      <View style={styles.wrapper}>
        <View style={styles.container}>
          <View style={styles.errorOverlay}>
            <Ionicons name="warning" size={48} color="#ff6b6b" />
            <Text style={styles.errorText}>Không thể phát video</Text>
            <Text style={styles.errorSubText}>
              {!hasValidUrl 
                ? 'Video không khả dụng. Vui lòng thử lại sau.'
                : 'Thông tin tập phim không hợp lệ'
              }
            </Text>
            {__DEV__ && (
              <Text style={styles.debugText}>
                {!hasValidUrl 
                  ? `URI không hợp lệ: "${episode.uri}"`
                  : `Thiếu các trường: ${missingFields.join(', ')}`
                }
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  }
  
  console.log('🎬 [VideoPlayer] Component initialized:', {
    episodeId: episode._id,
    episodeTitle: episode.episode_title,
    videoUrl: videoUrlMemo,
    originalUrl: episode.uri,
    userId,
    movieType,
    hasVideoUrl: !!videoUrlMemo,
    initTime: Date.now()
  });
  
  const currentPlayer = playerRef.current;

  return (
    <View style={styles.wrapper}>
      {/* Video Container */}
      <View style={styles.container}>
        {currentPlayer && (
          <VideoView
            style={styles.video}
            player={currentPlayer}
            allowsFullscreen
            allowsPictureInPicture
            contentFit="contain"
            nativeControls
          />
        )}
        
        {/* Loading Overlay - Only show when loading and not playing */}
        {(isLoading && !isPlaying) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#E50914" />
            <Text style={styles.loadingText}>Đang tải video...</Text>
          </View>
        )}

        {/* Buffering Overlay */}
        {!isLoading && !error && currentPlayer?.status === 'loading' && (
          <View style={styles.bufferingOverlay}>
            <View style={styles.bufferingIndicator}>
              <ActivityIndicator size="large" color="#E50914" />
              <Text style={styles.bufferingText}>Đang tải...</Text>
            </View>
          </View>
        )}

        {/* Error Overlay */}
        {error && (
          <View style={styles.errorOverlay}>
            <Ionicons name="warning" size={48} color="#ff6b6b" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                setIsLoading(true);
                const player = playerRef.current;
                if (player && videoUrlMemo) {
                  player.pause();
                  player.replace(videoUrlMemo);
                }
              }}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
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
          {currentPlayer?.duration && (
            <Text style={styles.videoDuration}>
              {Math.floor(currentPlayer.duration / 60)} phút
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
  debugLoadingText: {
    color: '#aaa',
    marginTop: 5,
    fontSize: 12,
    textAlign: 'center',
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

// Memoize với shallow comparison của props để tránh re-render không cần thiết
export default React.memo(VideoPlayer, (prevProps, nextProps) => {
  return (
    prevProps.episode._id === nextProps.episode._id &&
    prevProps.userId === nextProps.userId &&
    prevProps.movieType === nextProps.movieType &&
    prevProps.showTitle === nextProps.showTitle &&
    prevProps.resumeFromTime === nextProps.resumeFromTime
  );
}); 