import { 
  SearchRegisteredParams, 
  SearchRegisteredResponse 
} from '../types/movie';

const API_BASE_URL = 'https://backend-app-lou3.onrender.com';

/**
 * REGISTERED MOVIE SERVICE
 * Service để xử lý API tìm kiếm phim đã đăng ký
 * 
 * BASE URL: https://backend-app-lou3.onrender.com
 * ENDPOINT: /api/movies/search-registered
 * 
 * CHỨC NĂNG:
 * - searchRegisteredMovies: Tìm kiếm phim đã thuê/đăng ký của user
 */
export const registeredMovieService = {
  
  /**
   * Tìm kiếm phim đã đăng ký của user
   * @param params - Tham số tìm kiếm { userId: string, q?: string }
   * @returns Promise<SearchRegisteredResponse>
   */
  async searchRegisteredMovies(params: SearchRegisteredParams): Promise<SearchRegisteredResponse> {
    try {
      console.log('🔍 [RegisteredMovieService] Searching with params:', params);
      
      const queryParams = new URLSearchParams();
      queryParams.append('userId', params.userId);
      
      // Chỉ thêm q parameter nếu có từ khóa tìm kiếm
      if (params.q && params.q.trim()) {
        queryParams.append('q', params.q.trim());
      }

      const url = `${API_BASE_URL}/api/movies/search-registered?${queryParams.toString()}`;
      console.log('🌐 [RegisteredMovieService] Request URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 [RegisteredMovieService] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [RegisteredMovieService] API Error:', response.status, errorText);
        
        // Kiểm tra lỗi cụ thể
        if (response.status === 400 && errorText.includes('ObjectId')) {
          throw new Error('User ID không hợp lệ. Vui lòng đăng nhập lại.');
        }
        
        throw new Error(`API Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📦 [RegisteredMovieService] Response data:', {
        status: data.status,
        movieCount: data.data?.length || 0,
        firstMovie: data.data?.[0]?.movie_title || 'No movies'
      });
      
      return data;
    } catch (error) {
      console.error('💥 [RegisteredMovieService] Error searching registered movies:', error);
      throw error;
    }
  }
};

export default registeredMovieService; 