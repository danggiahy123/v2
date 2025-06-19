const API_BASE_URL = 'https://backend-app-lou3.onrender.com';

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
  async getAnimeMovies(params = { page: 1, limit: 10, price_type: undefined, showAll: false }) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit && !params.showAll) query.append('limit', params.limit.toString());
    if (params.price_type) query.append('price_type', params.price_type);
    if (params.showAll) query.append('showAll', 'true');
    const res = await fetch(`${API_BASE_URL}/api/anime/movies?${query}`);
    return res.json();
  },
  // Lấy anime trending
  async getTrendingAnime(params = { type: 'series', limit: 8, showAll: false }) {
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
  }
}; 