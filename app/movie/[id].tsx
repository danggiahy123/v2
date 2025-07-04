/**
 * 🎬 MOVIE DETAIL SCREEN
 * 
 * Màn hình chi tiết phim với đầy đủ tính năng:
 * - Hiển thị thông tin phim
 * - User interactions (like, favorite, comment)
 * - Episode list
 * - Related movies
 * - Video player integration
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router, useRouter } from 'expo-router';
import { useMovieDetail } from '../../hooks/useMovieDetail';
import { Episode, REQUIRED_EPISODE_FIELDS } from '../../types/episode';
import { useAppSelector } from '../../store/hooks'; //check auth
import VideoPlayer from '../../components/movie/player/VideoPlayer';
import { RentalOptionsModal } from '../../components/rental/RentalOptionsModal';
import { useRentalStatus } from '../../hooks/useRentalStatus';
import { rentalService } from '../../services/rentalService';
import { shareMovie } from '../../services/shareService';

import { Notification } from '../../components/ui';
import { SkeletonLoader } from '../../components/ui/AnimatedElements';
import { getResumeWatchingInfo, getResumeButtonText, shouldShowContinueBadge } from '../../utils/watchingHelper';
import { useFocusEffect } from '@react-navigation/native';
import { RelatedMovies } from '../../components/movie';
// Removed Collapsible import - using inline logic


// Screen width for responsive design - will be used in future updates
// const { width: screenWidth } = Dimensions.get('window');

/**
 * 🎬 MOVIE DETAIL SCREEN COMPONENT
 */
export default function MovieDetailScreen() {
  const { id, autoPlay, fromContinueWatching, hasRentalAccess: initialRentalAccess, rentalSuccess, fromPayment } = useLocalSearchParams<{ 
    id: string; 
    autoPlay?: string; 
    fromContinueWatching?: string;
    hasRentalAccess?: string;
    rentalSuccess?: string;
    fromPayment?: string;
  }>();
    
  // Debug log for params
  console.log('🔍 [MovieDetail] Route params:', { 
    id, 
    autoPlay, 
    fromContinueWatching,
    initialRentalAccess,
    rentalSuccess,
    fromPayment,
    idType: typeof id 
  });
  
  // Early return if no movie ID
  if (!id || typeof id !== 'string') {
    console.log('❌ [MovieDetail] No valid movie ID provided');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' }}>
        <Text style={{ color: 'white', fontSize: 18 }}>ID phim không hợp lệ</Text>
      </View>
    );
  }
  
  // 🕐 DURATION HELPER
  const formatDuration = (duration: number): string => {
    // If duration is very large (> 300), assume it's in seconds
    if (duration > 300) {
      const minutes = Math.floor(duration / 60);
      const hours = Math.floor(minutes / 60);
      
      if (hours > 0) {
        const remainingMinutes = minutes % 60;
return `${hours}h ${remainingMinutes}min`;
      }
      return `${minutes}min`;
    }
    
    // If duration is small (<= 300), assume it's already in minutes
    if (duration >= 60) {
      const hours = Math.floor(duration / 60);
      const remainingMinutes = duration % 60;
      return `${hours}h ${remainingMinutes}min`;
    }
    
    return `${duration}min`;
  };
  
  // 🔐 GET AUTHENTICATED USER (Hidden UI like FPT Play)
  // Authentication logic still works - user gets login prompts when needed
  const auth = useAppSelector(state => state.auth);
  const userId = auth.isLoggedIn && auth.userId ? auth.userId : undefined;
  
  console.log('🔐 [MovieDetail] Auth state:', {
    isLoggedIn: auth.isLoggedIn,
    userId: userId,
    hasUser: !!auth.user
  });
  
  const {
    movieDetail,
    loading,
    refreshing,
    error,
    refresh,
    toggleLike,
    toggleFavorite,
    addComment,
    clearError
  } = useMovieDetail(id, { userId });

  // Force refresh on component mount to ensure fresh data
  useEffect(() => {
    console.log('🔄 [MovieDetail] Component mounted, forcing refresh');
    refresh();
  }, []);

  // Comment input state - will be used when comment input is implemented
  const [commentText, setCommentText] = useState('');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const commentInputRef = useRef<TextInput>(null);
  
  // 🎬 NEW ENHANCED FEATURES STATE - Video always visible
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);

  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');

  // 🎫 RENTAL STATE
  const [showRentalModal, setShowRentalModal] = useState(false);
  const {
    hasAccess: hasRentalAccess,
    rental: currentRental,
    remainingTime,
    isLoading: isLoadingRentalStatus,
    checkAccess: checkRentalAccess,
    forceRefresh: forceRefreshRental,
  } = useRentalStatus(
    userId || null, 
    movieDetail ? id : null,
    initialRentalAccess === 'true' // Parse string to boolean
  );
  
  const [activeTab, setActiveTab] = useState<'related' | 'comments'>('related');
  
  // 📖 DESCRIPTION EXPAND STATE
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  // 🎬 WATCH BUTTON STATE - để ẩn button sau khi click
  const [hasClickedWatchButton, setHasClickedWatchButton] = useState(false);

  // 🎫 FORCE REFRESH RENTAL STATUS AFTER SUCCESSFUL PAYMENT
  useEffect(() => {
    if (rentalSuccess === 'true' && fromPayment === 'true' && userId) {
      console.log('🎫 [MovieDetail] Payment successful, force refreshing rental status');
      // Force refresh rental status to reflect the new payment
      forceRefreshRental();
      
      // Show success notification
      showNotificationMessage('Thanh toán thành công! Bạn có thể xem phim ngay.', 'success');
}
  }, [rentalSuccess, fromPayment, userId, forceRefreshRental]);

  // 🔍 DEBUG: Track rental access changes
  useEffect(() => {
    console.log('🎫 [DEBUG] Rental access changed:', {
      hasRentalAccess,
      currentRental: !!currentRental,
      isLoadingRentalStatus,
      movieIsFree: movieDetail?.is_free,
      rentalSuccess,
      fromPayment,
      hasEverHadRentalAccess,
      initialRentalAccess
    });
    
    // Update rental access history
    if (hasRentalAccess === true) {
      setHasEverHadRentalAccess(true);
    }
  }, [hasRentalAccess, currentRental, isLoadingRentalStatus, movieDetail?.is_free, rentalSuccess, fromPayment]);

  // 🎬 RESET WATCH BUTTON STATE ON COMPONENT MOUNT
  useEffect(() => {
    console.log('🎬 [MovieDetail] Component mounting, resetting watch button state');
    // Chỉ reset nếu không phải từ Continue Watching
    if (fromContinueWatching !== 'true') {
      setHasClickedWatchButton(false);
    }
  }, [id, fromContinueWatching]); // Reset when movie ID changes

  // 🎬 AUTO-PLAY FROM CONTINUE WATCHING
  useEffect(() => {
    if (fromContinueWatching === 'true' && movieDetail) {
      console.log('🎬 [MovieDetail] Auto-playing from Continue Watching');
      setHasClickedWatchButton(true); // Ẩn button
      setShowVideoPlayer(true); // Mở video player
    }
  }, [fromContinueWatching, movieDetail]);

  // ⭐ DERIVED STATE FOR UI
  const hasLiked = Boolean(movieDetail?.userInteractions?.hasLiked);
  const isFavorite = Boolean(movieDetail?.userInteractions?.isFavorite);
  
  // 📱 NOTIFICATION HELPER
  const showNotificationMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
  };
  
  // 🎫 RENTAL NOTIFICATION DELAY STATE
  const [hasShownRentalNotification, setHasShownRentalNotification] = useState(false);
  const [hasShownEpisodeError, setHasShownEpisodeError] = useState(false);
  
  // 🎫 TRACK RENTAL ACCESS HISTORY (to handle back navigation from video player)
  const [hasEverHadRentalAccess, setHasEverHadRentalAccess] = useState(
    initialRentalAccess === 'true' || rentalSuccess === 'true'
  );
  
  // 🎬 GET DEFAULT EPISODE FOR VIDEO PLAYER WITH SMART RESUME
  const getDefaultEpisode = (): { 
    episode: Episode | null; 
    error?: string;
    resumeFromTime?: number;
    shouldAutoPlay?: boolean;
    resumeMessage?: string;
  } => {
    // Don't show error if still loading
    if (!movieDetail) {
      console.log('🎬 [DEBUG] getDefaultEpisode: No movieDetail (still loading)');
      return { episode: null }; // No error when loading
    }

    // 🔧 PAYMENT CHECK FIRST: If movie is not free and user doesn't have rental access
    // But allow if user has ever had rental access (for back navigation from video player)
    const hasAccessToMovie = movieDetail.is_free || hasRentalAccess || hasEverHadRentalAccess;
    if (!hasAccessToMovie) {
      console.log('💰 [DEBUG] Movie requires payment - no error, just return null');
      return { episode: null }; // No error for unpaid movies
    }

    // 🔧 ENHANCED: Handle series without episodes (only for paid movies)
    if (movieDetail.movie_type === 'Phim bộ') {
      if (!movieDetail.episodes || movieDetail.episodes.length === 0) {
        console.log('❌ [DEBUG] Series movie has no episodes');
        return { 
          episode: null, 
          error: 'Phim bộ này chưa có tập phim nào. Vui lòng thử lại sau hoặc liên hệ admin.' 
        };
      }

      // Check if any episode has valid URI (only for paid/accessible movies)
const episodesWithUri = movieDetail.episodes.filter(ep => ep.uri && ep.uri.trim() !== '');
      if (episodesWithUri.length === 0) {
        console.log('❌ [DEBUG] Series has episodes but no valid URIs');
        return { 
          episode: null, 
          error: 'Tập phim đang được cập nhật. Vui lòng thử lại sau.' 
        };
      }
    }

    // For single movies, check if we have episode data (only for paid/accessible movies)
    if (movieDetail.movie_type === 'Phim lẻ') {
      // Single movies should have URI directly or in episodes
      const hasDirectUri = movieDetail.uri && movieDetail.uri.trim() !== '';
      const hasEpisodeUri = movieDetail.episodes && movieDetail.episodes.length > 0 && 
                           movieDetail.episodes[0].uri && movieDetail.episodes[0].uri.trim() !== '';
      
      if (!hasDirectUri && !hasEpisodeUri) {
        console.log('❌ [DEBUG] Single movie has no valid URI');
        return { 
          episode: null, 
          error: 'Phim đang được cập nhật. Vui lòng thử lại sau.' 
        };
      }
    }

    // Sử dụng helper utility để xác định episode cần resume
    const resumeInfo = getResumeWatchingInfo({
      movieDetail,
      autoPlay: autoPlay === 'true',
      fromContinueWatching: fromContinueWatching === 'true'
    });

    if (!resumeInfo.episode) {
      console.log('❌ [DEBUG] No valid episode found from resume info');
      return { 
        episode: null, 
        error: 'Không tìm thấy tập phim phù hợp để phát' 
      };
    }

      // 🔧 ENHANCED: Validate episode URI (only for accessible movies)
  if (!resumeInfo.episode.uri || resumeInfo.episode.uri.trim() === '') {
    console.log('❌ [DEBUG] Selected episode has no valid URI:', {
      episodeId: resumeInfo.episode._id,
      episodeTitle: resumeInfo.episode.episode_title,
      movieIsFree: movieDetail.is_free,
      hasRentalAccess
    });
    
    // Don't show error if movie is not accessible (not paid)
    if (!hasAccessToMovie) {
      return { episode: null }; // No error for unpaid movies
    }
    
    return { 
      episode: null, 
      error: 'Tập phim này đang được cập nhật. Vui lòng chọn tập khác.' 
    };
  }

    console.log('🎬 [DEBUG] Resume info:', {
      hasEpisode: !!resumeInfo.episode,
      episodeTitle: resumeInfo.episode?.episode_title,
      episodeUri: resumeInfo.episode?.uri,
      shouldAutoPlay: resumeInfo.shouldAutoPlay,
      resumeFromTime: resumeInfo.resumeFromTime,
      resumeMessage: resumeInfo.resumeMessage,
    });

    return {
      episode: resumeInfo.episode,
      resumeFromTime: resumeInfo.resumeFromTime,
      shouldAutoPlay: resumeInfo.shouldAutoPlay,
      resumeMessage: resumeInfo.resumeMessage
    };
  };

  const { episode: defaultEpisode, error: defaultEpisodeError } = getDefaultEpisode();

  // Handle notifications in useEffect (only for accessible movies)
  useEffect(() => {
// Only show error notification if movieDetail is loaded and there's actually an error
    if (defaultEpisodeError && movieDetail && !loading && !hasShownEpisodeError) {
      // Don't show error notification if movie is not accessible (not paid)
      const hasAccessToMovie = movieDetail.is_free || hasRentalAccess || hasEverHadRentalAccess;
      if (!hasAccessToMovie) {
        console.log('💰 [DEBUG] Skipping error notification for unpaid movie');
        return;
      }
      
      console.log('🚨 [DEBUG] Showing episode error:', {
        error: defaultEpisodeError,
        movieTitle: movieDetail.movie_title,
        movieType: movieDetail.movie_type,
        hasEpisodes: !!movieDetail.episodes?.length,
        movieIsFree: movieDetail.is_free,
        hasRentalAccess
      });
      showNotificationMessage(defaultEpisodeError, 'error');
      setHasShownEpisodeError(true);
    }
  }, [defaultEpisodeError, movieDetail, loading, hasShownEpisodeError, hasRentalAccess, hasEverHadRentalAccess]);

  // 🔄 RESET NOTIFICATION STATE WHEN MOVIE CHANGES
  useEffect(() => {
    setHasShownRentalNotification(false);
    setHasShownEpisodeError(false);
  }, [id, movieDetail?.movie_title]);

  console.log('🎨 [UI State]', { 
    hasLiked, 
    isFavorite, 
    userInteractions: movieDetail?.userInteractions,
    hasDefaultEpisode: !!defaultEpisode,
    movieType: movieDetail?.movie_type,
    duration: movieDetail?.duration,
    formattedDuration: movieDetail?.duration ? formatDuration(movieDetail.duration) : 'N/A',
    defaultEpisodeError,
    loading,
    hasMovieDetail: !!movieDetail,
    hasShownEpisodeError,
    hasRentalAccess,
    hasEverHadRentalAccess,
    isLoadingRentalStatus,
    rentalSuccess,
    fromPayment
  });

  // 🔍 DEBUG: Duration formatting for all movies
  if (movieDetail?.duration) {
    console.log('⏱️ [UI] Duration Format Debug:', {
      movieId: id,
      title: movieDetail.movie_title,
      rawDuration: movieDetail.duration,
      formatDurationResult: formatDuration(movieDetail.duration),
      logicPath: movieDetail.duration > 300 ? 'seconds path' : movieDetail.duration >= 60 ? 'minutes->hours path' : 'minutes only path'
    });
  }

  // 💾 OFFLINE SUPPORT & AUTO PLAY LOGIC
  useEffect(() => {
    if (movieDetail && !loading) {
      // Movie detail loaded successfully - no offline caching needed for student project
      console.log('✅ [MovieDetail] Movie data loaded:', movieDetail.movie_title);
      
      // 🔧 DEBUG: Log movie detail data structure
      console.log('🔍 [DEBUG] Movie detail structure:', {
        movieId: movieDetail._id,
        movieTitle: movieDetail.movie_title,
        movieType: movieDetail.movie_type,
        hasEpisodes: !!movieDetail.episodes?.length,
        episodeCount: movieDetail.episodes?.length,
        episodes: movieDetail.episodes?.map(ep => ({
          id: ep._id,
          title: ep.episode_title,
          number: ep.episode_number,
hasUri: !!ep.uri
        })),
        userInteractions: movieDetail.userInteractions,
        watchingProgress: movieDetail.userInteractions?.watchingProgress
      });
      
      // Auto play video if autoPlay parameter is set
      if (autoPlay === 'true') {
        // For free movies or if user has rental access or just completed payment
        if (movieDetail.is_free || hasRentalAccess || hasEverHadRentalAccess || initialRentalAccess === 'true' || rentalSuccess === 'true') {
          // 🔧 FIX: Get the correct episode to resume based on movie type
          const { episode: resumeEpisode, resumeFromTime, resumeMessage } = getResumeWatchingInfo({
            movieDetail,
            autoPlay: true,
            fromContinueWatching: fromContinueWatching === 'true'
          });
          
          console.log('🎯 [AUTO-PLAY] Resume info:', {
            resumeEpisode: resumeEpisode?.episode_title,
            resumeEpisodeId: resumeEpisode?._id,
            resumeEpisodeNumber: resumeEpisode?.episode_number,
            resumeFromTime,
            resumeMessage,
            movieType: movieDetail.movie_type,
            fromContinueWatching: fromContinueWatching === 'true',
            autoPlay: autoPlay === 'true'
          });
          
          if (resumeEpisode) {
            // 🔧 FIX: Set currentEpisode for series, keep null for single movies
            if (movieDetail.movie_type === 'Phim bộ') {
              setCurrentEpisode(resumeEpisode);
              console.log('📺 [AUTO-PLAY] Set current episode for series:', {
                episodeId: resumeEpisode._id,
                episodeTitle: resumeEpisode.episode_title,
                episodeNumber: resumeEpisode.episode_number
              });
            } else {
              // For single movies, don't set currentEpisode, use defaultEpisode
              console.log('🎬 [AUTO-PLAY] Using default episode for single movie');
            }
            
            // Show video player
            setShowVideoPlayer(true);
            
            // Show resume message if available
            if (resumeMessage) {
              showNotificationMessage(resumeMessage, 'success');
            }
            
            console.log('🎯 [AUTO-PLAY] Video player activated with episode:', resumeEpisode.episode_title);
          }
        } else {
          console.log('⚠️ [AUTO-PLAY] No access to play video - showing rental modal');
          setShowRentalModal(true);
        }
      }
    }
  }, [movieDetail, loading, autoPlay, hasRentalAccess, hasEverHadRentalAccess, initialRentalAccess, fromContinueWatching, rentalSuccess]);

  // 🎫 SEPARATE EFFECT FOR RENTAL ACCESS CHECK
  useEffect(() => {
    if (movieDetail && !loading && !movieDetail.is_free && !isLoadingRentalStatus) {
      // Skip if user just completed payment
      if (rentalSuccess === 'true' && fromPayment === 'true') {
        return;
      }
// Only show rental notification after rental status is loaded and user doesn't have access
      // Skip if we're still loading rental status or have initial access
      if (initialRentalAccess !== 'true' && hasRentalAccess === false && !hasShownRentalNotification) {
        console.log('🎫 [DEBUG] User needs to rent movie:', {
          movieTitle: movieDetail.movie_title,
          hasRentalAccess,
          initialRentalAccess,
          userId: !!userId,
          isLoadingRentalStatus,
          hasShownRentalNotification
        });
        
        // Add small delay to ensure all status are properly loaded
        const timeoutId = setTimeout(() => {
          if (hasRentalAccess === false && !hasShownRentalNotification) {
            if (userId) {
              showNotificationMessage('Bạn cần thuê phim này để xem', 'error');
            } else {
              showNotificationMessage('Vui lòng đăng nhập để thuê phim', 'error');
            }
            setHasShownRentalNotification(true);
          }
        }, 500); // 500ms delay

        return () => clearTimeout(timeoutId);
      } else if (hasRentalAccess === true) {
        console.log('✅ [DEBUG] User has rental access:', {
          movieTitle: movieDetail.movie_title,
          hasRentalAccess,
          initialRentalAccess
        });
        setHasShownRentalNotification(false); // Reset for future navigation
      }
    }
  }, [movieDetail, loading, hasRentalAccess, initialRentalAccess, userId, isLoadingRentalStatus, hasShownRentalNotification, rentalSuccess, fromPayment]);

  // 🔄 REFRESH RENTAL STATUS WHEN SCREEN FOCUS
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 [MovieDetail] Screen focused - checking rental status');
      if (userId && movieDetail && !movieDetail.is_free) {
        // Force refresh rental status when user returns to this screen
        // This ensures button text is updated after rental cancellation
        forceRefreshRental();
      }
    }, [userId, movieDetail, forceRefreshRental])
  );

  // 🔧 ENHANCED: Episode validation with better error messages
  const validateEpisode = (episode: Episode): { isValid: boolean; missingFields: string[]; errorMessage?: string } => {
    const missingFields: string[] = [];
    
    REQUIRED_EPISODE_FIELDS.forEach(field => {
      if (!episode[field]) {
        missingFields.push(field);
      }
    });
    
    // Special validation for URI
    if (!episode.uri || episode.uri.trim() === '') {
      return {
        isValid: false,
        missingFields: ['uri'],
        errorMessage: 'Tập phim này đang được cập nhật. Vui lòng thử lại sau.'
      };
    }

    return { 
      isValid: missingFields.length === 0, 
      missingFields,
      errorMessage: missingFields.length > 0 ? 
        `Thiếu thông tin: ${missingFields.join(', ')}` : undefined
    };
  };

  // 🔧 ENHANCED: URL validation with better handling
const isValidVideoUrl = (url: string): boolean => {
    if (!url || url.trim() === '') return false;
    
    try {
      new URL(url);
      return true;
    } catch {
      // If URL parsing fails, check if it's a relative path or file identifier
      return url.length > 0 && url.trim() !== '';
    }
  };

  // 🎬 ENHANCED: Episode press handler with better error handling
  const handleEpisodePress = (episode: Episode) => {
    console.log('🎬 [DEBUG] Episode pressed:', {
      episodeId: episode._id,
      episodeTitle: episode.episode_title,
      episodeNumber: episode.episode_number,
      hasUri: !!episode.uri,
      uri: episode.uri
    });

    // 🔧 Enhanced validation
    const validation = validateEpisode(episode);
    if (!validation.isValid) {
      console.log('❌ [DEBUG] Episode validation failed:', validation);
      showNotificationMessage(
        validation.errorMessage || `Episode không hợp lệ: ${validation.missingFields.join(', ')}`, 
        'error'
      );
      return;
    }

    // URL validation
    if (!isValidVideoUrl(episode.uri)) {
      console.log('❌ [DEBUG] Invalid video URL:', episode.uri);
      showNotificationMessage('URL video không hợp lệ hoặc đang được cập nhật', 'error');
      return;
    }

    // Check user authentication for paid content
    if (!movieDetail?.is_free && !userId) {
      console.log('🔐 [DEBUG] User not authenticated for paid content');
      showNotificationMessage('Vui lòng đăng nhập để xem nội dung này', 'error');
      router.push('/login');
      return;
    }

    // Check rental access for paid content  
    if (!movieDetail?.is_free && userId && !hasRentalAccess && !hasEverHadRentalAccess) {
      console.log('🎫 [DEBUG] User needs to rent movie');
      showNotificationMessage('Bạn cần thuê phim để xem tập này', 'error');
      setShowRentalModal(true);
      return;
    }

    console.log('✅ [DEBUG] Episode validation passed, setting up video player');
    
    setCurrentEpisode(episode);
    setShowVideoPlayer(true);
    
    showNotificationMessage(`Đang phát: ${episode.episode_title}`, 'success');
  };

  // 🎹 KEYBOARD HANDLING
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      // Không auto scroll khi keyboard hiện - để user tự quyết định
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // =====================================
  // ENHANCED EVENT HANDLERS
  // =====================================

  // handlePlayPress - Removed, video player now always visible

  const handleLikePress = async () => {
    console.log('🔥 [DEBUG] Like button pressed!', {
      isLoggedIn: auth.isLoggedIn,
      userId: auth.userId,
hasMovieDetail: !!movieDetail,
      hasUserInteractions: !!movieDetail?.userInteractions
    });

    // User is always logged in due to app flow
    if (!auth.isLoggedIn) {
      console.log('❌ [DEBUG] User not logged in - this should not happen');
      return;
    }

    // userInteractions có thể null cho users chưa có interactions
    const currentLikeState = Boolean(movieDetail?.userInteractions?.hasLiked);
    const newLikeState = !currentLikeState;
    
    console.log('🔄 [DEBUG] About to toggle like:', { 
      currentLikeState, 
      newLikeState,
      userInteractions: movieDetail?.userInteractions,
      currentLikeCount: movieDetail?.likeCount
    });

    try {
      await toggleLike(newLikeState);

      showNotificationMessage(
        newLikeState ? 'Đã thêm vào danh sách yêu thích!' : 'Đã xóa khỏi danh sách yêu thích',
        'success'
      );
      console.log('✅ [DEBUG] Like toggle completed');
      
      // Like action completed successfully
    } catch (error) {
      console.log('❌ [DEBUG] Like toggle error:', error);
      showNotificationMessage('Không thể cập nhật trạng thái yêu thích', 'error');
    }
  };

  const handleFavoritePress = async () => {
    // User is always logged in due to app flow
    if (!auth.isLoggedIn) {
      console.log('❌ [DEBUG] User not logged in - this should not happen');
      return;
    }

    // userInteractions có thể null cho users chưa có interactions  
    const currentFavoriteState = Boolean(movieDetail?.userInteractions?.isFavorite);
    const newFavoriteState = !currentFavoriteState;

    try {
      await toggleFavorite(newFavoriteState);

      showNotificationMessage(
        newFavoriteState ? 'Đã thêm vào danh sách xem sau!' : 'Đã xóa khỏi danh sách xem sau',
        'success'
      );
      
      // Favorite action completed successfully
    } catch (err) {
      console.error('Favorite toggle error:', err);
      showNotificationMessage('Không thể cập nhật danh sách xem sau', 'error');
    }
  };



  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;
    
    try {
      console.log('💬 [Comment] Submitting comment:', commentText.trim());
      
      // Dismiss keyboard first for better UX
      Keyboard.dismiss();
      
      // 🚀 THỰC SỰ GỌI API ĐỂ THÊM COMMENT
      await addComment(commentText.trim());
      
      // Clear input ngay lập tức
      setCommentText('');
      
      // Hiển thị thông báo thành công
      showNotificationMessage('Đã thêm bình luận thành công!', 'success');
      
      console.log('✅ [Comment] Comment added successfully, UI will update automatically');
      
    } catch (error) {
      console.error('❌ [Comment] Submit error:', error);
      showNotificationMessage('Không thể thêm bình luận', 'error');
    }
  };


  const handleRelatedMoviePress = (movieId: string) => {
    router.push(`/movie/${movieId}`);
  };

  const handleSharePress = async () => {
    try {
      const result = await shareMovie(id);
      if (result.success) {
        showNotificationMessage('Chia sẻ thành công!', 'success');
      } else {
        showNotificationMessage('Lỗi khi chia sẻ: ' + (result.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error sharing movie:', error);
      showNotificationMessage('Không thể chia sẻ phim', 'error');
    }
  };

  // 🎫 RENTAL HANDLERS
  const handleRentPress = () => {
if (!movieDetail) return;
    
    if (movieDetail.is_free) {
      showNotificationMessage('Phim này miễn phí!', 'success');
      return;
    }

    if (!userId) {
      showNotificationMessage('Vui lòng đăng nhập để thuê phim', 'error');
      return;
    }

    // 🔧 FIX: Check if user just completed payment
    if (rentalSuccess === 'true' && fromPayment === 'true') {
      console.log('🎫 [DEBUG] User just completed payment, showing video player');
      setShowVideoPlayer(true);
      return;
    }

    // Nếu đã có quyền xem từ Continue Watching hoặc đã thuê
    if (initialRentalAccess === 'true' || hasRentalAccess) {
      setShowVideoPlayer(true);
      return;
    }

    setShowRentalModal(true);
  };

  const handleRentalSuccess = () => {
    console.log('🎫 [DEBUG] Rental success - forcing refresh');
    forceRefreshRental(); // Force refresh rental status
    showNotificationMessage('Thuê phim thành công!', 'success');
  };

  // =====================================
  // RENDER COMPONENTS
  // =====================================

  const renderAuthStatus = () => {
    return (
      
        <View style={styles.authStatusContainer}>
          <Text style={styles.authStatusText}>
            🔐 Auth Status: {auth.isLoggedIn ? '✅ Logged In' : '❌ Not Logged In'}
          </Text>
          {auth.isLoggedIn && auth.user && (
            <Text style={styles.authUserText}>
              👤 User: {auth.user.full_name} ({auth.userId})
            </Text>
          )}
          {!auth.isLoggedIn && (
            <TouchableOpacity 
              style={styles.quickLoginButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.quickLoginText}>Quick Login</Text>
            </TouchableOpacity>
          )}
        </View>
      
    );
  };

  const renderMovieInfo = () => {
    if (!movieDetail) return null;

    // Handle user interactions based on auth state
    const userInteractions = movieDetail.userInteractions;
    const hasLiked = Boolean(userInteractions?.hasLiked);
    const isFavorite = Boolean(userInteractions?.isFavorite);

    return (
      
        <View style={styles.movieInfoContainer}>
          {/* Header with Poster and Info */}
          <View style={styles.movieHeaderContainer}>
            {/* Movie Poster */}
            <View style={styles.posterContainer}>
              <Image 
                source={{ uri: movieDetail.poster_path }} 
                style={styles.moviePoster}
                resizeMode="cover"
              />
            </View>
            
            {/* Movie Info */}
            <View style={styles.movieInfoContent}>
          <Text style={styles.movieTitle}>{movieDetail.movie_title}</Text>
          
          <View style={styles.movieMetaRow}>
                <Text style={styles.movieYear}>
                  {movieDetail.production_time ? new Date(movieDetail.production_time).getFullYear() : '2024'}
3.
</Text>
            <Text style={styles.movieDot}>•</Text>
                <Text style={styles.movieStudio}>{movieDetail.producer || 'Studio'}</Text>
            <Text style={styles.movieDot}>•</Text>
            <Text style={styles.movieRating}>⭐ {movieDetail.rating ? movieDetail.rating.toFixed(1) : '9.6'}/10</Text>
          </View>
          
              <View style={styles.movieTypeContainer}>
                <Text style={styles.movieTypeText}>{movieDetail.movie_type || 'Phim lẻ'}</Text>
                {movieDetail.duration && (
                  <>
                    <Text style={styles.movieDot}>•</Text>
                    <Text style={styles.movieDuration}>
                      {formatDuration(movieDetail.duration)}
                    </Text>
                  </>
                )}
              </View>
              <View style={{ marginTop: 4 }}>
                {/* Custom Collapsible logic: show 3 lines, expand in place */}
                {movieDetail.description ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <Text 
                      style={styles.movieDescription}
                      numberOfLines={isDescriptionExpanded ? undefined : 3}
                    >
                      {movieDetail.description}
                    </Text>
                    
                    {movieDetail.description.length > 150 && (
                      <TouchableOpacity 
                        style={{ marginLeft: 4 }}
                        onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      >
                        <Text style={[styles.movieDescription, { marginLeft: 4 }]}>
                          {isDescriptionExpanded ? '... thu gọn' : '... xem thêm'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <Text style={[styles.movieDescription, { fontSize: 16, color: '#ccc', lineHeight: 24 }]}>
                    Không có nội dung phim.
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Action Buttons với icon vector chất lượng cao */}
          
            <View style={styles.actionRowContainer}>
              {/* View Count */}
              <View style={styles.actionItemWithCount}>
                <Ionicons name="eye-outline" size={24} color="#ffffff" />
                <Text style={styles.actionCount}>{movieDetail.viewCount || 70}</Text>
              </View>

              {/* Like Button with Count - Icon ❤️ */}
                  <TouchableOpacity
                    style={[
                      styles.actionItemWithCount,
                      !auth.isLoggedIn && styles.disabledAction
                    ]}
                    onPress={handleLikePress}
              >
                <Ionicons
name={hasLiked ? "heart" : "heart-outline"} 
                  size={24} 
                  color={hasLiked ? "#ff6b6b" : "#ffffff"} 
                />
                    <Text style={styles.actionCount}>{movieDetail.likeCount || 67}</Text>
                  </TouchableOpacity>
              

              {/* Favorite Button - Icon 🔖 */}
                  <TouchableOpacity
                    style={[
                      styles.actionItemWithCount,
                      !auth.isLoggedIn && styles.disabledAction
                    ]}
                    onPress={handleFavoritePress}
              >
                <Ionicons 
                  name={isFavorite ? "bookmark" : "bookmark-outline"} 
                  size={24} 
                  color={isFavorite ? "#ffc107" : "#ffffff"} 
                />
                    <Text style={styles.actionText}>Xem sau</Text>
                  </TouchableOpacity>



              {/* Share Button - Icon 📤 */}
              <TouchableOpacity style={styles.actionItemWithCount} onPress={handleSharePress}>
                <Ionicons name="share-social-outline" size={24} color="#ffffff" />
                <Text style={styles.actionText}>Chia sẻ</Text>
              </TouchableOpacity>
              </View>

          {/* Free Movie Watch Button */}
          {movieDetail && movieDetail.is_free && !hasClickedWatchButton && (
            <View style={styles.freeMovieContainer}>
              <TouchableOpacity 
                style={styles.freeWatchButton}
                onPress={() => {
                  setHasClickedWatchButton(true);
                  setShowVideoPlayer(true);
                }}
              >
                <Ionicons name="play-circle" size={24} color="#ffffff" />
                <Text style={styles.freeWatchText}>Xem miễn phí</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Rental Status Banner */}
          {movieDetail && !movieDetail.is_free && !hasClickedWatchButton && (
            <View style={styles.rentalContainer}>
              {hasRentalAccess && currentRental ? (
                <View style={styles.rentalAccessBanner}>
                  <View style={styles.rentalAccessInfo}>
                    <Text style={styles.rentalAccessTitle}> Đã thuê phim</Text>
                    {/* Debug info */}
                  
                    <Text style={styles.rentalAccessSubtitle}>
                      Gói: {currentRental.rentalType === '48h' ? 'Thuê 48 giờ' : 'Thuê 30 ngày'}
                </Text>
                    {remainingTime && (
                      <Text style={styles.rentalTimeRemaining}>
                        Còn lại: {rentalService.formatRemainingTime(remainingTime).formatted}
                </Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.watchNowButton}
                    onPress={() => {
                      console.log('🎬 [DEBUG] Xem ngay pressed', {
                        showVideoPlayer,
                        hasRentalAccess,
                        defaultEpisode: !!defaultEpisode,
                        movieIsFree: movieDetail?.is_free,
                        userId
                      });
                      setHasClickedWatchButton(true);
                      setShowVideoPlayer(true);
                    }}
                  >
                    <Text style={styles.watchNowText}>Xem ngay</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.rentalPrompt}>
                  <View style={styles.rentalPromptInfo}>
                    <Text style={styles.rentalPromptTitle}>Thuê phim để xem</Text>
                    <Text style={styles.rentalPromptSubtitle}>
                      Từ {rentalService.formatPrice(Math.round((movieDetail.price || 0) * 0.3))}
                    </Text>
                  </View>
            <TouchableOpacity
                    style={styles.rentButton}
                    onPress={handleRentPress}
            >
                    <Text style={styles.rentButtonText}>Thuê ngay</Text>
            </TouchableOpacity>
        </View>
              )}
            </View>
          )}
          
        </View>
      
    );
  };



  const renderEpisodes = () => {
    // Don't render if it's not a series
    if (movieDetail?.movie_type !== 'Phim bộ') return null;
    
    // Handle series without episodes
    if (!movieDetail?.episodes || movieDetail.episodes.length === 0) {
      return (
        <View style={styles.episodesContainer}>
          <Text style={styles.sectionTitle}>Tập phim</Text>
          <View style={styles.emptyEpisodesContainer}>
            <Text style={styles.emptyEpisodesText}>
              Phim bộ này chưa có tập phim nào.
            </Text>
            <Text style={styles.emptyEpisodesSubtext}>
              Vui lòng thử lại sau hoặc liên hệ admin.
            </Text>
          </View>
        </View>
      );
    }

    // Render episodes list
    return (
      <View style={styles.episodesContainer}>
        <Text style={styles.sectionTitle}>Tập phim ({movieDetail.episodes.length})</Text>
        {movieDetail.episodes.map((episode, index) => {
          const hasValidUri = episode.uri && episode.uri.trim() !== '';
          const canAccess = movieDetail.is_free || hasRentalAccess || hasEverHadRentalAccess;
          const shouldShowUpdateStatus = !hasValidUri && canAccess; // Only show "Đang cập nhật" if user has access
          
          return (
            <TouchableOpacity
              key={episode._id || index}
              style={[
                styles.episodeItem,
                (!hasValidUri || !canAccess) && styles.episodeItemDisabled
              ]}
              onPress={() => handleEpisodePress(episode)}
              disabled={!hasValidUri || !canAccess}
            >
              <Text style={styles.episodeNumber}>Tập {episode.episode_number}</Text>
              <Text style={[
                styles.episodeTitle,
(!hasValidUri || !canAccess) && styles.episodeTitleDisabled
              ]}>
                {episode.episode_title}
              </Text>
              <Text style={styles.episodeDuration}>
                {formatDuration(episode.duration)}
              </Text>
              {!canAccess && (
                <Text style={styles.episodeStatusLocked}>🔒 Cần thuê</Text>
              )}
              {shouldShowUpdateStatus && (
                <Text style={styles.episodeStatus}>Đang cập nhật</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderComments = () => {
    // 🔥 FIX: Hiển thị TẤT CẢ comments từ recentComments
    const allComments = movieDetail?.recentComments || [];
    
    if (allComments.length === 0) {
      return (
        
          <View style={styles.commentsContainer}>
            <Text style={styles.emptyCommentsText}>Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</Text>
          </View>
        
      );
    }

    return (
      
        <View style={styles.commentsContainer}>
          <Text style={styles.sectionTitle}>Bình luận ({allComments.length})</Text>
          {allComments.map((comment: any, index: number) => (
            <View key={comment._id || index} style={styles.commentItem}>
                  <Text style={styles.commentUser}>
                    {comment.user.name && comment.user.name !== 'Unknown User' 
                      ? comment.user.name 
                      : comment.user.email?.split('@')[0] || 'User'}
                  </Text>
                  <Text style={styles.commentText}>{comment.comment}</Text>
                  <Text style={styles.commentDate}>
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </Text>
              </View>
          ))}
        </View>
      
    );
  };

  const renderRelatedMovies = () => {
    if (!movieDetail) return null;

    return (

      <View style={styles.relatedContainer}>
        <RelatedMovies
          movieId={id}
          currentMovieGenres={movieDetail.genres}
          limit={8}
          showTitle={true}
          onMoviePress={handleRelatedMoviePress}
        />
      </View>

    );
  };

  // =====================================
  // LOADING & ERROR STATES
  // =====================================

  if (loading) {
    return (
      
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <ScrollView style={styles.scrollView}>
          {/* Skeleton Header */}
          <View style={styles.headerContainer}>
            <SkeletonLoader width={120} height={180} borderRadius={10} />
            <View style={[styles.headerInfo, { marginLeft: 15 }]}>
              <SkeletonLoader width="80%" height={24} style={{ marginBottom: 8 }} />
              <SkeletonLoader width="60%" height={16} style={{ marginBottom: 8 }} />
              <SkeletonLoader width="40%" height={16} style={{ marginBottom: 8 }} />
              <SkeletonLoader width="30%" height={16} style={{ marginBottom: 15 }} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <SkeletonLoader width={60} height={14} />
                <SkeletonLoader width={60} height={14} />
                <SkeletonLoader width={60} height={14} />
              </View>
            </View>
          </View>
          
          {/* Skeleton Action Buttons */}
          <View style={styles.actionContainer}>
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonLoader 
                key={index}
                width="23%" 
                height={48} 
                borderRadius={8}
                style={{ marginHorizontal: 4 }}
              />
            ))}
          </View>
          
          {/* Skeleton Description */}
          <View style={styles.descriptionContainer}>
            <SkeletonLoader width="40%" height={20} style={{ marginBottom: 15 }} />
            <SkeletonLoader width="100%" height={16} style={{ marginBottom: 5 }} />
            <SkeletonLoader width="100%" height={16} style={{ marginBottom: 5 }} />
            <SkeletonLoader width="70%" height={16} style={{ marginBottom: 15 }} />
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonLoader key={index} width={80} height={28} borderRadius={14} />
              ))}
            </View>
          </View>
          
          {/* Skeleton Episodes */}
          <View style={styles.episodesContainer}>
            <SkeletonLoader width="50%" height={20} style={{ marginBottom: 15 }} />
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonLoader 
                key={index}
                width="100%" 
                height={50} 
                borderRadius={8}
                style={{ marginBottom: 10 }}
              />
            ))}
          </View>
        </ScrollView>
        </SafeAreaView>
      
    );
  }

  if (error) {
    return (
      
        <SafeAreaView style={styles.container}>
<StatusBar barStyle="light-content" backgroundColor="#000" />
          
            <View style={styles.centerContainer}>
              <Text style={styles.errorText}>Error: {error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={clearError}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          
        </SafeAreaView>
      
    );
  }

  if (!movieDetail) {
    return (
      
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          
            <View style={styles.centerContainer}>
              <Text style={styles.errorText}>Movie not found</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
                <Text style={styles.retryButtonText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          
        </SafeAreaView>
      
    );
  }

  // =====================================
  // MAIN RENDER
  // =====================================

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* 📱 CUSTOM HEADER - Tránh tai thỏ iPhone */}
      <View style={styles.customHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {movieDetail?.movie_title || 'Movie Detail'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
      <ScrollView
          ref={scrollViewRef}
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#ff6b6b"
          />
        }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
      >
        {/* Auth Status - Hidden in production like FPT Play */}
        {/* {renderAuthStatus()} */}
        
        {/* 🎬 VIDEO PLAYER SECTION - Conditional based on movie type and rental status */}
        {showVideoPlayer && (currentEpisode || (!currentEpisode && defaultEpisode)) && (
          <View style={styles.videoPlayerContainer}>
            {/* Show video if: free movie OR user has rental access */}
            {(() => {
              // Nếu đã chọn tập phim cụ thể, không sử dụng defaultEpisode
              const episodeToPlay = currentEpisode || (!currentEpisode && defaultEpisode);
              const canShowVideo = movieDetail?.is_free || hasRentalAccess;
const renderTime = Date.now();

              console.log('🎬 [DEBUG] Video Player Conditions:', {
                canShowVideo: true,
                episodeToPlay: episodeToPlay?.episode_title,
                episodeToPlayId: episodeToPlay?._id,
                episodeToPlayNumber: episodeToPlay?.episode_number,
                episodeVideoUrl: episodeToPlay?.uri,
                hasCurrentEpisode: !!currentEpisode,
                hasDefaultEpisode: !!defaultEpisode,
                currentEpisodeInfo: currentEpisode ? {
                  id: currentEpisode._id,
                  title: currentEpisode.episode_title,
                  number: currentEpisode.episode_number
                } : null,
                defaultEpisodeInfo: defaultEpisode ? {
                  id: defaultEpisode._id,
                  title: defaultEpisode.episode_title,
                  number: defaultEpisode.episode_number
                } : null,
                hasRentalAccess,
                movieIsFree: movieDetail?.is_free,
                renderTime: Date.now(),
                userId: !!userId
              });

              // Validate episode before rendering
              if (!episodeToPlay?._id || !episodeToPlay?.episode_title || !episodeToPlay?.episode_number) {
                console.error('❌ [VideoPlayer] Invalid episode data:', episodeToPlay);
                return (
                  <View style={styles.placeholderContainer}>
                    <Text style={styles.placeholderText}>
                      Thông tin tập phim không hợp lệ
                    </Text>
                  </View>
                );
              }

              // Validate video URL (only for accessible movies)
              const videoUrl = episodeToPlay?.uri;
              if (!videoUrl) {
                console.log('❌ [VideoPlayer] No video URL available:', { 
                  episodeToPlay,
                  movieIsFree: movieDetail?.is_free,
                  hasRentalAccess
                });
                
                // Don't show error placeholder if movie is not accessible
                if (!movieDetail?.is_free && !hasRentalAccess) {
                  return null;
                }
                
                return (
                  <View style={styles.placeholderContainer}>
                    <Text style={styles.placeholderText}>
                      Video đang được cập nhật
                    </Text>
                  </View>
                );
              }

              return canShowVideo && showVideoPlayer && episodeToPlay ? (
                <VideoPlayer
                  episode={episodeToPlay}
                  userId={userId || 'anonymous'}
                  movieType={movieDetail?.movie_type}
                  movieId={id}
                  showTitle={false}
                  resumeFromTime={(() => {
                    // 🔧 FIX: Handle resume time correctly for auto-play vs manual play
// Case 1: Auto-play from Continue Watching - use resume info from getResumeWatchingInfo
                    if (autoPlay === 'true' && fromContinueWatching === 'true') {
                      const { resumeFromTime: autoResumeTime } = getResumeWatchingInfo({
                        movieDetail,
                        autoPlay: true,
                        fromContinueWatching: true
                      });
                      console.log('🔥 [RESUME] Auto-play from Continue Watching:', autoResumeTime);
                      return autoResumeTime;
                    }
                    
                    // Case 2: Manual episode selection - don't resume, start from beginning
                    if (currentEpisode) {
                      console.log('🔥 [RESUME] Manual episode selection - start from beginning');
                      return undefined;
                    }

                    // Case 3: Default episode for single movies or first episode - check for saved progress
                    const watchingProgress = movieDetail?.userInteractions?.watchingProgress;
                    const savedTime = watchingProgress?.currentTime;
                    const watchPercentage = watchingProgress?.watchPercentage;
                    
                    // Validate saved time
                    if (!savedTime || savedTime <= 0) return undefined;
                    if (watchPercentage && watchPercentage >= 90) return undefined;
                    if (savedTime > 7200) return undefined;
                    
                    const episodeDuration = episodeToPlay?.duration;
                    if (episodeDuration && savedTime >= episodeDuration - 10) {
                      console.log('⚠️ [AUTO-RESUME] Resume time too close to episode end, skipping');
                      return undefined;
                    }
                    
                    console.log('🎯 [AUTO-RESUME] Using saved progress for default episode:', {
                      savedTime,
                      watchPercentage,
                      episodeTitle: episodeToPlay?.episode_title
                    });
                    
                    return savedTime;
                  })()}
                  onProgressUpdate={(progress: number) => {
                    console.log(`⏯️ [VIDEO] Progress: ${progress}%`);
                  }}
                  onEpisodeComplete={() => {
                    console.log('🎬 [VIDEO] Episode completed!');
                    showNotificationMessage('Tập phim đã hoàn thành!', 'success');
                  }}
                />
              ) : (
                <View style={styles.placeholderContainer}>
                  <Text style={styles.placeholderText}>
                    {!movieDetail?.is_free && !hasRentalAccess
                      ? 'Vui lòng thuê phim để xem'
                      : 'Bấm vào nút play để xem phim'}
                  </Text>
                </View>
              );
})()}
          </View>
        )}
        
        
                          {/* 📽️ MOVIE INFO - Di chuyển xuống dưới video */}
          {renderMovieInfo()}
                  {renderEpisodes()}
         
         {/* 📋 TAB SYSTEM - Liên quan và Bình luận */}
         
           <View style={styles.tabContainer}>
             {/* Tab Headers */}
             <View style={styles.tabHeaderContainer}>
               <TouchableOpacity
                 style={[styles.tabHeader, activeTab === 'related' && styles.activeTabHeader]}
                 onPress={() => setActiveTab('related')}
               >
                 <Text style={[styles.tabHeaderText, activeTab === 'related' && styles.activeTabHeaderText]}>
                   Liên quan
                 </Text>
               </TouchableOpacity>
               <TouchableOpacity
                 style={[styles.tabHeader, activeTab === 'comments' && styles.activeTabHeader]}
                 onPress={() => setActiveTab('comments')}
               >
                 <Text style={[styles.tabHeaderText, activeTab === 'comments' && styles.activeTabHeaderText]}>
                   Bình luận
                 </Text>
               </TouchableOpacity>
             </View>
             
             {/* Tab Content */}
             <View style={styles.tabContent}>
               {activeTab === 'related' && (
                 <RelatedMovies    
                   movieId={id}
                   currentMovieGenres={movieDetail?.genres || []}
                   limit={8}
                   showTitle={false}
                   onMoviePress={handleRelatedMoviePress}
                 />
               )}
               
               {activeTab === 'comments' && (
                 
                   <View style={styles.commentsTabContent}>
                     {/* Comments List Only - Input moved to bottom */}
                     {renderComments()}
                   </View>
                 
               )}
             </View>
           </View>
         
        
        <View style={[styles.bottomSpacing, { 
          height: (isKeyboardVisible && activeTab === 'comments') ? 20 : 50 
        }]} />
      </ScrollView>



      {/* 💬 FIXED COMMENT INPUT - Only show when on comments tab */}
      {activeTab === 'comments' && (
        <View style={styles.fixedCommentInputContainer}>
          <View style={styles.commentInputWrapper}>
                         <TextInput
              ref={commentInputRef}
              style={styles.fixedCommentInput}
                           placeholder="Thêm bình luận..."
                           placeholderTextColor="#666"
                           multiline
              numberOfLines={2}
                           value={commentText}
                           onChangeText={setCommentText}
                           maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleCommentSubmit}
              blurOnSubmit={false}
                         />
<TouchableOpacity
                           style={[
                styles.fixedCommentSubmitButton,
                !commentText.trim() && styles.commentSubmitDisabled
                           ]}
                           onPress={handleCommentSubmit}
              disabled={!commentText.trim()}
                         >
                           <Text style={[
                styles.fixedCommentSubmitText,
                !commentText.trim() && styles.commentSubmitTextDisabled
                           ]}>
                             Gửi
                           </Text>
                         </TouchableOpacity>
                       </View>
                       
                         </View>
                       )}
                       
      </KeyboardAvoidingView>

      {/* 🎬 VIDEO PLAYER MODAL - Removed, now inline */}



      {/* 📱 NOTIFICATION */}
      <Notification
        visible={showNotification}
        message={notificationMessage}
        type={notificationType}
        onClose={() => setShowNotification(false)}
        autoClose={true}
        duration={3000}
      />

      {/* 🎫 RENTAL OPTIONS MODAL */}
      {movieDetail && (
        <RentalOptionsModal
          visible={showRentalModal}
          onClose={() => setShowRentalModal(false)}
          movie={{
            _id: movieDetail._id || id || '',
            title: movieDetail.movie_title,
            price: movieDetail.price || 0,
            poster: movieDetail.poster_path,
            is_free: movieDetail.is_free || false,
          }}
          userId={userId || ''}
          onRentalSuccess={handleRentalSuccess}
        />
      )}
    </SafeAreaView>
  );
}

// =====================================
// STYLES
// =====================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  // Custom Header - Tránh tai thỏ iPhone
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#000',

  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerSpacer: {
    width: 40, // Same width as back button for centering
  },
  
  // Movie Info Styles - New clean layout
  movieInfoContainer: {
    padding: 20,
    backgroundColor: '#000',
  },
  
  // Movie Header with Poster
  movieHeaderContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  posterContainer: {
    marginRight: 15,
  },
  moviePoster: {
    width: 120,
    height: 180,
    borderRadius: 12,
    backgroundColor: '#333',
},
  movieInfoContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  movieTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  movieTypeText: {
    fontSize: 14,
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  movieDuration: {
    fontSize: 14,
    color: '#aaa',
  },
  
  movieTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    lineHeight: 26,
  },
  movieMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  movieYear: {
    fontSize: 14,
    color: '#aaa',
  },
  movieDot: {
    fontSize: 14,
    color: '#aaa',
    marginHorizontal: 6,
  },
  movieStudio: {
    fontSize: 14,
    color: '#aaa',
  },
  movieRating: {
    fontSize: 14,
    color: '#ffc107',
    fontWeight: 'bold',
  },
  movieDescription: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
    marginBottom: 20,
  },
  
  // Action Buttons with Count - New horizontal layout
  actionRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 15,
    borderTopWidth: 0.5,
    borderTopColor: '#333',
  },
  actionItemWithCount: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionCount: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  actionText: {
    fontSize: 12,
    color: '#fff',
  },
  likedIcon: {
    color: '#ff6b6b',
  },
  favoriteIcon: {
    color: '#ffc107',
  },
  disabledAction: {
    opacity: 0.5,
  },
  
  // Tab System Styles
  tabContainer: {
    backgroundColor: '#000',
  },
  tabHeaderContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tabHeader: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  activeTabHeader: {
    borderBottomWidth: 2,
    borderBottomColor: '#ff6b6b',
  },
  tabHeaderText: {
    fontSize: 16,
    color: '#aaa',
    fontWeight: '500',
  },
  activeTabHeaderText: {
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  tabContent: {
    minHeight: 200,
  },
  emptyTabContent: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTabText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Comment Input Styles
  commentsTabContent: {
    flex: 1,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  commentSubmitButton: {
    backgroundColor: '#ff6b6b',
borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  commentSubmitDisabled: {
    backgroundColor: '#555',
  },
  commentSubmitText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  commentSubmitTextDisabled: {
    color: '#aaa',
  },

  characterCount: {
    position: 'absolute',
    bottom: 5,
    right: 15,
    fontSize: 12,
    color: '#666',
  },
  
  // Header Styles - Keep for backward compatibility
  headerContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#111',
  },
  posterImage: {
    width: 120,
    height: 180,
    borderRadius: 10,
    marginRight: 15,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  producer: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 5,
  },
  movieType: {
    fontSize: 14,
    color: '#ff6b6b',
    marginBottom: 5,
  },
  priceDisplay: {
    fontSize: 16,
    color: '#4caf50',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  statText: {
    fontSize: 14,
    color: '#fff',
  },
  
  // Action Buttons (3 buttons: Like, Favorite, Comment)
  actionContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#333',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  playButton: {
    backgroundColor: '#ff6b6b',
  },
  likedButton: {
    backgroundColor: '#e91e63',
  },
  favoriteButton: {
    backgroundColor: '#ffc107',
  },
  disabledButton: {
    opacity: 0.6,
    backgroundColor: '#555',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Content Sections
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  
  // Empty Comments
  emptyCommentsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  
  // Description
  descriptionContainer: {
    padding: 20,
  },
  descriptionText: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
    marginBottom: 15,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ff6b6b',
    borderRadius: 16,
  },
  genreText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  
  // Episodes
  episodesContainer: {
    padding: 20,
  },
  episodeItem: {
    flexDirection: 'row',
alignItems: 'center',
    padding: 15,
    backgroundColor: '#222',
    borderRadius: 8,
    marginBottom: 10,
  },
  episodeNumber: {
    fontSize: 14,
    color: '#ff6b6b',
    fontWeight: 'bold',
    minWidth: 40,
  },
  episodeTitle: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    marginLeft: 10,
  },
  episodeDuration: {
    fontSize: 14,
    color: '#aaa',
  },
  
  // Comments
  commentsContainer: {
    padding: 20,
  },
  commentItem: {
    padding: 15,
    backgroundColor: '#222',
    borderRadius: 8,
    marginBottom: 10,
  },
  commentUser: {
    fontSize: 14,
    color: '#ff6b6b',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  commentText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 5,
  },
  commentDate: {
    fontSize: 12,
    color: '#aaa',
  },
  
  // Related Movies
  relatedContainer: {
    padding: 20,
  },
  relatedMovieItem: {
    width: 120,
    marginRight: 15,
  },
  relatedMoviePoster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginBottom: 8,
  },
  relatedMovieTitle: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  
  // Loading & Error States
  loadingText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Auth Status
  authStatusContainer: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    margin: 20,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  authStatusText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  authUserText: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 10,
  },
  quickLoginButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  quickLoginText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // Spacing
  bottomSpacing: {
    height: 100,
  },

  // Fixed Comment Input (Bottom)
  fixedCommentInputContainer: {
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  commentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginBottom: 1,
  },
  fixedCommentInput: {
    flex: 1,
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  fixedCommentSubmitButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  fixedCommentSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fixedCharacterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 2,
  },


  
  // Video Player Container
  videoPlayerContainer: {
    margin: 0, // Loại bỏ margin để video full width
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  
  // Video Placeholder
  placeholderContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  placeholderText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  
  // Debug Toggle Styles
  debugToggleContainer: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    margin: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FF4081',
  },
  debugToggleButton: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  debugToggleActive: {
    backgroundColor: '#FF4081',
  },
  debugToggleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  debugHelpText: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // === RENTAL STYLES ===
  rentalContainer: {
    backgroundColor: '#1a1a1a',
    margin: 20,
    marginTop: 15,
    borderRadius: 12,
    padding: 16,
  },
  rentalAccessBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rentalAccessInfo: {
    flex: 1,
  },
  rentalAccessTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  rentalAccessSubtitle: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 2,
  },
  rentalTimeRemaining: {
    fontSize: 12,
    color: '#FFA500',
    fontWeight: '500',
  },
  watchNowButton: {
    backgroundColor: '#D11030',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  watchNowText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rentalPrompt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rentalPromptInfo: {
    flex: 1,
  },
  rentalPromptTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  rentalPromptSubtitle: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  rentButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  rentButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // === FREE MOVIE STYLES ===
  freeMovieContainer: {
    backgroundColor: '#000',
    margin: 20,
    marginTop: 15,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  freeWatchButton: {
backgroundColor: '#D11030',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  freeWatchText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Debug styles
  debugText: {
    color: '#888',
    fontSize: 10,
    fontStyle: 'italic',
  },

  // === EMPTY EPISODES STYLES ===
  emptyEpisodesContainer: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  emptyEpisodesText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyEpisodesSubtext: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // === DISABLED EPISODE STYLES ===
  episodeItemDisabled: {
    opacity: 0.5,
    backgroundColor: '#1a1a1a',
  },
  episodeTitleDisabled: {
    color: '#666',
  },
  episodeStatus: {
    color: '#FFA500',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  episodeStatusLocked: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
});