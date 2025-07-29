import { ContinueWatchingResponse, HomeApiResponse, GridMovie } from '../types/movie';
import { enrichMoviesWithPriceInfo } from '../utils/moviePriceHelper';

const API_BASE_URL = 'https://backend-app-lou3.onrender.com'; // Thay đổi thành URL của backend

interface GenericMovieResponse {
  status: string;
  data: {
    title: string;
    type: 'grid';
    movies: any[];
  };
}

/**
 * Interface cho tham số tìm kiếm phim
 */
interface SearchMoviesParams {
  tuKhoa?: string;
  page?: number;
  limit?: number;
  category?: 'series' | 'anime';
  searchByTitle?: boolean;
}

/**
 * Interface cho response của API tìm kiếm
 */
interface SearchMoviesResponse {
  status: string;
  data: {
    movies: GridMovie[];
    total: number;
    page: number;
    limit: number;
  };
}

/**
 * MOVIE SERVICE - Quản lý tất cả API calls liên quan đến movies
 * BASE URL: https://backend-app-lou3.onrender.com
 * 
 * CHỨC NĂNG CHÍNH:
 * 1. getNewReleases - Lấy phim mới + banner
 * 2. getContinueWatching - Lấy phim đang xem của user
 * 3. getTrending - Lấy phim trending
 * 4. getTopRated - Lấy phim đánh giá cao
 * 5. getSports - Lấy phim thể thao
 * 6. getComingSoon - Lấy phim sắp chiếu
 * 7. searchMovies - Tìm kiếm phim
 * 
 * NOTE: Anime và Vietnamese series đã được chuyển sang animeService và seriesService
 */
export const movieService = {

  /**
   * API 1: Lấy phim mới phát hành + banner
   * ENDPOINT: GET /api/home/new-releases
   * THAM SỐ:
   * - bannerLimit: Số lượng phim cho banner (default: 5)
   * - limit: Số lượng phim đề xuất (default: 6)  
   * - days: Phim trong vòng bao nhiêu ngày (default: 30)
   * TRẢ VỀ: { banner: { movies }, recommended: { movies } }
   */
  async getNewReleases(params?: { bannerLimit?: number; limit?: number; days?: number }): Promise<HomeApiResponse> {
    const queryParams = new URLSearchParams();
    if (params?.bannerLimit) queryParams.append('bannerLimit', params.bannerLimit.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.days) queryParams.append('days', params.days.toString());

    const url = `${API_BASE_URL}/api/home/new-releases${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });

    if (!response.ok) throw new Error(`Failed to fetch new releases: ${response.status}`);
    
    const data = await response.json();
    
    // 💰 Enhance với thông tin price cho recommended movies (chỉ 6 phim đầu để tránh chậm)
    if (data.data?.recommended?.movies && data.data.recommended.movies.length > 0) {
      console.log('💰 [MovieService] Enhancing recommended movies with price info...');
      const moviesToEnhance = data.data.recommended.movies.slice(0, 6); // Chỉ lấy 6 phim đầu
      const enhancedMovies = await enrichMoviesWithPriceInfo(moviesToEnhance, 3); // 3 concurrent để tránh quá tải
      
      // Replace enhanced movies vào data
      data.data.recommended.movies = [
        ...enhancedMovies,
        ...data.data.recommended.movies.slice(6) // Giữ lại phim còn lại chưa enhance
      ];
      
      console.log('✅ [MovieService] Enhanced recommended movies:', {
        total: data.data.recommended.movies.length,
        enhanced: enhancedMovies.length,
        paidMovies: enhancedMovies.filter(m => !m.is_free).length
      });
    }
    
    return data;
  },

  /**
   * API 2: Lấy danh sách phim đang xem của user
   * ENDPOINT: GET /api/home/continue-watching
   * THAM SỐ:
   * - userId: ID của user (required)
   * - limit: Số lượng phim tối đa (optional)
   * TRẢ VỀ: { data: [{ movieId, title, poster, progress, lastWatchedAt }] }
   */
  async getContinueWatching(userId: string, limit?: number): Promise<ContinueWatchingResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('userId', userId);
    if (limit) queryParams.append('limit', limit.toString());

    const url = `${API_BASE_URL}/api/home/continue-watching?${queryParams.toString()}`;
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });

    if (!response.ok) throw new Error(`Failed to fetch continue watching: ${response.status}`);
    return response.json();
  },

  /**
   * API 3: Lấy phim trending (phim hot)
   * ENDPOINT: GET /api/home/trending
   * THAM SỐ: 
   * - limit - Số lượng phim (optional)
   * - showAll - Hiển thị tất cả phim (optional)
   * TRẢ VỀ: { data: { title, movies: [] } }
   */
  async getTrending(limit?: number, showAll?: boolean): Promise<GenericMovieResponse> {
    const queryParams = new URLSearchParams();
    if (limit && !showAll) queryParams.append('limit', limit.toString());
    if (showAll) queryParams.append('showAll', 'true');

    const url = `${API_BASE_URL}/api/home/trending${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });

    if (!response.ok) throw new Error(`Failed to fetch trending: ${response.status}`);
    
    const data = await response.json();
    
    // 💰 Enhance với thông tin price cho trending movies
    if (data.data?.movies && data.data.movies.length > 0) {
      console.log('📈 [MovieService] Enhancing trending movies with price info...');
      const moviesToEnhance = data.data.movies.slice(0, 8); // Chỉ lấy 8 phim đầu
      const enhancedMovies = await enrichMoviesWithPriceInfo(moviesToEnhance, 4); // 4 concurrent
      
      // Replace enhanced movies vào data
      data.data.movies = [
        ...enhancedMovies,
        ...data.data.movies.slice(8) // Giữ lại phim còn lại chưa enhance
      ];
      
      console.log('✅ [MovieService] Enhanced trending movies:', {
        total: data.data.movies.length,
        enhanced: enhancedMovies.length,
        paidMovies: enhancedMovies.filter(m => !m.is_free).length
      });
    }
    
    return data;
  },

  /**
   * API 4: Lấy phim đánh giá cao
   * ENDPOINT: GET /api/home/top-rated
   * THAM SỐ: 
   * - limit - Số lượng phim (optional)
   * - showAll - Hiển thị tất cả phim (optional)
   * TRẢ VỀ: { data: { title, movies: [] } }
   */
  async getTopRated(limit?: number, showAll?: boolean): Promise<GenericMovieResponse> {
    const queryParams = new URLSearchParams();
    if (limit && !showAll) queryParams.append('limit', limit.toString());
    if (showAll) queryParams.append('showAll', 'true');

    const url = `${API_BASE_URL}/api/home/top-rated${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });

    if (!response.ok) throw new Error(`Failed to fetch top-rated: ${response.status}`);
    return response.json();
  },

  /**
   * API 5: Lấy phim thể thao
   * ENDPOINT: GET /api/home/sports
   * THAM SỐ:
   * - limit: Số lượng phim (optional)
   * - status: Trạng thái phim ('upcoming' | 'released' | 'ended')
   * - showAll - Hiển thị tất cả phim (optional)
   * TRẢ VỀ: { data: { title, movies: [] } }
   */
  async getSports(params?: { limit?: number; status?: 'upcoming' | 'released' | 'ended'; showAll?: boolean }): Promise<GenericMovieResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit && !params?.showAll) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.showAll) queryParams.append('showAll', 'true');

    const url = `${API_BASE_URL}/api/home/sports${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });

    if (!response.ok) throw new Error(`Failed to fetch sports: ${response.status}`);
    return response.json();
  },

  /**
   * API 6: Lấy phim sắp chiếu
   * ENDPOINT: GET /api/home/coming-soon
   * THAM SỐ:
   * - limit: Số lượng phim (optional)
   * - days: Phim sắp chiếu trong vòng bao nhiêu ngày (optional)
   * - showAll - Hiển thị tất cả phim (optional)
   * TRẢ VỀ: { data: { title, movies: [] } }
   */
  async getComingSoon(params?: { limit?: number; days?: number; showAll?: boolean }): Promise<GenericMovieResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit && !params?.showAll) queryParams.append('limit', params.limit.toString());
    if (params?.days) queryParams.append('days', params.days.toString());
    if (params?.showAll) queryParams.append('showAll', 'true');

    const url = `${API_BASE_URL}/api/home/coming-soon${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });

    if (!response.ok) throw new Error(`Failed to fetch coming soon: ${response.status}`);
    return response.json();
  },

  /**
   * 🎯 API 7: Lấy phim đề xuất dựa trên lịch sử xem
   * ENDPOINT: GET /api/movies/recommendations
   * THAM SỐ:
   * - userId - ID của user (required)
   * - limit - Số lượng phim đề xuất (optional, default: 10)
   * TRẢ VỀ: { data: { recommendations: [], total: number, reason: string, preferences: {} } }
   */
  async getRecommendations(userId: string, limit?: number): Promise<{
    status: string;
    data: {
      recommendations: GridMovie[];
      total: number;
      reason: string;
      preferences?: {
        topGenres: string[];
        topMovieTypes: string[];
        topProducers: string[];
      };
    };
  }> {
    try {
      if (!userId) {
        throw new Error('User ID là bắt buộc để lấy đề xuất phim');
      }

      const queryParams = new URLSearchParams();
      queryParams.append('userId', userId);
      if (limit) queryParams.append('limit', limit.toString());

      const url = `${API_BASE_URL}/api/movies/recommendations?${queryParams.toString()}`;
      
      console.log('🎯 [MovieService] Getting recommendations for userId:', userId);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.status}`);
      }

      const data = await response.json();
      
      // 💰 Enhance với thông tin price cho recommendations
      if (data.data?.recommendations && data.data.recommendations.length > 0) {
        console.log('💰 [MovieService] Enhancing recommendations with price info...');
        const enhancedRecommendations = await enrichMoviesWithPriceInfo(data.data.recommendations, 3);
        data.data.recommendations = enhancedRecommendations;
        
        console.log('✅ [MovieService] Enhanced recommendations:', {
          total: enhancedRecommendations.length,
          paidMovies: enhancedRecommendations.filter(m => !m.is_free).length
        });
      }

      return data;
    } catch (error) {
      console.error('❌ [MovieService] Error getting recommendations:', error);
      throw error;
    }
  },

  /**
   * Tìm kiếm phim theo từ khóa
   * @param params Tham số tìm kiếm (từ khóa, trang, giới hạn, chỉ tìm theo tên)
   * @returns Promise<SearchMoviesResponse>
   */
  async searchMovies(params?: SearchMoviesParams): Promise<SearchMoviesResponse> {
    try {
      console.log('🔍 SearchMovies called with params:', params);
      
      const queryParams = new URLSearchParams();
      // Kiểm tra params và tuKhoa tồn tại trước khi sử dụng
      if (params?.tuKhoa) {
        queryParams.append('q', params.tuKhoa.trim());
      } else {
        // Nếu không có từ khóa, trả về kết quả rỗng
        return {
          status: 'success',
          data: {
            movies: [],
            total: 0,
            page: 1,
            limit: 10
          }
        };
      }

      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.category) queryParams.append('category', params.category);
      // Luôn tìm kiếm theo tên phim
      queryParams.append('searchByTitle', 'true');

      const url = `${API_BASE_URL}/api/movies/search?${queryParams.toString()}`;
      console.log('🌐 Searching with URL:', url);
      
      const response = await fetch(url);
      console.log('📊 Response status:', response.status);
      
      if (!response.ok) {
        console.error('❌ API Error:', response.status, response.statusText);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📦 Response data:', data);
      return data;
    } catch (error) {
      console.error('Lỗi khi tìm kiếm phim:', error);
      throw error;
    }
  },
};

export default movieService;
