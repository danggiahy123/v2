import { ContinueWatchingResponse, HomeApiResponse } from '../types/movie';

const API_BASE_URL = 'https://backend-app-lou3.onrender.com';

interface GenericMovieResponse {
  status: string;
  data: {
    title: string;
    type: 'grid';
    movies: any[];
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
 * 6. getAnime - Lấy anime
 * 7. getVietnamese - Lấy phim Việt Nam
 * 8. getComingSoon - Lấy phim sắp chiếu
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
    return response.json();
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
   * THAM SỐ: limit - Số lượng phim (optional)
   * TRẢ VỀ: { data: { title, movies: [] } }
   */
  async getTrending(limit?: number): Promise<GenericMovieResponse> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());

    const url = `${API_BASE_URL}/api/home/trending${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });

    if (!response.ok) throw new Error(`Failed to fetch trending: ${response.status}`);
    return response.json();
  },

  /**
   * API 4: Lấy phim đánh giá cao
   * ENDPOINT: GET /api/home/top-rated
   * THAM SỐ: limit - Số lượng phim (optional)
   * TRẢ VỀ: { data: { title, movies: [] } }
   */
  async getTopRated(limit?: number): Promise<GenericMovieResponse> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());

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
   * TRẢ VỀ: { data: { title, movies: [] } }
   */
  async getSports(params?: { limit?: number; status?: 'upcoming' | 'released' | 'ended' }): Promise<GenericMovieResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const url = `${API_BASE_URL}/api/home/sports${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });

    if (!response.ok) throw new Error(`Failed to fetch sports: ${response.status}`);
    return response.json();
  },

  /**
   * API 6: Lấy anime/hoạt hình
   * ENDPOINT: GET /api/home/anime
   * THAM SỐ: limit - Số lượng phim (optional)
   * TRẢ VỀ: { data: { title, movies: [] } }
   */
  async getAnime(limit?: number): Promise<GenericMovieResponse> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());

    const url = `${API_BASE_URL}/api/home/anime${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });

    if (!response.ok) throw new Error(`Failed to fetch anime: ${response.status}`);
    return response.json();
  },

  /**
   * API 7: Lấy phim Việt Nam
   * ENDPOINT: GET /api/home/vietnamese
   * THAM SỐ: limit - Số lượng phim (optional)
   * TRẢ VỀ: { data: { title, movies: [] } }
   */
  async getVietnamese(limit?: number): Promise<GenericMovieResponse> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());

    const url = `${API_BASE_URL}/api/home/vietnamese${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });

    if (!response.ok) throw new Error(`Failed to fetch vietnamese: ${response.status}`);
    return response.json();
  },

  /**
   * API 8: Lấy phim sắp chiếu
   * ENDPOINT: GET /api/home/coming-soon
   * THAM SỐ:
   * - limit: Số lượng phim (optional)
   * - days: Phim sắp chiếu trong vòng bao nhiêu ngày (optional)
   * TRẢ VỀ: { data: { title, movies: [] } }
   */
  async getComingSoon(params?: { limit?: number; days?: number }): Promise<GenericMovieResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.days) queryParams.append('days', params.days.toString());

    const url = `${API_BASE_URL}/api/home/coming-soon${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });

    if (!response.ok) throw new Error(`Failed to fetch coming soon: ${response.status}`);
    return response.json();
  },
};

export default movieService;
