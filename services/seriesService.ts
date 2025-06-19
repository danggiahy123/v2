const API_BASE_URL = 'https://backend-app-lou3.onrender.com';

// Types cho API response
interface SeriesMovie {
  _id: string;
  movie_title: string;
  description: string;
  poster_path: string;
  genres: Array<{ genre_name: string }>;
  country?: string;
  total_episodes: number;
  view_count: number;
  favorite_count: number;
  release_status?: string;
  price: number;
  is_free: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BannerMovie {
  movieId: string;
  title: string;
  poster: string;
  description: string;
  releaseYear?: number;
  movieType: string;
  producer: string;
  genres: string[];
}

interface GridMovie {
  movieId: string;
  title: string;
  poster: string;
  movieType: string;
  producer: string;
}

interface SeriesResponse {
  success: boolean;
  data: SeriesMovie[];
}

interface BannerResponse {
  success: boolean;
  data: {
    banner: {
      title: string;
      type: string;
      movies: BannerMovie[];
    };
    recommended: {
      title: string;
      type: string;
      movies: GridMovie[];
    };
  };
}

export const seriesService = {
  // Lấy banner series (banner + recommended)
  async getBannerSeries(params?: { bannerLimit?: number; limit?: number; days?: number; showAll?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.bannerLimit) queryParams.append('bannerLimit', params.bannerLimit.toString());
    if (params?.limit && !params?.showAll) queryParams.append('limit', params.limit.toString());
    if (params?.days) queryParams.append('days', params.days.toString());
    if (params?.showAll) queryParams.append('showAll', 'true');
    const url = `${API_BASE_URL}/api/series/banner-series${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch banner series');
    return response.json();
  },

  // Lấy trending series
  async getTrendingSeries(params?: { limit?: number; showAll?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.limit && !params?.showAll) queryParams.append('limit', params.limit.toString());
    if (params?.showAll) queryParams.append('showAll', 'true');
    const response = await fetch(`${API_BASE_URL}/api/series/trending${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
    if (!response.ok) throw new Error('Failed to fetch trending series');
    return response.json();
  },

  // Lấy Vietnamese series
  async getVietnameseSeries(params?: { limit?: number; showAll?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.limit && !params?.showAll) queryParams.append('limit', params.limit.toString());
    if (params?.showAll) queryParams.append('showAll', 'true');
    const response = await fetch(`${API_BASE_URL}/api/series/vietnamese${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
    if (!response.ok) throw new Error('Failed to fetch Vietnamese series');
    return response.json();
  },

  // Lấy anime series
  async getAnimeSeries(params?: { limit?: number; showAll?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.limit && !params?.showAll) queryParams.append('limit', params.limit.toString());
    if (params?.showAll) queryParams.append('showAll', 'true');
    const response = await fetch(`${API_BASE_URL}/api/series/anime${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
    if (!response.ok) throw new Error('Failed to fetch anime series');
    return response.json();
  },

  // Lấy series detail
  async getSeriesById(id: string) {
    const response = await fetch(`${API_BASE_URL}/api/series/${id}`);
    if (!response.ok) throw new Error('Failed to fetch series detail');
    return response.json();
  }
};

// Hàm tiện lợi lấy banner section
export const getBannerSection = async () => {
  const data = await seriesService.getBannerSeries();
  return data.data.banner;
}; 