const API_BASE_URL = 'https://backend-app-lou3.onrender.com';

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

interface BannerAnimeResponse {
  status: string;
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

export const animeService = {
  // Lấy tất cả anime (trending, series, movies)
  async getAllAnime(params?: { showAll?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.showAll) queryParams.append('showAll', 'true');
    const res = await fetch(`${API_BASE_URL}/api/anime${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
    return res.json();
  },
  // Lấy danh sách anime phim bộ
  async getAnimeSeries(params = { page: 1, limit: 10, showAll: false }) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit && !params.showAll) query.append('limit', params.limit.toString());
    if (params.showAll) query.append('showAll', 'true');
    const res = await fetch(`${API_BASE_URL}/api/anime/series?${query}`);
    return res.json();
  },
  // Lấy danh sách anime chiếu rạp
  async getAnimeMovies(params = { page: 1, limit: 13, price_type: undefined, showAll: false }) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit && !params.showAll) query.append('limit', params.limit.toString());
    if (params.price_type) query.append('price_type', params.price_type);
    if (params.showAll) query.append('showAll', 'true');
    const res = await fetch(`${API_BASE_URL}/api/anime/movies?${query}`);
    return res.json();
  },
  // Lấy anime trending
  async getTrendingAnime(params = { type: 'series', limit: 10, showAll: false }) {
    const query = new URLSearchParams();
    if (params.type) query.append('type', params.type);
    if (params.limit && !params.showAll) query.append('limit', params.limit.toString());
    if (params.showAll) query.append('showAll', 'true');
    const res = await fetch(`${API_BASE_URL}/api/anime/trending?${query}`);
    return res.json();
  },
  // Lấy chi tiết anime
  async getAnimeDetail(id: string) {
    const res = await fetch(`${API_BASE_URL}/api/anime/${id}`);
    return res.json();
  },
  // Lấy danh mục anime
  async getAnimeCategories() {
    const res = await fetch(`${API_BASE_URL}/api/anime/categories`);
    return res.json();
  },
  // Lấy banner hoạt hình
  async getBannerAnime(params?: { bannerLimit?: number; limit?: number; days?: number; showAll?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.bannerLimit) queryParams.append('bannerLimit', params.bannerLimit.toString());
    if (params?.limit && !params?.showAll) queryParams.append('limit', params.limit.toString());
    if (params?.days) queryParams.append('days', params.days.toString());
    if (params?.showAll) queryParams.append('showAll', 'true');
    
    const url = `${API_BASE_URL}/api/anime/banner-anime${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch banner anime');
    return response.json() as Promise<BannerAnimeResponse>;
  }
}; 