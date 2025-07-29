/**
 * 👤 USER INTERACTION SERVICE
 * 
 * Service để gọi các API tương tác người dùng
 * Toggle APIs: like, favorite, comment, rating
 */

import { 
  ToggleLikeRequest, 
  ToggleLikeResponse,
  ToggleFavoriteRequest,
  ToggleFavoriteResponse,
  AddCommentRequest,
  AddCommentResponse,
  UpdateProgressRequest,
  UpdateProgressResponse,
  MovieEpisodesProgressResponse,
  WatchingHistoryResponse
} from '../types/userInteraction';

const API_BASE_URL = 'https://backend-app-lou3.onrender.com';

/**
 * 👤 USER INTERACTION SERVICE
 */ 
export const userInteractionService = {
  
  /**
   * ❤️ TOGGLE LIKE/UNLIKE
   * 
   * API để like/unlike phim (Using Legacy Endpoints - CONFIRMED WORKING)
   * ENDPOINT: POST /api/ratings/movies/{movieId}/like or /unlike
   * 
   * @param movieId - ID của phim
   * @param isLike - true để like, false để unlike
   * @param userId - ID của user
   * @returns Promise<ToggleLikeResponse>
   */
  async toggleLike(movieId: string, isLike: boolean, userId: string): Promise<ToggleLikeResponse> {
    try {
      const action = isLike ? 'like' : 'unlike';
      const url = `${API_BASE_URL}/api/ratings/movies/${movieId}/like`;
      
      console.log(`${isLike ? '❤️' : '💔'} [UserInteractionService] ${action} movie:`, { movieId, isLike, userId });
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isLike, userId }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: ToggleLikeResponse = await response.json();
      
      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to toggle like');
      }
      
      console.log(`✅ [UserInteractionService] ${action} successful:`, result.message);
      
      return result;
      
    } catch (error) {
      console.error('❌ [UserInteractionService] Error toggling like:', error);
      throw error;
    }
  },
  
  /**
   * ⭐ TOGGLE FAVORITE/UNFAVORITE
   * 
   * API để add/remove phim khỏi favorites (Using Unified API)
   * ENDPOINT: PUT /api/favorites/movies/{movieId}
   * 
   * @param movieId - ID của phim
   * @param isFavorite - true để add, false để remove
   * @param userId - ID của user
   * @returns Promise<ToggleFavoriteResponse>
   */
  async toggleFavorite(movieId: string, isFavorite: boolean, userId: string): Promise<ToggleFavoriteResponse> {
    try {
      const url = `${API_BASE_URL}/api/favorites/movies/${movieId}`;
      
      console.log(`⭐ [UserInteractionService] toggle favorite:`, { movieId, isFavorite, userId });
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isFavorite, userId }),
      });
      
      const result: ToggleFavoriteResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to toggle favorite');
      }
      
      console.log(`✅ [UserInteractionService] Favorite toggle successful:`, result.message);
      
      return result;
      
    } catch (error) {
      console.error('❌ [UserInteractionService] Error toggling favorite:', error);
      throw error;
    }
  },
  
  /**
   * 💬 ADD COMMENT
   * 
   * API để thêm comment cho phim
   * ENDPOINT: POST /api/ratings/movies/{movieId}/comment
   * 
   * @param movieId - ID của phim
   * @param comment - Nội dung comment
   * @param userId - ID của user
   * @param isLike - Có like phim không (optional)
   * @returns Promise<AddCommentResponse>
   */
  async addComment(
    movieId: string, 
    comment: string, 
    userId: string, 
    isLike?: boolean
  ): Promise<AddCommentResponse> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const url = `${API_BASE_URL}/api/ratings/movies/${movieId}/comment`;
        
        const requestBody: AddCommentRequest = {
          comment,
          userId,
          isLike
        };
        
        console.log(`💬 [UserInteractionService] Add comment (attempt ${attempt}/${maxRetries}):`, { 
          movieId, 
          comment: comment.substring(0, 50) + '...', 
          userId 
        });
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result: AddCommentResponse = await response.json();
        
        if (result.status !== 'success') {
          throw new Error(result.message || 'Failed to add comment');
        }
        
        console.log(`✅ [UserInteractionService] Comment added successfully on attempt ${attempt}`);
        
        return result;
        
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ [UserInteractionService] Error adding comment (attempt ${attempt}/${maxRetries}):`, error);
        
        // If it's the last attempt, throw the error
        if (attempt === maxRetries) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ [UserInteractionService] Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw lastError || new Error('Failed to add comment after multiple attempts');
  },
  
  /**
   * 🎬 UPDATE WATCHING PROGRESS
   * 
   * API để cập nhật tiến độ xem phim
   * ENDPOINT: PUT /api/watching/progress
   * 
   * @param episodeId - ID của episode hoặc movie (backend sẽ tự detect)
   * @param currentTime - Thời gian hiện tại (giây)
   * @param duration - Tổng thời lượng video (giây)
   * @param userId - ID của user
   * @param completed - Đã xem xong chưa (optional)
   * @returns Promise<UpdateProgressResponse>
   */
  async updateWatchingProgress(
    episodeId: string,
    currentTime: number,
    duration: number,
    userId: string,
    completed?: boolean
  ): Promise<UpdateProgressResponse> {
    try {
      // Validate required fields
      if (!episodeId) {
        throw new Error('Episode ID is required');
      }
      if (!userId || userId === 'anonymous' || userId === 'null') {
        console.log('⚠️ [UserInteractionService] Skipping progress update for anonymous user');
        throw new Error('User must be logged in to save progress');
      }

      // Convert currentTime to integer
      const currentTimeInt = Math.floor(currentTime);
      
      const url = `${API_BASE_URL}/api/watching/progress`;
      
      // Calculate watch percentage
      const watchPercentage = Math.floor((currentTimeInt / duration) * 100);

      // 🔧 ENHANCED: Handle generated episode IDs  
      // If episodeId looks like "movieId_epX", extract movie ID and episode number
      let targetId = episodeId;
      let episodeNumber = 1; // default for single movies
      
      if (episodeId.includes('_ep')) {
        const parts = episodeId.split('_ep');
        if (parts.length === 2) {
          const movieId = parts[0];
          const epNum = parseInt(parts[1]);
          
          console.log('🔧 [UserInteractionService] Generated ID detected:', {
            originalId: episodeId,
            movieId,
            episodeNumber: epNum,
            willUseMovieId: true
          });
          
          // Use movie ID instead and include episode number for series
          targetId = movieId;
          episodeNumber = epNum;
        }
      }

      // Prepare request body - always use targetId (either real episode ID or movie ID)
      const requestBody = {
        episode_id: targetId,
        currentTime: currentTimeInt,
        duration,
        userId,
        completed: completed || watchPercentage >= 90,
        // Add episode number context for backend
        ...(episodeId.includes('_ep') && { episode_number: episodeNumber })
      };
      
      console.log('🎬 [UserInteractionService] Update watching progress:', {
        ...requestBody,
        watchPercentage,
        url
      });
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [UserInteractionService] API Error:', {
          status: response.status,
          error: errorText,
          request: requestBody
        });
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result: UpdateProgressResponse = await response.json();
      
      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to update progress');
      }
      
      console.log('✅ [UserInteractionService] Progress updated successfully:', {
        episode_id: episodeId,
        currentTime: currentTimeInt,
        watchPercentage,
        completed: completed || watchPercentage >= 90
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ [UserInteractionService] Error updating progress:', error);
      throw error;
    }
  },
  
  /**
   * 📊 GET USER MOVIE INTERACTIONS SUMMARY
   * 
   * Lấy tổng quan các tương tác của user với 1 phim
   * (Alternative cho việc gọi getMovieDetailWithInteractions)
   * 
   * @param movieId - ID của phim
   * @param userId - ID của user
   * @returns Promise với user interactions
   */
  async getUserMovieInteractions(movieId: string, userId: string): Promise<{
    hasLiked: boolean;
    isFavorite: boolean;
    hasRated: boolean;
    userComment: string | null;
    watchingProgress: any | null;
  }> {
    try {
      const url = `${API_BASE_URL}/api/users/${userId}/interactions/movie/${movieId}`;
      
      console.log('📊 [UserInteractionService] Get user interactions:', { movieId, userId });
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.status !== 'success') {
        throw new Error('Failed to get user interactions');
      }
      
      return result.data.interactions;
      
    } catch (error) {
      console.error('❌ [UserInteractionService] Error getting user interactions:', error);
      
      // Return default interactions on error
      return {
        hasLiked: false,
        isFavorite: false,
        hasRated: false,
        userComment: null,
        watchingProgress: null
      };
    }
  },

  /**
   * 🎬 GET MOVIE EPISODES PROGRESS
   * 
   * API để lấy tiến độ xem của tất cả episodes trong một movie
   * ENDPOINT: GET /api/watching/movie/:movieId/episodes
   * 
   * @param movieId - ID của movie
   * @param userId - ID của user
   * @returns Promise<MovieEpisodesProgressResponse>
   */
  async getMovieEpisodesProgress(
    movieId: string,
    userId: string
  ): Promise<MovieEpisodesProgressResponse> {
    try {
      if (!movieId) {
        throw new Error('Movie ID is required');
      }
      if (!userId || userId === 'anonymous' || userId === 'null') {
        console.log('⚠️ [UserInteractionService] Skipping progress fetch for anonymous user');
        throw new Error('User must be logged in to fetch progress');
      }

      const url = `${API_BASE_URL}/api/watching/movie/${movieId}/episodes?userId=${userId}`;
      
      console.log('🎬 [UserInteractionService] Fetching movie episodes progress:', {
        movieId,
        userId,
        url
      });
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [UserInteractionService] API Error:', {
          status: response.status,
          error: errorText,
          movieId,
          userId
        });
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result: MovieEpisodesProgressResponse = await response.json();
      
      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to fetch episodes progress');
      }
      
      console.log('✅ [UserInteractionService] Movie episodes progress fetched successfully:', {
        movieId,
        episodesCount: result.data?.episodes?.length || 0
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ [UserInteractionService] Error fetching movie episodes progress:', error);
      throw error;
    }
  },
  
  /**
   * 📺 GET WATCHING HISTORY
   * 
   * API để lấy lịch sử xem phim của user
   * ENDPOINT: GET /api/watching/history
   * 
   * @param userId - ID của user
   * @param page - Trang hiện tại (mặc định: 1)
   * @param limit - Số lượng item mỗi trang (mặc định: 20)
   * @returns Promise<WatchingHistoryResponse>
   */
  async getWatchingHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<WatchingHistoryResponse> {
    try {
      if (!userId || userId === 'anonymous' || userId === 'null') {
        throw new Error('User must be logged in to get watching history');
      }

      const url = `${API_BASE_URL}/api/watching/history?userId=${userId}&page=${page}&limit=${limit}`;
      
      console.log('📺 [UserInteractionService] Getting watching history:', {
        userId,
        page,
        limit,
        url
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [UserInteractionService] API Error:', {
          status: response.status,
          error: errorText,
          url
        });
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result: WatchingHistoryResponse = await response.json();
      
      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to get watching history');
      }

      console.log('✅ [UserInteractionService] Watching history loaded successfully:', {
        totalItems: result.data?.pagination?.total_items || 0,
        currentPage: result.data?.pagination?.current_page || 1,
        totalPages: result.data?.pagination?.total_pages || 1,
        historyItems: result.data?.watching_history?.length || 0,
        continueItems: result.data?.continue_watching?.length || 0
      });

      return result;
    } catch (error) {
      console.error('❌ [UserInteractionService] Error getting watching history:', error);
      throw error;
    }
  },

  /**
   * ⭐ GET USER FAVORITES
   * 
   * API để lấy danh sách phim yêu thích của user
   * ENDPOINT: GET /api/favorites?userId={userId}
   * 
   * @param userId - ID của user
   * @returns Promise với danh sách favorites
   */
  async getFavorites(userId: string): Promise<{
    status: string;
    data: {
      favorites: Array<{
        _id: string;
        movie_title: string;
        poster_path?: string;
        poster?: string;
        description: string;
        movie_type: string;
        producer: string;
        genres?: string[];
        production_time: string;
        price: number;
        is_free: boolean;
        added_at: string;
      }>;
    };
  }> {
    try {
      const url = `${API_BASE_URL}/api/favorites?userId=${userId}`;
      
      console.log('⭐ [UserInteractionService] Getting favorites for userId:', userId);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // For 500 errors or invalid userId, return empty favorites instead of throwing
        if (response.status === 500 || response.status === 404) {
          console.log('ℹ️ [UserInteractionService] User has no favorites or invalid userId - returning empty list');
          return {
            status: 'success',
            data: {
              favorites: []
            }
          };
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to get favorites');
      }

      console.log('✅ [UserInteractionService] Favorites loaded successfully:', {
        count: result.data?.favorites?.length || 0
      });

      return result;
    } catch (error) {
      console.error('❌ [UserInteractionService] Error getting favorites:', error);
      // For null reference errors (new users), return empty favorites instead of throwing
      if (error instanceof Error && error.message.includes('Cannot read properties of null')) {
        console.log('ℹ️ [UserInteractionService] Null reference error in getFavorites - returning empty list');
        return {
          status: 'success',
          data: {
            favorites: []
          }
        };
      }
      throw error;
    }
  },

  /**
   * 🔄 BATCH TOGGLE OPERATIONS
   * 
   * Thực hiện multiple toggle operations cùng lúc
   * Useful cho sync offline actions
   * 
   * @param operations - Array of operations to perform
   * @returns Promise với kết quả batch operation
   */
  async batchToggleOperations(operations: Array<{
    movieId: string;
    action: 'like' | 'unlike' | 'favorite' | 'unfavorite';
    userId: string;
  }>): Promise<{
    successful: number;
    failed: number;
    results: Array<{ movieId: string; success: boolean; error?: string }>;
  }> {
    const results = [];
    let successful = 0;
    let failed = 0;
    
    for (const operation of operations) {
      try {
        if (operation.action === 'like' || operation.action === 'unlike') {
          await this.toggleLike(operation.movieId, operation.action === 'like', operation.userId);
        } else if (operation.action === 'favorite' || operation.action === 'unfavorite') {
          await this.toggleFavorite(operation.movieId, operation.action === 'favorite', operation.userId);
        }
        
        results.push({ movieId: operation.movieId, success: true });
        successful++;
        
      } catch (error) {
        results.push({ 
          movieId: operation.movieId, 
          success: false, 
          error: (error as Error).message 
        });
        failed++;
      }
    }
    
    console.log('🔄 [UserInteractionService] Batch operations completed:', { successful, failed });
    
    return { successful, failed, results };
  }
};

/**
 * 🚀 Export default for convenience  
 */
export default userInteractionService; 