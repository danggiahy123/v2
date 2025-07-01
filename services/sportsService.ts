import { GridMovie } from '../types/movie';

const API_BASE_URL = 'https://backend-app-lou3.onrender.com';

interface SportsApiResponse {
  status: string;
  data: GridMovie[];
}

/**
 * SPORTS SERVICE - Quản lý tất cả API calls liên quan đến thể thao
 * 
 * CHỨC NĂNG CHÍNH:
 * 1. getAllSports - Lấy tất cả phim thể thao
 * 2. getNBAMovies - Lấy phim NBA
 * 3. getFootballMovies - Lấy phim bóng đá
 */
export const sportsService = {

  /**
   * API 1: Lấy tất cả phim thể thao
   * ENDPOINT: GET /api/movies/sports
   * TRẢ VỀ: { status, data: GridMovie[] }
   */
  async getAllSports(): Promise<SportsApiResponse> {
    const url = `${API_BASE_URL}/api/movies/sports`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sports movies: ${response.status}`);
    }

    const rawData = await response.json();
    
    // Map API response to GridMovie format
    const mappedMovies = (rawData.data || []).map((movie: any) => ({
      movieId: movie._id || movie.id,
      title: movie.movie_title || movie.title,
      poster: movie.poster_path || movie.poster,
      movieType: movie.movie_type || movie.movieType || 'Thể thao',
      producer: movie.producer || '',
      rating: movie.rating,
      year: movie.year || movie.release_year,
      // Preserve raw data for compatibility
      _id: movie._id,
      movie_title: movie.movie_title,
      poster_path: movie.poster_path,
      movie_type: movie.movie_type
    }));

    console.log('🏃‍♂️ [SportsService] Fetched all sports movies:', mappedMovies?.length || 0);
    return {
      status: rawData.status,
      data: mappedMovies
    };
  },

  /**
   * API 2: Lấy danh sách phim NBA
   * ENDPOINT: GET /api/movies/nba-list
   * TRẢ VỀ: { status, data: GridMovie[] }
   */
  async getNBAMovies(): Promise<SportsApiResponse> {
    const url = `${API_BASE_URL}/api/movies/nba-list`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch NBA movies: ${response.status}`);
    }

    const rawData = await response.json();
    
    // Map API response to GridMovie format
    const mappedMovies = (rawData.data || []).map((movie: any) => ({
      movieId: movie._id || movie.id,
      title: movie.movie_title || movie.title,
      poster: movie.poster_path || movie.poster,
      movieType: movie.movie_type || movie.movieType || 'NBA',
      producer: movie.producer || '',
      rating: movie.rating,
      year: movie.year || movie.release_year,
      // Preserve raw data for compatibility
      _id: movie._id,
      movie_title: movie.movie_title,
      poster_path: movie.poster_path,
      movie_type: movie.movie_type
    }));

    console.log('🏀 [SportsService] Fetched NBA movies:', mappedMovies?.length || 0);
    return {
      status: rawData.status,
      data: mappedMovies
    };
  },

  /**
   * API 3: Lấy danh sách phim bóng đá
   * ENDPOINT: GET /api/movies/football-list  
   * TRẢ VỀ: { status, data: GridMovie[] }
   */
  async getFootballMovies(): Promise<SportsApiResponse> {
    const url = `${API_BASE_URL}/api/movies/football-list`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch football movies: ${response.status}`);
    }

    const rawData = await response.json();
    
    // Map API response to GridMovie format
    const mappedMovies = (rawData.data || []).map((movie: any) => ({
      movieId: movie._id || movie.id,
      title: movie.movie_title || movie.title,
      poster: movie.poster_path || movie.poster,
      movieType: movie.movie_type || movie.movieType || 'Bóng đá',
      producer: movie.producer || '',
      rating: movie.rating,
      year: movie.year || movie.release_year,
      // Preserve raw data for compatibility
      _id: movie._id,
      movie_title: movie.movie_title,
      poster_path: movie.poster_path,
      movie_type: movie.movie_type
    }));

    console.log('⚽ [SportsService] Fetched football movies:', mappedMovies?.length || 0);
    return {
      status: rawData.status,
      data: mappedMovies
    };
  },

  /**
   * API 4: Lấy phim thể thao theo loại
   * Helper function để lấy phim theo từng loại thể thao
   */
  async getSportsByType(type: 'all' | 'nba' | 'football'): Promise<SportsApiResponse> {
    switch (type) {
      case 'nba':
        return this.getNBAMovies();
      case 'football':
        return this.getFootballMovies();
      case 'all':
      default:
        return this.getAllSports();
    }
  }
}; 