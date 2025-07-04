/**
 * 🎬 MOVIE DETAIL SERVICE
 * * Service để gọi các API liên quan đến màn hình chi tiết phim
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
    hasEpisodes: !!movie.episodes,
    episodesCount: movie.episodes?.length || 0,
    firstEpisode: movie.episodes?.[0],
    rawMovie: movie
  });
  
  // Log full API response for debugging
  console.log('🔍 [DEBUG] Full API Response:', JSON.stringify(apiResponse, null, 2));

  // Transform episodes data to ensure all required fields
  const transformedEpisodes = (movie.episodes || []).map((ep: any) => {
    // Log episode data for debugging
    console.log('🎬 [DEBUG] Processing episode:', {
      id: ep._id,
      title: ep.episode_title,
      originalUri: ep.uri,
      hasUri: !!ep.uri,
      episode_number: ep.episode_number
    });

    // Ensure URI is preserved from original data
    const episodeUri = ep.uri || '';
    
    // 🔧 ROBUST FIX: Use _id from API if available, otherwise create one
    // This handles both old backend (no _id) and new backend (with _id)
    const episodeId = ep._id || `${movie._id}_ep${ep.episode_number}`;
    
    // Skip episodes without valid episode_number (essential field)
    if (!ep.episode_number) {
      console.warn('⚠️ [MovieDetailService] Skipping episode without episode_number:', {
        title: ep.episode_title,
        episode_data: ep
      });
      return null;
    }

    // Ensure all required fields are present
    const transformedEpisode = {
      _id: episodeId,
      episode_title: ep.episode_title || `Tập ${ep.episode_number || 1}`,
      episode_number: ep.episode_number || 1,
      episode_description: ep.episode_description || '',
      uri: episodeUri,
      duration: ep.duration || 0,
      movie_id: ep.movie_id || movie._id,
      createdAt: ep.createdAt || ep.created_at || new Date().toISOString(),
      updatedAt: ep.updatedAt || ep.updated_at || new Date().toISOString(),
      is_free: ep.is_free,
      release_date: ep.release_date
    };

    // Log transformed episode
    console.log('✅ [DEBUG] Transformed episode:', {
      id: transformedEpisode._id,
      title: transformedEpisode.episode_title,
      uri: transformedEpisode.uri,
      hasUri: !!transformedEpisode.uri
    });

    return transformedEpisode;
  }).filter(Boolean); // Remove null episodes

  // Log final episodes array
  console.log('📝 [DEBUG] Final episodes array:', {
    totalEpisodes: transformedEpisodes.length,
    episodesWithUri: transformedEpisodes.filter((ep: { uri: string }) => ep.uri).length,
    firstEpisodeUri: transformedEpisodes[0]?.uri
  });
  
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
    uri: movie.uri || '',
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
    episodes: transformedEpisodes,
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
   * * API chính cho màn hình chi tiết phim
   * ENDPOINT: GET /api/movies/{id}/detail-with-interactions?userId={userId}
   * * @param movieId - ID của phim
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
        jsonParseTime: jsonEndTime - jsonStartTime,
        hasData: !!apiResponse.data,
        hasMovie: !!apiResponse.data?.movie,
        hasEpisodes: !!apiResponse.data?.movie?.episodes,
        episodesType: typeof apiResponse.data?.movie?.episodes,
        episodesArray: Array.isArray(apiResponse.data?.movie?.episodes),
        episodesLength: apiResponse.data?.movie?.episodes?.length || 0
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
   * * Làm mới dữ liệu chi tiết phim (sau khi user tương tác)
   * * @param movieId - ID của phim
   * @param userId - ID của user (optional)
   * @returns Promise<MovieDetail>
   */
  async refreshMovieDetail(movieId: string, userId?: string): Promise<MovieDetail> {
    console.log('🔄 [MovieDetailService] Refreshing movie detail...');
    return this.getMovieDetail(movieId, userId);
  },
  
  /**
   * 📊 GET MOVIE STATISTICS
   * * Lấy thống kê của phim (like count, view count, rating)
   * * @param movieId - ID của phim
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
   * * Lấy danh sách phim liên quan
   * * @param movieId - ID của phim hiện tại
   * @param limit - Số lượng phim liên quan (default: 8)
   * @param genreIds - ID của các thể loại muốn lọc (string, phân cách bằng dấu phẩy)
   * @param useParentGenres - Có sử dụng thể loại cha không (default: true)
   * @returns Promise với danh sách phim liên quan
   */
  async getRelatedMovies(
    movieId: string,
    options: {
      limit?: number;
      genreIds?: string;
      useParentGenres?: boolean;
    } = {}
  ): Promise<any[]> {
    const { limit = 8, genreIds, useParentGenres = true } = options;
    try {
      // First try the related movies endpoint
      const queryParams = new URLSearchParams();
      if (genreIds) {
        queryParams.append('genreIds', genreIds);
      }
      if (useParentGenres !== undefined) {
        queryParams.append('useParentGenres', useParentGenres.toString());
      }
      if (limit) {
        queryParams.append('limit', limit.toString());
      }
      const url = `${API_BASE_URL}/api/movies/${movieId}/related${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      console.log('🎭 [MovieDetailService] Fetching related movies:', {
        movieId,
        url,
        options: { limit, genreIds, useParentGenres }
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('🎭 [MovieDetailService] Related movies response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Log the raw result for debugging
      console.log('🎭 [MovieDetailService] Raw API response:', result);
      
      // Check if data is an array directly
      const movies = Array.isArray(result.data) ? result.data : 
                    (result.data?.movies || []); // Fallback to data.movies if exists
      
      console.log('🎭 [MovieDetailService] Related movies result:', {
        success: result.status === 'success',
        moviesCount: movies.length,
        firstMovie: movies[0]?.movie_title || movies[0]?.title,
        movies: movies
      });

      return movies;
    } catch (error) {
      console.error('❌ [MovieDetailService] Error fetching related movies:', {
        error,
        movieId,
        options: { limit, genreIds, useParentGenres }
      });
      
      // Try fallback to search
      try {
        console.log('⚠️ [MovieDetailService] Related movies endpoint failed, trying search fallback');
        
        // Get the movie details first to get the title
        const movieDetailResponse = await fetch(`${API_BASE_URL}/api/movies/${movieId}/detail-with-interactions`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!movieDetailResponse.ok) {
          throw new Error(`Failed to get movie details: ${movieDetailResponse.status}`);
        }
        
        const movieDetail = await movieDetailResponse.json();
        const movieTitle = movieDetail.data.movie.movie_title;
        
        // Use the movie title to search for similar movies
        const searchResults = await this.searchSimilarMovies(movieTitle, limit);
        
        // Filter out the current movie from results
        const filteredResults = searchResults.filter(movie => movie._id !== movieId);
        
        console.log('✅ [MovieDetailService] Found similar movies via search:', {
          searchQuery: movieTitle,
          resultsCount: filteredResults.length
        });
        
        return filteredResults;
      } catch (fallbackError) {
        console.error('❌ [MovieDetailService] Fallback search also failed:', fallbackError);
        return [];
      }
    }
  },
  
  /**
   * 💬 GET MOVIE COMMENTS
   * * Lấy comments của phim (with pagination)
   * * @param movieId - ID của phim
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
   * * Tìm kiếm phim tương tự cho recommendations
   * * @param query - Từ khóa tìm kiếm
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
   * * Preload movie detail để cải thiện performance
   * Sử dụng khi user hover/focus vào movie card
   * * @param movieId - ID của phim cần preload
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