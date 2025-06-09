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

export const movieService = {
  // Get new releases for banner and recommended sections
  async getNewReleases(params?: {
    bannerLimit?: number;
    limit?: number;
    days?: number;
  }): Promise<HomeApiResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.bannerLimit) queryParams.append('bannerLimit', params.bannerLimit.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.days) queryParams.append('days', params.days.toString());
    
    const url = `${API_BASE_URL}/api/home/new-releases${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch new releases: ${response.status}`);
    }
    
    return response.json();
  },

  // Get continue watching for user
  async getContinueWatching(userId: string, limit?: number): Promise<ContinueWatchingResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('userId', userId);
    if (limit) queryParams.append('limit', limit.toString());
    
    const url = `${API_BASE_URL}/api/home/continue-watching?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch continue watching: ${response.status}`);
    }
    
    return response.json();
  },

  // Get trending movies
  async getTrending(limit?: number): Promise<GenericMovieResponse> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());
    
    const url = `${API_BASE_URL}/api/home/trending${limit ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch trending: ${response.status}`);
    }
    
    return response.json();
  },

  // Get top-rated movies
  async getTopRated(limit?: number): Promise<GenericMovieResponse> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());
    
    const url = `${API_BASE_URL}/api/home/top-rated${limit ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch top-rated: ${response.status}`);
    }
    
    return response.json();
  },

  // Get sports events
  async getSports(params?: { limit?: number; status?: 'upcoming' | 'released' | 'ended' }): Promise<GenericMovieResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    
    const url = `${API_BASE_URL}/api/home/sports${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch sports: ${response.status}`);
    }
    
    return response.json();
  },

  // Get anime hot
  async getAnime(limit?: number): Promise<GenericMovieResponse> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());
    
    const url = `${API_BASE_URL}/api/home/anime${limit ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch anime: ${response.status}`);
    }
    
    return response.json();
  },

  // Get Vietnamese movies
  async getVietnamese(limit?: number): Promise<GenericMovieResponse> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());
    
    const url = `${API_BASE_URL}/api/home/vietnamese${limit ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch vietnamese: ${response.status}`);
    }
    
    return response.json();
  },

  // Get coming soon movies
  async getComingSoon(params?: { limit?: number; days?: number }): Promise<GenericMovieResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.days) queryParams.append('days', params.days.toString());
    
    const url = `${API_BASE_URL}/api/home/coming-soon${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch coming soon: ${response.status}`);
    }
    
    return response.json();
  },
}; 