import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

// Screen width will be used for responsive design in future updates
// const { width: screenWidth } = Dimensions.get('window');

interface VideoPlayerProps {
  episodeId: string;
  movieTitle?: string;
  episodeTitle?: string;
  userId?: string;
  onProgressUpdate?: (progress: { currentTime: number; duration: number; percentage: number }) => void;
  onVideoEnd?: () => void;
  autoPlay?: boolean;
}

interface VideoData {
  uri: string;
  fallbackUri: string;
  poster: string;
  thumbnail: string;
  qualities: {
    low: string;
    medium: string;
    high: string;
  };
  duration: number;
  size: number;
  subtitles?: any;
}

interface StreamResponse {
  status: string;
  message?: string;
  data: {
    videoId: string;
    streamUid: string;
    video: VideoData;
    movie: {
      _id: string;
      title: string;
      type: string;
      is_free: boolean;
      price: number;
    };
    episode?: {
      _id: string;
      title: string;
      number: number;
    };
  };
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  episodeId,
  movieTitle,
  episodeTitle,
  userId,
  onProgressUpdate,
  onVideoEnd,
  autoPlay = false,
}) => {
  const videoRef = useRef<Video>(null);
  
  // State management
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [quality, setQuality] = useState<'auto' | '360p' | '480p' | '720p'>('auto');
  const [progressUpdateTimer, setProgressUpdateTimer] = useState<ReturnType<typeof setInterval> | null>(null);

  // Load video stream URL
  useEffect(() => {
    loadVideoStream();
  }, [episodeId, quality]); // loadVideoStream will be memoized in future optimization

  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls, isPlaying]);

  // Progress update for watching API
  useEffect(() => {
    if (isPlaying && userId && currentTime > 0) {
      // Update progress every 10 seconds
      const timer = setInterval(() => {
        updateWatchingProgress();
      }, 10000);
      setProgressUpdateTimer(timer);
      
      return () => {
        if (timer) clearInterval(timer);
      };
    } else {
      if (progressUpdateTimer) {
        clearInterval(progressUpdateTimer);
        setProgressUpdateTimer(null);
      }
    }
  }, [isPlaying, currentTime, userId]); // updateWatchingProgress and progressUpdateTimer will be memoized in future optimization

  const loadVideoStream = async () => {
    try {
      setLoading(true);
      setError(null);

      const qualityParam = quality !== 'auto' ? `&quality=${quality}` : '';
      const response = await fetch(
        `https://backend-app-lou3.onrender.com/api/video-url/${episodeId}?type=auto${qualityParam}`
      );

      const result: StreamResponse = await response.json();

      if (result.status === 'success') {
        setVideoData(result.data.video);
      } else if (result.status === 'processing') {
        setError('Video đang được xử lý, vui lòng thử lại sau vài phút');
      } else {
        setError(result.message || 'Không thể tải video');
      }
    } catch (err) {
      console.error('Error loading video:', err);
      setError('Lỗi kết nối, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const updateWatchingProgress = async () => {
    if (!userId || !currentTime || !duration) return;

    try {
      await fetch(`https://backend-app-lou3.onrender.com/api/watching/progress/${episodeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_time: Math.floor(currentTime),
          userId,
        }),
      });

      // Call parent callback if provided
      if (onProgressUpdate) {
        onProgressUpdate({
          currentTime: Math.floor(currentTime),
          duration: Math.floor(duration),
          percentage: Math.round((currentTime / duration) * 100),
        });
      }
    } catch (error) {
      console.error('Error updating watching progress:', error);
    }
  };

  const handlePlayPause = async () => {
    try {
      if (videoRef.current) {
        if (isPlaying) {
          await videoRef.current.pauseAsync();
        } else {
          await videoRef.current.playAsync();
        }
        setIsPlaying(!isPlaying);
      }
    } catch (error) {
      console.error('Error controlling playback:', error);
    }
  };

  const handleSeek = async (seekTime: number) => {
    try {
      if (videoRef.current) {
        await videoRef.current.setPositionAsync(seekTime * 1000);
        setCurrentTime(seekTime);
      }
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    
    // Update progress to 100% when video ends
    if (userId) {
      updateWatchingProgress();
    }
    
    // Call parent callback
    if (onVideoEnd) {
      onVideoEnd();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const changeQuality = (newQuality: typeof quality) => {
    if (newQuality !== quality) {
      setQuality(newQuality);
      Alert.alert('Đang thay đổi chất lượng', 'Video sẽ tải lại với chất lượng mới');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e50914" />
        <Text style={styles.loadingText}>Đang tải video...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#ff6b6b" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadVideoStream}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!videoData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không thể tải thông tin video</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.videoContainer} onPress={toggleControls} activeOpacity={1}>
        <Video
          ref={videoRef}
          source={{ uri: videoData.uri }}
          posterSource={{ uri: videoData.poster }}
          rate={1.0}
          volume={1.0}
          isMuted={false}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={isPlaying}
          isLooping={false}
          style={styles.video}
          onLoad={(status) => {
            if (status.isLoaded) {
              setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
            }
          }}
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded) {
              setCurrentTime(status.positionMillis ? status.positionMillis / 1000 : 0);
              setIsPlaying(status.isPlaying || false);
              
              if (status.didJustFinish) {
                handleVideoEnd();
              }
            }
          }}
          onError={(error) => {
            console.error('Video playback error:', error);
            setError('Lỗi phát video, thử với chất lượng thấp hơn');
          }}
        />

        {/* Video Controls Overlay */}
        {showControls && (
          <View style={styles.controlsOverlay}>
            {/* Top controls */}
            <View style={styles.topControls}>
              <Text style={styles.videoTitle}>
                {movieTitle} {episodeTitle && `- ${episodeTitle}`}
              </Text>
              
              {/* Quality selector */}
              <View style={styles.qualitySelector}>
                <Text style={styles.qualityLabel}>Chất lượng:</Text>
                {(['auto', '360p', '480p', '720p'] as const).map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={[
                      styles.qualityButton,
                      quality === q && styles.qualityButtonActive,
                    ]}
                    onPress={() => changeQuality(q)}
                  >
                    <Text style={[
                      styles.qualityText,
                      quality === q && styles.qualityTextActive,
                    ]}>
                      {q === 'auto' ? 'Tự động' : q}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Center play/pause button */}
            <TouchableOpacity style={styles.centerPlayButton} onPress={handlePlayPause}>
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={60}
                color="rgba(255, 255, 255, 0.9)"
              />
            </TouchableOpacity>

            {/* Bottom controls */}
            <View style={styles.bottomControls}>
              <View style={styles.progressContainer}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                
                <View style={styles.progressBar}>
                  <View style={styles.progressTrack} />
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` },
                    ]}
                  />
                </View>
                
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>

              <View style={styles.playbackControls}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => handleSeek(Math.max(0, currentTime - 10))}
                >
                  <Ionicons name="play-back" size={24} color="white" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButton} onPress={handlePlayPause}>
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={32}
                    color="white"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => handleSeek(Math.min(duration, currentTime + 10))}
                >
                  <Ionicons name="play-forward" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 8,  
    overflow: 'hidden',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#e50914',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
  },
  topControls: {
    padding: 16,
  },
  videoTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  qualitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  qualityLabel: {
    color: 'white',
    fontSize: 14,
    marginRight: 8,
  },
  qualityButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
  },
  qualityButtonActive: {
    backgroundColor: '#e50914',
  },
  qualityText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  qualityTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  centerPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -30 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    padding: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeText: {
    color: 'white',
    fontSize: 12,
    minWidth: 40,
    textAlign: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 12,
    borderRadius: 2,
    position: 'relative',
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#e50914',
    borderRadius: 2,
  },
  playbackControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    marginHorizontal: 16,
    padding: 8,
  },
});

export default VideoPlayer; 