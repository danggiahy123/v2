import { ContinueWatchingResponse, HomeApiResponse } from '../types/movie';
import axios from 'axios';
import { BannerMovie, ContinueWatchingItem, GridMovie } from '../types/movie';

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
      poster?: string;
      image?: string;
      movie_type: string;
      producer: string;
    }>;
    total: number;
  };
}

export interface SearchMoviesParams {
  tuKhoa?: string;
  theLoai?: string;
  loaiPhim?: 'Phim lẻ' | 'Phim bộ';
  mienphi?: boolean;
  sapXep?: 'moi-nhat' | 'cu-nhat';
  limit?: number;
  offset?: number;
}

interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

interface SearchResponse {
  movies: GridMovie[];
  total: number;
}

interface SearchParams {
  tuKhoa?: string;
  theLoai?: string;
  loaiPhim?: 'Phim lẻ' | 'Phim bộ';
  mienphi?: boolean;
  sapXep?: 'moi-nhat' | 'cu-nhat';
}

export const movieService = {

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

export default movieService;
