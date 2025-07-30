import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Text, TouchableOpacity, Dimensions } from 'react-native';
import { VideoView, useVideoPlayer, VideoPlayerStatus } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { userInteractionService } from '../../../services/userInteractionService';
import { Episode, REQUIRED_EPISODE_FIELDS } from '../../../types/episode';
import eventBus from '../../../utils/eventBus';

const { width: screenWidth } = Dimensions.get('window');

interface VideoPlayerProps {
  episode: Episode;
  userId?: string;
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

// 🔧 FIX: Error Boundary Component for Video Player
class VideoPlayerErrorBoundary extends React.Component<
  { children: React.ReactNode; episode: Episode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; episode: Episode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.log('⚠️ [VideoPlayerErrorBoundary] Caught error:', error.message);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.log('⚠️ [VideoPlayerErrorBoundary] Error details:', {
      error: error.message,
      stack: error.stack,
      errorInfo
    });
  }

  componentDidUpdate(prevProps: { children: React.ReactNode; episode: Episode }) {
    // Reset error state when episode changes
    if (prevProps.episode._id !== this.props.episode._id) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  render() {
    if (this.state.hasError) {
      console.log('⚠️ [VideoPlayerErrorBoundary] Error occurred, returning empty container');
      return (
        <View style={styles.wrapper}>
          <View style={styles.container}>
            {/* Empty container - no error message */}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
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
    console.log('⚠️ [VideoPlayer] Empty video URL detected');
    return false;
  }
  
  // Check if it's a valid HTTP/HTTPS URL
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    console.log('⚠️ [VideoPlayer] Invalid video URL format:', url);
    return false;
  }
};

// Helper function to get video URL from episode
const getVideoUrl = (episode: Episode): string | null => {
  if (!episode.uri || episode.uri.trim() === '') {
    console.log('⚠️ [VideoPlayer] Episode has no video URL:', episode.episode_title);
    return null;
  }
  
  // If it's already a valid URL, return it
  if (isValidVideoUrl(episode.uri)) {
    return episode.uri;
  }
  
  console.log('⚠️ [VideoPlayer] Invalid video URL in episode:', { 
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
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isDestroying, setIsDestroying] = useState(false);
  
  // 🔧 FIX: Track player state to prevent native object access issues
  const playerStateRef = useRef({
    isInitialized: false,
    isDestroyed: false,
    currentEpisodeId: episode._id,
    lastUrl: null as string | null
  });

  // 🔧 FIX: Safe player operations with error handling
  const safePlayerOperation = useCallback((operation: (player: any) => void, fallback?: () => void) => {
    try {
      if (playerRef.current && !playerStateRef.current.isDestroyed) {
        // Additional safety check for native object validity
        if (playerRef.current && typeof playerRef.current.pause === 'function') {
          operation(playerRef.current);
        } else {
          console.warn('⚠️ [VideoPlayer] Player object is invalid, skipping operation');
          if (fallback) fallback();
        }
      } else if (fallback) {
        fallback();
      }
    } catch (err) {
      console.warn('⚠️ [VideoPlayer] Safe player operation failed:', err);
      if (fallback) fallback();
    }
  }, []);

  // 🔧 FIX: Clean player state when episode changes
  useEffect(() => {
    if (episode._id !== currentEpisodeId) {
      console.log('🔄 [VideoPlayer] Episode changed, cleaning up player:', {
        oldEpisodeId: currentEpisodeId,
        newEpisodeId: episode._id,
        newTitle: episode.episode_title
      });

      // Mark as destroying to prevent operations on invalid player
      setIsDestroying(true);
      playerStateRef.current.isDestroyed = true;

      // Reset states
      setIsLoading(true);
      setIsPlaying(false);
      setError(null);
      setLastSavedProgress(0);
      setRetryCount(0);
      setCurrentEpisodeId(episode._id);
      setHasNotifiedCompletion(false);
      setHasSetResumeTime(false);
      setIsPlayerReady(false);

      // Safe cleanup of current player
      safePlayerOperation(
        (player) => {
          try {
            if (player && typeof player.pause === 'function') {
              player.pause();
            }
          } catch (err) {
            console.warn('⚠️ [VideoPlayer] Cleanup pause failed:', err);
          }
        }
      );

      // Reset player state
      playerStateRef.current = {
        isInitialized: false,
        isDestroyed: false,
        currentEpisodeId: episode._id,
        lastUrl: null
      };

      // Small delay to ensure clean state before initializing new player
      const cleanupTimer = setTimeout(() => {
        setIsDestroying(false);
        console.log('✅ [VideoPlayer] Player cleanup completed, ready for new episode');
      }, 200);

      return () => clearTimeout(cleanupTimer);
    }
  }, [episode._id, currentEpisodeId, safePlayerOperation]);

  // 🔧 FIX: Initialize video player with proper error handling
  const player = useVideoPlayer(videoUrlMemo || '', (player) => {
    if (isDestroying || episode._id !== currentEpisodeId) {
      console.log('⚠️ [VideoPlayer] Player initialization skipped - component is destroying or episode changed');
      return;
    }

    console.log('⚡ [VideoPlayer] Player initialized for:', episode.episode_title);
    
    try {
      player.volume = 1.0;
      player.muted = false;
      
      // 🔧 FIX: Set resume time ONLY once during initialization
      if (resumeFromTime && resumeFromTime > 0 && !hasSetResumeTime) {
        console.log('⏯️ [VideoPlayer] Setting initial resume time:', resumeFromTime);
        player.currentTime = resumeFromTime;
        setHasSetResumeTime(true);
      }
      
      player.play();
      
      // Update player state
      playerStateRef.current.isInitialized = true;
      playerStateRef.current.lastUrl = videoUrlMemo;
      setIsPlayerReady(true);
      
    } catch (err) {
      console.log('⚠️ [VideoPlayer] Player initialization error:', err);
      setError('Không thể khởi tạo trình phát video');
      setIsLoading(false);
    }
  });

  // Store player reference
  const playerRef = useRef(player);

  // 🔧 FIX: Update player when URL changes with proper error handling
  useEffect(() => {
    if (!videoUrlMemo || isDestroying) return;

    try {
      const currentPlayer = playerRef.current;
      if (currentPlayer && !playerStateRef.current.isDestroyed) {
        console.log('🔄 [VideoPlayer] Updating player URL for:', episode.episode_title);
        
        // Safe pause
        safePlayerOperation(
          (player) => player.pause(),
          () => console.log('⚠️ [VideoPlayer] Could not pause player during URL update')
        );
        
        // Safe replace
        safePlayerOperation(
          (player) => player.replace(videoUrlMemo),
          () => console.log('⚠️ [VideoPlayer] Could not replace player URL')
        );
        
        // Reset state
        setIsLoading(true);
        setError(null);
        setLastSavedProgress(0);
        setRetryCount(0);

        // Start playback after a short delay
        setTimeout(() => {
          if (!isDestroying && episode._id === currentEpisodeId) {
            // 🔧 FIX: Only set resume time if not already set
            if (resumeFromTime && resumeFromTime > 0 && !hasSetResumeTime) {
              console.log('⏯️ [VideoPlayer] Setting resume time on URL update:', resumeFromTime);
              safePlayerOperation(
                (player) => player.currentTime = resumeFromTime,
                () => console.log('⚠️ [VideoPlayer] Could not set resume time')
              );
              setHasSetResumeTime(true);
            }
            
            // Safe play
            safePlayerOperation(
              (player) => player.play(),
              () => console.log('⚠️ [VideoPlayer] Could not start playback')
            );
          }
        }, 100);
      }
    } catch (err) {
      console.log('⚠️ [VideoPlayer] Error updating player:', err);
      setError('Không thể cập nhật trình phát video');
      setIsLoading(false);
    }
  }, [videoUrlMemo, resumeFromTime, hasSetResumeTime, isDestroying, currentEpisodeId, safePlayerOperation]);

  // 🔧 FIX: Enhanced cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 [VideoPlayer] Component unmounting, cleaning up player');
      setIsDestroying(true);
      playerStateRef.current.isDestroyed = true;
      
      safePlayerOperation(
        (player) => {
          try {
            if (player.status !== 'error' && typeof player.pause === 'function') {
              player.pause();
            }
          } catch (err) {
            console.log('⚠️ [VideoPlayer] Cleanup pause error (ignored):', err);
          }
        }
      );
    };
  }, [safePlayerOperation]);

  // 🔧 FIX: Handle player status changes with error boundary
  useEffect(() => {
    const currentPlayer = playerRef.current;
    if (!currentPlayer || isDestroying) return;

    try {
      if (currentPlayer.status === 'error') {
        console.log('⚠️ [VideoPlayer] Player error - Status:', currentPlayer.status);
        setError('Video playback error');
        setIsLoading(false);
      }
    } catch (err) {
      console.warn('⚠️ [VideoPlayer] Error checking player status:', err);
    }
  }, [player.status, isDestroying]);

  // Handle playback status update
  const handlePlaybackStatusUpdate = useCallback((currentTime: number, duration: number, isPlaying: boolean) => {
    if (isDestroying) return;

    const currentPlayer = playerRef.current;
    if (!currentPlayer) return;

    // Convert milliseconds to seconds
    const currentTimeSec = Math.floor(currentTime / 1000);
    const durationSec = Math.floor(duration / 1000);

    // Chặn gọi saveProgress khi thiếu dữ liệu hoặc dữ liệu không hợp lệ
    if (
      !currentTimeSec || !durationSec ||
      isNaN(currentTimeSec) || isNaN(durationSec) ||
      currentTimeSec <= 0 || durationSec <= 0
    ) {
      console.log('⚠️ [VideoPlayer] Missing or invalid time values:', { currentTimeSec, durationSec });
      return;
    }

    const watchPercentage = Math.floor((currentTimeSec / durationSec) * 100);
    
    // Lưu tiến trình ngay khi có thay đổi lớn (seek) hoặc theo điều kiện cũ
    if (
      (!isPlaying && currentTimeSec > 0 && currentTimeSec !== lastSavedProgress) || // Paused
      (currentTimeSec % 10 === 0 && currentTimeSec !== lastSavedProgress) || // Every 10 seconds
      (currentTimeSec >= durationSec - 1 && currentTimeSec !== lastSavedProgress) || // Video ended
      (Math.abs(currentTimeSec - lastSavedProgress) > 5) || // Seeking (thay đổi lớn)
      (currentTimeSec > 0 && lastSavedProgress === 0) // Lần đầu có tiến trình
    ) {
      console.log('💾 [VideoPlayer] Saving progress due to:', {
        currentTimeSec,
        lastSavedProgress,
        difference: Math.abs(currentTimeSec - lastSavedProgress),
        reason: Math.abs(currentTimeSec - lastSavedProgress) > 5 ? 'SEEK' : 'NORMAL'
      });
      
      saveProgress(currentTimeSec, watchPercentage, durationSec);
      setLastSavedProgress(currentTimeSec);
    }
  }, [lastSavedProgress, hasNotifiedCompletion, isDestroying]);

  // Save progress to backend
  const saveProgress = async (currentTime: number, watchPercentage: number, duration: number) => {
    try {
      // Validate required data
      if (!userId || userId === 'anonymous' || userId === 'null') {
        console.log('⚠️ [VideoPlayer] Skipping progress save for anonymous user');
        return; // Silently skip for anonymous users
      }

      // Get the episode ID
      const episodeId = episode._id;
      if (!episodeId) {
        throw new Error('Episode ID is required');
      }

      const completed = watchPercentage >= 90;
      
      // Log chi tiết trước khi gọi API
      console.log('[DEBUG][VideoPlayer] Gọi API lưu tiến trình:', {
        episodeId,
        currentTime,
        duration,
        userId,
        completed,
        watchPercentage
      });

      // Save progress
      await userInteractionService.updateWatchingProgress(
        episodeId,
        currentTime,
        duration,
        userId,
        completed
      );
      
      console.log(`✅ [VideoPlayer] Progress saved successfully: ${watchPercentage}%`, {
        episodeId,
        currentTime,
        duration,
        userId,
        completed
      });

      // Call callbacks if provided
      if (onProgressUpdate) {
        onProgressUpdate(watchPercentage);
      }

      // Emit progress update event for other components
      eventBus.emit('progress-updated', {
        episodeId,
        currentTime,
        watchPercentage,
        completed
      });

      // 🔧 FIX: Only call onEpisodeComplete once per episode
      if (completed && onEpisodeComplete && !hasNotifiedCompletion) {
        console.log('🎬 [VideoPlayer] Episode completed! Calling onEpisodeComplete callback');
        setHasNotifiedCompletion(true);
        onEpisodeComplete();
        
        // Emit movie watched event
        eventBus.emit('movie-watched', {
          episodeId,
          movieId: episode.movie_id,
          completed: true
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        console.log('⚠️ [VideoPlayer] Failed to save progress:', error.message);
      } else {
        console.log('⚠️ [VideoPlayer] Failed to save progress:', error);
      }
    }
  };

  // Update progress periodically
  useEffect(() => {
    if (isDestroying) return;

    let isMounted = true;
    let lastValidTime = 0;
    let hasStartedPlaying = false;
    
    // Delay để đảm bảo player đã load xong
    const delayId = setTimeout(() => {
      const intervalId = setInterval(() => {
        if (!isMounted || isDestroying) {
          clearInterval(intervalId);
          return;
        }

        const currentPlayer = playerRef.current;
        if (
          !currentPlayer ||
          typeof currentPlayer.currentTime !== 'number' ||
          typeof currentPlayer.duration !== 'number' ||
          typeof currentPlayer.playing !== 'boolean' ||
          currentPlayer.currentTime <= 0 ||
          currentPlayer.duration <= 0 ||
          !currentPlayer.playing // chỉ lấy khi đang phát
        ) {
          return;
        }
        
        // Đánh dấu đã bắt đầu playing
        if (!hasStartedPlaying && currentPlayer.playing && currentPlayer.currentTime > 0) {
          hasStartedPlaying = true;
          console.log('🎬 [VideoPlayer] Player started playing, beginning progress tracking');
        }
        
        // Chỉ lưu tiến trình sau khi đã bắt đầu playing
        if (hasStartedPlaying) {
          try {
            // Chỉ gọi khi currentTime thực sự thay đổi và hợp lệ
            if (currentPlayer.currentTime !== lastValidTime && currentPlayer.currentTime > 0) {
              console.log('⏯️ [VideoPlayer] Saving progress:', {
                currentTime: currentPlayer.currentTime,
                duration: currentPlayer.duration,
                percentage: Math.floor((currentPlayer.currentTime / currentPlayer.duration) * 100)
              });
              
              handlePlaybackStatusUpdate(
                currentPlayer.currentTime * 1000,
                currentPlayer.duration * 1000,
                currentPlayer.playing
              );
              lastValidTime = currentPlayer.currentTime;
            }
          } catch (err) {
            console.warn('⚠️ [VideoPlayer] Error in progress update interval:', err);
          }
        }
      }, 1000);

      return () => {
        isMounted = false;
        clearInterval(intervalId);
      };
    }, 2000); // Delay 2 giây để player load xong

    return () => {
      isMounted = false;
      clearTimeout(delayId);
    };
  }, [handlePlaybackStatusUpdate, videoUrlMemo, episode._id, isDestroying]);

  // Add new effect to handle loading state based on player status
  useEffect(() => {
    if (!player || isDestroying) return;

    const handlePlayingState = () => {
      try {
        if (player.playing) {
          setIsPlaying(true);
          setIsLoading(false);
        } else {
          setIsPlaying(false);
        }
      } catch (err) {
        console.warn('⚠️ [VideoPlayer] Error checking playing state:', err);
      }
    };

    // Initial check
    handlePlayingState();

    // Setup interval to check playing state
    const intervalId = setInterval(handlePlayingState, 200);

    return () => clearInterval(intervalId);
  }, [player, isDestroying]);

  // Validate episode data
  const { isValid, missingFields } = validateEpisode(episode);
  const hasValidUrl = !!videoUrlMemo;

  if (!isValid || !hasValidUrl) {
    console.log('⚠️ [VideoPlayer] Video not available, returning empty container:', { 
      episode: episode.episode_title,
      missingFields,
      hasValidUrl,
      videoUrl: episode.uri
    });
    
    // Return empty container instead of error message
    return (
      <View style={styles.wrapper}>
        <View style={styles.container}>
          {/* Empty container - no error message */}
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
    initTime: Date.now(),
    isDestroying,
    isPlayerReady
  });
  
  const currentPlayer = playerRef.current;

  return (
    <VideoPlayerErrorBoundary episode={episode}>
      <View style={styles.wrapper}>
        {/* Video Container */}
        <View style={styles.container}>
          {currentPlayer && !isDestroying && (
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

          {/* Error Overlay - Hidden for videos without content */}
          {error && (
            <View style={styles.errorOverlay}>
              {/* Empty error overlay - no error message */}
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
    </VideoPlayerErrorBoundary>
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

// 🔧 FIX: Create a wrapper component that forces remount on episode change
export const VideoPlayerWrapper: React.FC<VideoPlayerProps> = (props) => {
  // Use episode ID as key to force remount when episode changes
  const key = `${props.episode._id}-${props.movieId}`;
  
  return (
    <VideoPlayerErrorBoundary episode={props.episode}>
      <VideoPlayer
        key={key}
        {...props}
      />
    </VideoPlayerErrorBoundary>
  );
}; 