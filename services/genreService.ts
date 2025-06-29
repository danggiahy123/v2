import axios from 'axios';

const API_BASE_URL = 'https://backend-app-lou3.onrender.com';

export interface Genre {
  _id: string;
  genre_name: string;
  description?: string;
  poster?: string;
  parent_genre?: string;
  is_parent: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface GenreResponse {
  status: string;
  data: {
    genres: Genre[];
    total: number;
    type: string;
    format: string;
  };
}

export interface GenreMoviesResponse {
  status: string;
  data: {
    genre: Genre;
    movies: any[];
    total: number;
  };
}

class GenreService {
  // Lấy danh sách thể loại
  async getGenres(type: 'all' | 'parent' | 'active' | 'children' = 'all', parentId?: string): Promise<GenreResponse> {
    try {
      const params = new URLSearchParams();
      if (type !== 'all') {
        params.append('type', type);
      }
      if (parentId) {
        params.append('parent_id', parentId);
      }

      const response = await axios.get(`${API_BASE_URL}/api/genres?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching genres:', error);
      throw error;
    }
  }

  // Lấy danh sách phim của thể loại
  async getGenreMovies(genreId: string): Promise<GenreMoviesResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/genres/${genreId}/movies`);
      return response.data;
    } catch (error) {
      console.error('Error fetching genre movies:', error);
      throw error;
    }
  }

  // Lấy thể loại theo ID
  async getGenreById(id: string): Promise<{ status: string; data: { genre: Genre } }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/genres/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching genre by ID:', error);
      throw error;
    }
  }

  // Cập nhật thể loại (Admin)
  async updateGenre(id: string, data: Partial<Genre>): Promise<{ status: string; message: string; data: { genre: Genre } }> {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/genres/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating genre:', error);
      throw error;
    }
  }

  // Xóa thể loại (Admin)
  async deleteGenre(id: string): Promise<{ status: string; message: string }> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/genres/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting genre:', error);
      throw error;
    }
  }

  // Cập nhật trạng thái thể loại (Admin)
  async updateGenreStatus(id: string, action?: 'activate' | 'deactivate'): Promise<{ status: string; message: string; data: { genre: Genre } }> {
    try {
      const data = action ? { action } : {};
      const response = await axios.put(`${API_BASE_URL}/api/genres/${id}/status`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating genre status:', error);
      throw error;
    }
  }
}

export const genreService = new GenreService(); 