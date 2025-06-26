/**
 * 🎬 USE MOVIE DETAIL HOOK
 * 
 * Custom hook để quản lý state và API calls cho màn hình chi tiết phim
 * Tích hợp với React Query cho caching và background refresh
 */

import { useState, useEffect, useCallback } from 'react';
import { movieDetailService } from '../services/movieDetailService';
import { userInteractionService } from '../services/userInteractionService';
import { MovieDetail } from '../types/movieDetail';

/**
 * Hook Options
 */
interface UseMovieDetailOptions {
  userId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enablePreload?: boolean;
}

/**
 * Hook Return Type
 */
interface UseMovieDetailReturn {
  // Data
  movieDetail: MovieDetail | null;
  
  // Loading States
  loading: boolean;
  refreshing: boolean;
  
  // Error States
  error: string | null;
  
  // Actions
  refresh: () => Promise<void>;
  toggleLike: (isLike: boolean) => Promise<void>;
  toggleFavorite: (isFavorite: boolean) => Promise<void>;
  addComment: (comment: string, isLike?: boolean) => Promise<void>;
  updateProgress: (episodeId: string, currentTime: number, watchPercentage: number) => Promise<void>;
  
  // Utilities
  preload: (movieId: string) => Promise<void>;
  clearError: () => void;
}

/**
 * 🎬 USE MOVIE DETAIL HOOK
 */
export const useMovieDetail = (
  movieId: string,
  options: UseMovieDetailOptions = {}
): UseMovieDetailReturn => {
  
  const {
    userId,
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    enablePreload = false
  } = options;

  // =====================================
  // STATE MANAGEMENT
  // =====================================
  
  const [movieDetail, setMovieDetail] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // =====================================
  // FETCH MOVIE DETAIL
  // =====================================
  
  const fetchMovieDetail = useCallback(async (isRefresh: boolean = false) => {
    const fetchStartTime = Date.now();
    
    try {
      if (!movieId || typeof movieId !== 'string' || movieId === 'undefined') {
        console.log('⚠️ [useMovieDetail] Invalid movieId:', { movieId, type: typeof movieId });
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      
      console.log('🎬 [useMovieDetail] Fetching movie detail:', { 
        movieId, 
        userId, 
        isRefresh,
        fetchStartTime
      });
      
      const detail = await movieDetailService.getMovieDetail(movieId, userId);
      
      const fetchEndTime = Date.now();
      setMovieDetail(detail);
      
      console.log('✅ [useMovieDetail] Movie detail loaded:', {
        title: detail.movie_title,
        fetchTime: fetchEndTime - fetchStartTime,
        hasEpisodes: !!detail.episodes?.length,
        episodeCount: detail.episodes?.length,
        movieType: detail.movie_type,
        isFree: detail.is_free
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ [useMovieDetail] Error loading movie detail:', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [movieId, userId]);

  // =====================================
  // USER INTERACTIONS
  // =====================================
  
  const toggleLike = useCallback(async (isLike: boolean) => {
    if (!movieId || !userId || !movieDetail) {
      throw new Error('Movie ID, User ID, and Movie Detail are required');
    }

    try {
      console.log('❤️ [useMovieDetail] Toggling like:', { movieId, isLike, userId });
      
      // Optimistic update
      const optimisticUpdate = {
        ...movieDetail,
        userInteractions: {
          ...movieDetail.userInteractions!,
          hasLiked: isLike
        },
        likeCount: (movieDetail.likeCount || 0) + (isLike ? 1 : -1)
      };
      setMovieDetail(optimisticUpdate);
      
      // API call
      const result = await userInteractionService.toggleLike(movieId, isLike, userId);
      
      // Update with real data from API response
      setMovieDetail(prev => prev ? {
        ...prev,
        likeCount: result.data.likeCount || prev.likeCount,
        userInteractions: {
          ...prev.userInteractions!,
          hasLiked: result.data.isLike
        }
      } : null);
      
      console.log('✅ [useMovieDetail] Like toggled successfully:', {
        newLikeCount: result.data.likeCount,
        newLikeState: result.data.isLike
      });
      
    } catch (err) {
      console.error('❌ [useMovieDetail] Error toggling like:', err);
      
      // Revert optimistic update
      await fetchMovieDetail(true);
      
      throw err;
    }
  }, [movieId, userId, movieDetail, fetchMovieDetail]);

  const toggleFavorite = useCallback(async (isFavorite: boolean) => {
    if (!movieId || !userId || !movieDetail) {
      throw new Error('Movie ID, User ID, and Movie Detail are required');
    }

    try {
      console.log('⭐ [useMovieDetail] Toggling favorite:', { movieId, isFavorite, userId });
      
      // Optimistic update
      const optimisticUpdate = {
        ...movieDetail,
        userInteractions: {
          ...movieDetail.userInteractions!,
          isFavorite,
          isFollowing: isFavorite // isFollowing follows isFavorite
        }
      };
      setMovieDetail(optimisticUpdate);
      
      // API call
      await userInteractionService.toggleFavorite(movieId, isFavorite, userId);
      
      console.log('✅ [useMovieDetail] Favorite toggled successfully');
      
    } catch (err) {
      console.error('❌ [useMovieDetail] Error toggling favorite:', err);
      
      // Revert optimistic update
      await fetchMovieDetail(true);
      
      throw err;
    }
  }, [movieId, userId, movieDetail, fetchMovieDetail]);

  const addComment = useCallback(async (comment: string, isLike?: boolean) => {
    if (!movieId || !userId) {
      throw new Error('Movie ID and User ID are required');
    }

    try {
      console.log('💬 [useMovieDetail] Adding comment:', { movieId, userId });
      
      await userInteractionService.addComment(movieId, comment, userId, isLike);
      
      // Refresh to get new comments
      await fetchMovieDetail(true);
      
      console.log('✅ [useMovieDetail] Comment added successfully');
      
    } catch (err) {
      console.error('❌ [useMovieDetail] Error adding comment:', err);
      throw err;
    }
  }, [movieId, userId, fetchMovieDetail]);

  const updateProgress = useCallback(async (
    episodeId: string, 
    currentTime: number, 
    watchPercentage: number
  ) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      console.log('⏯️ [useMovieDetail] Updating progress:', { 
        episodeId, 
        currentTime, 
        watchPercentage, 
        userId 
      });
      
      await userInteractionService.updateWatchingProgress(
        episodeId, 
        currentTime, 
        watchPercentage, 
        userId
      );
      
      // Update local state
      if (movieDetail?.userInteractions) {
        setMovieDetail(prev => prev ? {
          ...prev,
          userInteractions: {
            ...prev.userInteractions!,
            watchingProgress: {
              episodeId,
              episodeNumber: prev.userInteractions!.watchingProgress?.episodeNumber || 1,
              watchPercentage,
              currentTime,
              lastWatched: new Date().toISOString(),
              completed: watchPercentage >= 90
            }
          }
        } : null);
      }
      
      console.log('✅ [useMovieDetail] Progress updated successfully');
      
    } catch (err) {
      console.error('❌ [useMovieDetail] Error updating progress:', err);
      throw err;
    }
  }, [userId, movieDetail]);

  // =====================================
  // UTILITIES
  // =====================================
  
  const refresh = useCallback(async () => {
    await fetchMovieDetail(true);
  }, [fetchMovieDetail]);

  const preload = useCallback(async (preloadMovieId: string) => {
    if (enablePreload) {
      await movieDetailService.preloadMovieDetail(preloadMovieId, userId);
    }
  }, [userId, enablePreload]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // =====================================
  // EFFECTS
  // =====================================
  
  // Initial load
  useEffect(() => {
    if (movieId && typeof movieId === 'string' && movieId !== 'undefined') {
      fetchMovieDetail(false);
    } else {
      console.log('⚠️ [useMovieDetail] Skipping fetch due to invalid movieId:', { movieId, type: typeof movieId });
    }
  }, [movieId, fetchMovieDetail]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || !movieId) return;

    const interval = setInterval(() => {
      console.log('🔄 [useMovieDetail] Auto refreshing movie detail');
      fetchMovieDetail(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, movieId, refreshInterval, fetchMovieDetail]);

  // =====================================
  // RETURN VALUES
  // =====================================
  
  return {
    // Data
    movieDetail,
    
    // Loading States
    loading,
    refreshing,
    
    // Error States
    error,
    
    // Actions
    refresh,
    toggleLike,
    toggleFavorite,
    addComment,
    updateProgress,
    
    // Utilities
    preload,
    clearError
  };
}; 