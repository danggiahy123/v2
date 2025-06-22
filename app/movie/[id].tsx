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

import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useMovieDetail } from '../../hooks/useMovieDetail';
import { Episode } from '../../types/movieDetail';
import { useAppSelector } from '../../store/hooks'; //check auth
import { VideoPlayer } from '../../components/movie/player/VideoPlayer';
import { CommentsModal } from '../../components/movie/interactions/CommentsModal';
import { PulseAnimation, SlideNotification, SkeletonLoader } from '../../components/ui/AnimatedElements';

// Screen width for responsive design - will be used in future updates
// const { width: screenWidth } = Dimensions.get('window');

/**
 * 🎬 MOVIE DETAIL SCREEN COMPONENT
 */
export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
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
    addComment, // Uncommented - sẽ dùng cho comment input
    clearError
  } = useMovieDetail(id, { userId });

  // Comment input state - will be used when comment input is implemented
  // const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  
  // 🎬 NEW ENHANCED FEATURES STATE - Video always visible
  const [showVideoPlayer, setShowVideoPlayer] = useState(false); // Will be removed
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('info');
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [favoriteAnimation, setFavoriteAnimation] = useState(false);
  
  
  
  const [activeTab, setActiveTab] = useState<'related' | 'comments'>('related');

  // ⭐ DERIVED STATE FOR UI
  const hasLiked = Boolean(movieDetail?.userInteractions?.hasLiked);
  const isFavorite = Boolean(movieDetail?.userInteractions?.isFavorite);
  
  // 🎬 GET DEFAULT EPISODE FOR VIDEO PLAYER
  const getDefaultEpisode = (): Episode | null => {
    if (!movieDetail) return null;

    // FOR PHIM BỘ (Series): Get first episode
    if (movieDetail.movie_type === 'Phim bộ') {
      if (movieDetail.episodes && movieDetail.episodes.length > 0) {
        return movieDetail.episodes[0];
      }
      return null;
    }

    // FOR PHIM LẺ (Single Movie): Create virtual episode
    if (movieDetail.movie_type === 'Phim lẻ') {
      const videoUrl = movieDetail.uri || movieDetail.video_url;
      if (!videoUrl) return null;

      return {
        _id: movieDetail._id || movieDetail.movieId || id,
        episode_title: movieDetail.movie_title,
        episode_number: 1,
        episode_description: movieDetail.description,
        video_url: videoUrl,
        duration: movieDetail.duration || 0,
        movie_id: movieDetail._id || movieDetail.movieId || id,
        createdAt: movieDetail.createdAt || new Date().toISOString(),
        updatedAt: movieDetail.updatedAt || new Date().toISOString()
      };
    }

    return null;
  };

  const defaultEpisode = getDefaultEpisode();
  
  console.log('🎨 [UI State]', { 
    hasLiked, 
    isFavorite, 
    userInteractions: movieDetail?.userInteractions,
    hasDefaultEpisode: !!defaultEpisode,
    movieType: movieDetail?.movie_type,
    duration: movieDetail?.duration,
    formattedDuration: movieDetail?.duration ? formatDuration(movieDetail.duration) : 'N/A'
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

  // 💾 OFFLINE SUPPORT
  useEffect(() => {
    if (movieDetail && !loading) {
      // Movie detail loaded successfully - no offline caching needed for student project
      console.log('✅ [MovieDetail] Movie data loaded:', movieDetail.movie_title);
    }
  }, [movieDetail, loading, id]);

  // 📱 NOTIFICATION HELPER
  const showNotificationMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
  };

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
      setLikeAnimation(true);
      showNotificationMessage(
        newLikeState ? 'Added to liked movies!' : 'Removed from liked movies',
        'success'
      );
      console.log('✅ [DEBUG] Like toggle completed');
      
      // Like action completed successfully
    } catch (error) {
      console.log('❌ [DEBUG] Like toggle error:', error);
      showNotificationMessage('Failed to update like status', 'error');
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
      setFavoriteAnimation(true);
      showNotificationMessage(
        newFavoriteState ? 'Added to favorites!' : 'Removed from favorites',
        'success'
      );
      
      // Favorite action completed successfully
    } catch (err) {
      console.error('Favorite toggle error:', err);
      showNotificationMessage('Failed to update favorite status', 'error');
    }
  };

    const handleCommentPress = () => {
    setShowCommentsModal(true);
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;
    
    try {
      console.log('💬 [Comment] Submitting comment:', commentText.trim());
      
      // 🚀 THỰC SỰ GỌI API ĐỂ THÊM COMMENT
      await addComment(commentText.trim());
      
      // Clear input ngay lập tức
      setCommentText('');
      
      // Hiển thị thông báo thành công
      showNotificationMessage('Comment added successfully!', 'success');
      
      console.log('✅ [Comment] Comment added successfully, UI will update automatically');
      
    } catch (error) {
      console.error('❌ [Comment] Submit error:', error);
      showNotificationMessage('Failed to add comment', 'error');
    }
  };

  // Comment submit handler - will be implemented when comment input is ready
  // const handleCommentSubmit = async () => {
  //   if (!commentText.trim()) return;
  //   
  //   try {
  //     await addComment(commentText.trim());
  //     setCommentText('');
  //     // setShowCommentInput(false); // Will be uncommented when comment input is implemented
  //     Alert.alert('Success', 'Comment added successfully!');
  //   } catch (err) {
  //     console.error('Comment submit error:', err);
  //     Alert.alert('Error', 'Failed to add comment. Please try again.');
  //   }
  // };

  const handleEpisodePress = (episode: Episode) => {
    setCurrentEpisode(episode);
    setShowVideoPlayer(true);
    console.log('🎬 Opening video player for episode:', episode.episode_title);
  };

  const handleRelatedMoviePress = (movieId: string) => {
    router.push(`/movie/${movieId}`);
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
              
              <Text style={styles.movieDescription} numberOfLines={4}>
            {movieDetail.description}
          </Text>
            </View>
          </View>

          {/* Action Buttons với icon giống hệt trong ảnh */}
          
            <View style={styles.actionRowContainer}>
              {/* View Count */}
              <View style={styles.actionItemWithCount}>
                <Text style={styles.actionIcon}>👁️</Text>
                <Text style={styles.actionCount}>{movieDetail.viewCount || 70}</Text>
              </View>

              {/* Like Button with Count - Icon ❤️ */}
              
                <PulseAnimation trigger={likeAnimation} color="#ff6b6b">
                  <TouchableOpacity
                    style={[
                      styles.actionItemWithCount,
                      !auth.isLoggedIn && styles.disabledAction
                    ]}
                    onPress={handleLikePress}
                    onPressOut={() => setLikeAnimation(false)}
                  >
                    <Text style={[styles.actionIcon, hasLiked && styles.likedIcon]}>
                      ❤️
                    </Text>
                    <Text style={styles.actionCount}>{movieDetail.likeCount || 67}</Text>
                  </TouchableOpacity>
                </PulseAnimation>
              

              {/* Favorite Button - Icon 🔖 */}
              
                <PulseAnimation trigger={favoriteAnimation} color="#ffc107">
                  <TouchableOpacity
                    style={[
                      styles.actionItemWithCount,
                      !auth.isLoggedIn && styles.disabledAction
                    ]}
                    onPress={handleFavoritePress}
                    onPressOut={() => setFavoriteAnimation(false)}
                  >
                    <Text style={[styles.actionIcon, isFavorite && styles.favoriteIcon]}>
                      🔖
                    </Text>
                    <Text style={styles.actionText}>Yêu thích</Text>
                  </TouchableOpacity>
                </PulseAnimation>


              {/* Share Button - Icon 📤 */}
              <View style={styles.actionItemWithCount}>
                <Text style={styles.actionIcon}>📤</Text>
                <Text style={styles.actionText}>Chia sẻ</Text>
              </View>
            </View>
          
        </View>
      
    );
  };

  const renderActionButtons = () => {
    if (!movieDetail) return null;

    // Handle user interactions based on auth state
    const userInteractions = movieDetail.userInteractions;
    const hasLiked = Boolean(userInteractions?.hasLiked);
    const isFavorite = Boolean(userInteractions?.isFavorite);

    return (
      
        <View style={styles.actionContainer}>
          
            <PulseAnimation trigger={likeAnimation} color="#ff6b6b">
              <TouchableOpacity
                style={[
                  styles.actionButton, 
                  hasLiked && styles.likedButton
                ]}
                onPress={handleLikePress}
                onPressOut={() => setLikeAnimation(false)}
              >
                <Text style={styles.actionButtonText}>
                  {hasLiked ? '❤️' : '🤍'} Like
                </Text>
              </TouchableOpacity>
            </PulseAnimation>


          
            <PulseAnimation trigger={favoriteAnimation} color="#ffc107">
              <TouchableOpacity
                style={[
                  styles.actionButton, 
                  isFavorite && styles.favoriteButton
                ]}
                onPress={handleFavoritePress}
                onPressOut={() => setFavoriteAnimation(false)}
              >
                <Text style={styles.actionButtonText}>
                  {isFavorite ? '⭐' : '☆'} Favorite
                </Text>
              </TouchableOpacity>
            </PulseAnimation>


          
            <TouchableOpacity
                style={styles.actionButton}
              onPress={handleCommentPress}
            >
                          <Text style={styles.actionButtonText}>
              💬 Comment
            </Text>
            </TouchableOpacity>
          
        </View>
      
    );
  };

  const renderDescription = () => {
    if (!movieDetail) return null;

    return (
      
        <View style={styles.descriptionContainer}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{movieDetail.description}</Text>
          
          
            <View style={styles.genresContainer}>
              {movieDetail.genres.map((genre, index) => (
                <View key={genre._id} style={styles.genreTag}>
                  <Text style={styles.genreText}>{genre.name}</Text>
                </View>
              ))}
            </View>
          
        </View>
      
    );
  };

  const renderEpisodes = () => {
    if (!movieDetail?.episodes || movieDetail.episodes.length === 0) return null;

    return (
      
        <View style={styles.episodesContainer}>
          <Text style={styles.sectionTitle}>Episodes ({movieDetail.episodes.length})</Text>
          {movieDetail.episodes.map((episode, index) => (
            
              <TouchableOpacity
                style={styles.episodeItem}
                onPress={() => handleEpisodePress(episode)}
              >
                <Text style={styles.episodeNumber}>Ep {episode.episode_number}</Text>
                <Text style={styles.episodeTitle}>{episode.episode_title}</Text>
                <Text style={styles.episodeDuration}>
                  {formatDuration(episode.episode_duration || episode.duration || 0)}
                </Text>
              </TouchableOpacity>
            
          ))}
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
            
              <View style={styles.commentItem}>
                
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
    if (!movieDetail?.relatedMovies || movieDetail.relatedMovies.length === 0) return null;

    return (
      
        <View style={styles.relatedContainer}>
          <Text style={styles.sectionTitle}>Related Movies</Text>
          
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {movieDetail.relatedMovies.map((movie, index) => (
                
                  <TouchableOpacity
                    style={styles.relatedMovieItem}
                    onPress={() => handleRelatedMoviePress(movie.movieId)}
                  >
                    
                      <Image
                        source={{ uri: movie.poster }}
                        style={styles.relatedMoviePoster}
                        resizeMode="cover"
                      />
                    
                    
                      <Text style={styles.relatedMovieTitle} numberOfLines={2}>
                        {movie.title}
                      </Text>
                    
                  </TouchableOpacity>
                
              ))}
            </ScrollView>
          
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
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {movieDetail?.movie_title || 'Movie Detail'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#ff6b6b"
          />
        }
      >
        {/* Auth Status - Hidden in production like FPT Play */}
        {/* {renderAuthStatus()} */}
        
        {/* 🎬 VIDEO PLAYER SECTION - Always visible */}
        
            <View style={styles.videoPlayerContainer}>
            {defaultEpisode && userId ? (
              <VideoPlayer
                episode={defaultEpisode}
                userId={userId}
                movieId={id}
                movieType={movieDetail?.movie_type} // Truyền loại phim để xử lý UI
                showTitle={false} // Không hiện title trong video nữa
                onProgressUpdate={(progress) => {
                  console.log(`⏯️ [VIDEO] Progress: ${progress}%`);
                }}
                onEpisodeComplete={() => {
                  console.log('🎬 [VIDEO] Episode completed!');
                  showNotificationMessage('Episode completed!', 'success');
                }}
              />
            ) : (
              <View style={styles.videoPlaceholder}>
                <View style={styles.videoPlaceholderContent}>
                  <Ionicons name="videocam-off" size={48} color="#666" />
                  <Text style={styles.videoPlaceholderTitle}>Video đang được cập nhật</Text>
                  <Text style={styles.videoPlaceholderSubtitle}>
                    Video sẽ có sẵn trong thời gian tới
                  </Text>
            </View>
              </View>
        )}
          </View>
        
        
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
                 
                   <View style={styles.emptyTabContent}>
                     <Text style={styles.emptyTabText}>Phim liên quan sẽ được phát triển trong tương lai</Text>
                   </View>
                 
               )}
               
               {activeTab === 'comments' && (
                 
                   <View style={styles.commentsTabContent}>
                     {/* Comment Input Section */}
                     
                       <View style={styles.commentInputContainer}>
                         <TextInput
                           style={styles.commentInput}
                           placeholder="Thêm bình luận..."
                           placeholderTextColor="#666"
                           multiline
                           numberOfLines={3}
                           value={commentText}
                           onChangeText={setCommentText}
                           maxLength={500}
                         />
                         <TouchableOpacity
                           style={[
                             styles.commentSubmitButton,
                             !commentText.trim() && styles.commentSubmitDisabled
                           ]}
                           onPress={handleCommentSubmit}
                           disabled={!commentText.trim()}
                         >
                           <Text style={[
                             styles.commentSubmitText,
                             !commentText.trim() && styles.commentSubmitTextDisabled
                           ]}>
                             Gửi
                           </Text>
                         </TouchableOpacity>
                       </View>
                       
                       <Text style={styles.characterCount}>
                         {commentText.length}/500
                       </Text>
                     
                     
                     {/* Comments List */}
                     {renderComments()}
                   </View>
                 
               )}
             </View>
           </View>
         
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* 🎬 VIDEO PLAYER MODAL - Removed, now inline */}

      {/* 💬 COMMENTS MODAL */}
      <CommentsModal
        visible={showCommentsModal}
        onClose={() => {
          setShowCommentsModal(false);
          // Refresh movie detail to get updated comment count
          console.log('🔄 [MovieDetail] Comments modal closed, refreshing movie detail...');
          setTimeout(() => {
            refresh();
          }, 300);
        }}
        movieId={id}
        movieTitle={movieDetail?.movie_title || 'Movie'}
        userId={userId}
        isLoggedIn={auth.isLoggedIn}
      />

      {/* 📱 NOTIFICATION */}
      <SlideNotification
        visible={showNotification}
        message={notificationMessage}
        type={notificationType}
        onHide={() => setShowNotification(false)}
      />
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
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
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
    height: 50,
  },
  
  // Video Player Container
  videoPlayerContainer: {
    margin: 0, // Loại bỏ margin để video full width
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  
  // Video Placeholder
  videoPlaceholder: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  videoPlaceholderContent: {
    alignItems: 'center',
    padding: 20,
  },
  videoPlaceholderTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  videoPlaceholderSubtitle: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  videoPlaceholderButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  videoPlaceholderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
}); 