const API_BASE_URL = 'https://backend-app-lou3.onrender.com';

export const animeService = {
  // Lấy tất cả anime (trending, series, movies)
  async getAllAnime() {
    const res = await fetch(`${API_BASE_URL}/api/anime`);
    return res.json();
  },
  // Lấy danh sách anime phim bộ
  async getAnimeSeries(params = { page: 1, limit: 10 }) {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE_URL}/api/anime/series?${query}`);
    return res.json();
  },
  // Lấy danh sách anime chiếu rạp
  async getAnimeMovies(params = { page: 1, limit: 10, price_type: undefined }) {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE_URL}/api/anime/movies?${query}`);
    return res.json();
  },
  // Lấy anime trending
  async getTrendingAnime(params = { type: 'series', limit: 8 }) {
    const query = new URLSearchParams(params as any).toString();
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