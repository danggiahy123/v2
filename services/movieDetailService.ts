/**
 * 🎬 MOVIE DETAIL SERVICE
 * 
 * Service để gọi các API liên quan đến màn hình chi tiết phim
 * Chính: getMovieDetailWithInteractions API
 */

import { MovieDetailApiResponse, MovieDetail } from '../types/movieDetail';

const API_BASE_URL = 'https://backend-app-lou3.onrender.com';

/**
 * 🔧 Utility function to transform API response to UI format
 */
const transformMovieDetailResponse = (apiResponse: any): MovieDetail => {
  const movie = apiResponse.data.movie;
  const userInteractions = movie.userInteractions || {};
  const recentComments = movie.recentComments || [];
  const relatedMovies = movie.relatedMovies || [];
  const tabs = movie.tabs || {};
  
  console.log('🔄 [movieDetailService] Transforming API response:', {
    movieId: movie._id,
    movieType: movie.movie_type,
    hasUri: !!movie.uri,
    hasVideoUrl: !!movie.video_url,
    hasEpisodes: !!movie.episodes,
    episodesCount: movie.episodes?.length || 0,
    firstEpisode: movie.episodes?.[0],
    rawMovie: movie
  });
  
  // Log full API response for debugging
  console.log('🔍 [DEBUG] Full API Response:', JSON.stringify(apiResponse, null, 2));
  
  return {
    movieId: movie._id,
    _id: movie._id,
    movie_title: movie.movie_title,
    description: movie.description,
    production_time: movie.production_time,
    producer: movie.producer,
    movie_type: movie.movie_type,
    price: movie.price,
    is_free: movie.is_free,
    price_display: movie.price_display,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    
    // Video properties for single movies
    uri: movie.uri,
    video_url: movie.video_url,
    duration: movie.duration,
    
    // Additional properties from API
    createdAt: movie.createdAt,
    updatedAt: movie.updatedAt,
    
    // Stats (directly from movie object)
    totalRating: movie.totalRating || 0,
    averageRating: movie.averageRating || 0,
    rating: movie.rating || 0,
    likeCount: movie.likeCount || 0,
    viewCount: movie.viewCount || 0,
    commentCount: movie.commentCount || 0,
    
    // Related data
    genres: movie.genres || [],
    episodes: movie.episodes || [],  // API may not return this for single movies
    userInteractions: userInteractions,
    recentComments: recentComments,
    relatedMovies: relatedMovies,
    
    // UI config
    tabs: {
      showEpisodesList: tabs.showEpisodesList || false,
      showRelated: tabs.showRelated || false
    }
  };
};

/**
 * 🎬 MOVIE DETAIL SERVICE
 */
export const movieDetailService = {
  
  /**
   * 📖 GET MOVIE DETAIL WITH INTERACTIONS
   * 
   * API chính cho màn hình chi tiết phim
   * ENDPOINT: GET /api/movies/{id}/detail-with-interactions?userId={userId}
   * 
   * @param movieId - ID của phim
   * @param userId - ID của user (optional)
   * @returns Promise<MovieDetail>
   */
  async getMovieDetail(movieId: string, userId?: string): Promise<MovieDetail> {
    const serviceStartTime = Date.now();
    
    try {
      const queryParams = new URLSearchParams();
      if (userId) {
        queryParams.append('userId', userId);
      }
      
      const url = `${API_BASE_URL}/api/movies/${movieId}/detail-with-interactions${
        queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`;
      
      console.log('🎬 [MovieDetailService] Fetching movie detail:', { 
        movieId, 
        movieIdType: typeof movieId,
        movieIdValid: !!movieId && movieId !== 'undefined',
        url, 
        userId,
        serviceStartTime
      });
      
      const fetchStartTime = Date.now();
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const fetchEndTime = Date.now();
      console.log('🌐 [MovieDetailService] Network request completed:', {
        networkTime: fetchEndTime - fetchStartTime,
        status: response.status,
        ok: response.ok
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const jsonStartTime = Date.now();
      const apiResponse: MovieDetailApiResponse = await response.json();
      const jsonEndTime = Date.now();
      
      console.log('📋 [MovieDetailService] JSON parsing completed:', {
        jsonParseTime: jsonEndTime - jsonStartTime
      });
      
      if (apiResponse.status !== 'success') {
        throw new Error('Failed to fetch movie detail');
      }
      
      // Transform API response to UI format
      const transformStartTime = Date.now();
      const movieDetail = transformMovieDetailResponse(apiResponse);
      const transformEndTime = Date.now();
      
      console.log('✅ [MovieDetailService] Movie detail fetched successfully:', {
        title: movieDetail.movie_title,
        totalServiceTime: transformEndTime - serviceStartTime,
        transformTime: transformEndTime - transformStartTime,
        breakdown: {
          network: fetchEndTime - fetchStartTime,
          jsonParse: jsonEndTime - jsonStartTime,
          transform: transformEndTime - transformStartTime
        }
      });
      console.log('🔍 [DEBUG] userInteractions from API:', apiResponse.data.movie.userInteractions);
      console.log('🔍 [DEBUG] transformed userInteractions:', movieDetail.userInteractions);
      
      // 🔍 DEBUG: Check duration data for all movies
      const rawMovie = apiResponse.data.movie as any;
      console.log('🎬 [DEBUG] Movie Duration Check:', {
        movieId,
        title: movieDetail.movie_title,
        rawDurationFromAPI: rawMovie.duration,
        transformedDuration: movieDetail.duration,
        isDataConsistent: rawMovie.duration === movieDetail.duration,
        formatDurationWould: rawMovie.duration ? `${rawMovie.duration > 300 ? Math.floor(rawMovie.duration / 60) + 'min (from seconds)' : Math.floor(rawMovie.duration / 60) + 'h ' + (rawMovie.duration % 60) + 'min'}` : 'N/A'
      });
      
      return movieDetail;
      
    } catch (error) {
      console.error('❌ [MovieDetailService] Error fetching movie detail:', error);
      throw error;
    }
  },
  
  /**
   * 🔄 REFRESH MOVIE DETAIL
   * 
   * Làm mới dữ liệu chi tiết phim (sau khi user tương tác)
   * 
   * @param movieId - ID của phim
   * @param userId - ID của user (optional)
   * @returns Promise<MovieDetail>
   */
  async refreshMovieDetail(movieId: string, userId?: string): Promise<MovieDetail> {
    console.log('🔄 [MovieDetailService] Refreshing movie detail...');
    return this.getMovieDetail(movieId, userId);
  },
  
  /**
   * 📊 GET MOVIE STATISTICS
   * 
   * Lấy thống kê của phim (like count, view count, rating)
   * 
   * @param movieId - ID của phim
   * @returns Promise với các thống kê
   */
  async getMovieStats(movieId: string): Promise<{
    likeCount: number;
    viewCount: number;
    averageRating: number;
    totalRating: number;
  }> {
    try {
      const url = `${API_BASE_URL}/api/movies/${movieId}/stats`;
      
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
      
      return {
        likeCount: result.data.likeCount || 0,
        viewCount: result.data.viewCount || 0, 
        averageRating: result.data.averageRating || 0,
        totalRating: result.data.totalRating || 0,
      };
      
    } catch (error) {
      console.error('❌ [MovieDetailService] Error fetching movie stats:', error);
      throw error;
    }
  },
  
  /**
   * 🎭 GET RELATED MOVIES
   * 
   * Lấy danh sách phim liên quan
   * 
   * @param movieId - ID của phim hiện tại
   * @param limit - Số lượng phim liên quan (default: 5)
   * @returns Promise với danh sách phim liên quan
   */
  async getRelatedMovies(movieId: string, limit: number = 5): Promise<any[]> {
    try {
      const url = `${API_BASE_URL}/api/movies/${movieId}/related?limit=${limit}`;
      
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
      
      return result.data.movies || [];
      
    } catch (error) {
      console.error('❌ [MovieDetailService] Error fetching related movies:', error);
      return []; // Return empty array on error
    }
  },
  
  /**
   * 💬 GET MOVIE COMMENTS
   * 
   * Lấy comments của phim (with pagination)
   * 
   * @param movieId - ID của phim
   * @param page - Trang hiện tại (default: 1)
   * @param limit - Số comments per page (default: 10)
   * @returns Promise với danh sách comments
   */
  async getMovieComments(
    movieId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<{
    comments: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  }> {
    try {
      const url = `${API_BASE_URL}/api/ratings/movies/${movieId}/comments?page=${page}&limit=${limit}`;
      
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
      
      return {
        comments: result.data.comments || [],
        pagination: result.data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          hasMore: false
        }
      };
      
    } catch (error) {
      console.error('❌ [MovieDetailService] Error fetching movie comments:', error);
      return {
        comments: [],
        pagination: { page: 1, limit: 10, total: 0, hasMore: false }
      };
    }
  },
  
  /**
   * 🔍 SEARCH MOVIES (for related/similar)
   * 
   * Tìm kiếm phim tương tự cho recommendations
   * 
   * @param query - Từ khóa tìm kiếm
   * @param limit - Số kết quả (default: 10)
   * @returns Promise với kết quả tìm kiếm
   */
  async searchSimilarMovies(query: string, limit: number = 10): Promise<any[]> {
    try {
      const url = `${API_BASE_URL}/api/movies/search?q=${encodeURIComponent(query)}&limit=${limit}`;
      
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
      
      return result.data.movies || [];
      
    } catch (error) {
      console.error('❌ [MovieDetailService] Error searching similar movies:', error);
      return [];
    }
  },
  
  /**
   * ⚡ PRELOAD MOVIE DETAIL
   * 
   * Preload movie detail để cải thiện performance
   * Sử dụng khi user hover/focus vào movie card
   * 
   * @param movieId - ID của phim cần preload
   * @param userId - ID của user (optional)
   */
  async preloadMovieDetail(movieId: string, userId?: string): Promise<void> {
    try {
      console.log('⚡ [MovieDetailService] Preloading movie detail:', movieId);
      
      // Preload in background, don't await
      this.getMovieDetail(movieId, userId).catch(error => {
        console.warn('⚠️ [MovieDetailService] Preload failed (ignored):', error.message);
      });
      
    } catch (error) {
      // Ignore preload errors
      console.warn('⚠️ [MovieDetailService] Preload error (ignored):', error);
    }
  }
  
};

/**
 * 🚀 Export default for convenience
 */
export default movieDetailService; 