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

interface SearchMoviesResponse {
  status: string;
  data: {
    movies: Array<{
      _id: string;
      movie_title: string;
      description: string;
      production_time: string;
      producer: string;
      movie_type: string;
      price: number;
      is_free: boolean;
      price_display: string;
      genres: Array<{ name: string }>;
      episodes?: Array<{
        episode_title: string;
        episode_number: number;
        uri: string | null;
      }>;
      total_episodes?: number;
      uri?: string | null;
      episode_description?: string;
      image?: string;
      poster?: string;
    }>;
    total: number;
  };
}

export interface SearchMoviesParams {
  loaiPhim?: 'Phim lẻ' | 'Phim bộ';
  theLoai?: string;
  tuKhoa?: string;
  sapXep?: 'moi-nhat' | 'cu-nhat';
  limit?: number;
  offset?: number;
  mienphi?: boolean;
}

export const movieService = {
  // 📌 Search movies
  async searchMovies(params: SearchMoviesParams): Promise<SearchMoviesResponse> {
    const queryParams = new URLSearchParams();

    if (params.tuKhoa) queryParams.append('tuKhoa', params.tuKhoa);
    if (params.theLoai) queryParams.append('genre', params.theLoai);
    if (params.loaiPhim) queryParams.append('type', params.loaiPhim);
    if (params.mienphi !== undefined) queryParams.append('free', params.mienphi.toString());
    if (params.sapXep) queryParams.append('sort', params.sapXep);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const url = `${API_BASE_URL}/api/movies/search?${queryParams.toString()}`;
    console.log('🔍 Search URL:', url);
    console.log('Search params:', params);

    try {
      console.log('Sending request to:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      });
      
      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Full response text:', responseText);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed response data:', data);
      } catch (e) {
        console.error('Failed to parse response:', e);
        throw new Error('Invalid JSON response from server');
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }

      return data as SearchMoviesResponse;
    } catch (error: any) {
      console.error('❌ Search error:', error);
      throw new Error(error?.message || 'Lỗi khi tìm kiếm phim');
    }
  },

  // Các API khác giữ nguyên
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

  async getContinueWatching(userId: string, limit?: number): Promise<ContinueWatchingResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('userId', userId);
    if (limit) queryParams.append('limit', limit.toString());

    const url = `${API_BASE_URL}/api/home/continue-watching?${queryParams.toString()}`;
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });

    if (!response.ok) throw new Error(`Failed to fetch continue watching: ${response.status}`);
    return response.json();
  },

  async getTrending(limit?: number): Promise<GenericMovieResponse> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());

    const url = `${API_BASE_URL}/api/home/trending${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });

    if (!response.ok) throw new Error(`Failed to fetch trending: ${response.status}`);
    return response.json();
  },

  async getTopRated(limit?: number): Promise<GenericMovieResponse> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());

    const url = `${API_BASE_URL}/api/home/top-rated${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });

    if (!response.ok) throw new Error(`Failed to fetch top-rated: ${response.status}`);
    return response.json();
  },

  async getSports(params?: { limit?: number; status?: 'upcoming' | 'released' | 'ended' }): Promise<GenericMovieResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const url = `${API_BASE_URL}/api/home/sports${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });

    if (!response.ok) throw new Error(`Failed to fetch sports: ${response.status}`);
    return response.json();
  },

  async getAnime(limit?: number): Promise<GenericMovieResponse> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());

    const url = `${API_BASE_URL}/api/home/anime${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });

    if (!response.ok) throw new Error(`Failed to fetch anime: ${response.status}`);
    return response.json();
  },

  async getVietnamese(limit?: number): Promise<GenericMovieResponse> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());

    const url = `${API_BASE_URL}/api/home/vietnamese${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });

    if (!response.ok) throw new Error(`Failed to fetch vietnamese: ${response.status}`);
    return response.json();
  },

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
