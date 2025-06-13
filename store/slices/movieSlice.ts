import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { movieService } from '../../services/movieService';

export interface Episode {
  episode_title: string;
  episode_number: number;
  uri: string | null;
}

export interface Movie {
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
  episodes?: Episode[];
  total_episodes?: number;
  uri?: string | null;
  episode_description?: string;
  poster?: string;
  image?: string;
}

export interface SearchMoviesParams {
  tuKhoa?: string;
  theLoai?: string;
  loaiPhim?: 'Phim bộ' | 'Phim lẻ';
  mienphi?: boolean;
  sapXep?: 'moi-nhat' | 'cu-nhat';
}

export interface MovieState {
  searchResults: Movie[];
  recentSearches: string[];
  loading: boolean;
  error: string | null;
}

const initialState: MovieState = {
  searchResults: [],
  recentSearches: [],
  loading: false,
  error: null,
};

// ✅ Thunk sử dụng movieService chuẩn
export const searchMovies = createAsyncThunk(
  'movies/search',
  async (params: SearchMoviesParams) => {
    try {
      const data = await movieService.searchMovies(params);
      
      if (!data?.data?.movies || !Array.isArray(data.data.movies)) {
        throw new Error('Không có dữ liệu phim');
      }

      const movies: Movie[] = data.data.movies.map((movie: any) => ({
        _id: movie._id || '',
        movie_title: movie.movie_title || 'Không có tiêu đề',
        description: movie.description || '',
        production_time: movie.production_time || 'N/A',
        producer: movie.producer || '',
        movie_type: movie.movie_type || 'Phim lẻ',
        price: movie.price || 0,
        is_free: movie.is_free || false,
        price_display: movie.price_display || '',
        genres: Array.isArray(movie.genres) ? movie.genres : [],
        episodes: Array.isArray(movie.episodes) ? movie.episodes : [],
        total_episodes: movie.total_episodes || 0,
        uri: movie.uri || null,
        episode_description: movie.episode_description || '',
        poster: movie.poster || movie.image || null
      }));

      if (movies.length === 0) {
        throw new Error('Không tìm thấy phim phù hợp');
      }

      return movies;
    } catch (error: any) {
      console.error('Lỗi khi tìm phim:', error);
      throw new Error(error.message || 'Không thể tìm thấy phim');
    }
  }
);

// ✅ Slice quản lý state
const movieSlice = createSlice({
  name: 'movies',
  initialState,
  reducers: {
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.error = null;
    },
    addRecentSearch: (state, action) => {
      const keyword = action.payload;
      if (keyword && !state.recentSearches.includes(keyword)) {
        state.recentSearches = [keyword, ...state.recentSearches].slice(0, 5);
      }
    },
    removeRecentSearch: (state, action) => {
      state.recentSearches = state.recentSearches.filter(
        (search) => search !== action.payload
      );
    },
    clearRecentSearches: (state) => {
      state.recentSearches = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchMovies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchMovies.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
        state.error = null;
      })
      .addCase(searchMovies.rejected, (state, action) => {
        state.loading = false;
        state.searchResults = [];
        state.error = action.error.message || 'Có lỗi xảy ra khi tìm kiếm';
      });
  },
});

// ✅ Export
export const {
  clearSearchResults,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
} = movieSlice.actions;

export default movieSlice.reducer;
