/**
 * MOVIE SLICE - Redux slice quản lý movie state
 * MÔ TẢ: Slice đơn giản cho movie state management
 * HIỆN TẠI: Chỉ có basic state (loading, error)
 * TƯƠNG LAI: Có thể mở rộng thêm movie data caching, favorites, etc.
 * NOTE: Movie data chủ yếu được fetch trực tiếp trong components
 */
import { createSlice } from '@reduxjs/toolkit';
// import { createAsyncThunk } from '@reduxjs/toolkit'; // For future async actions
// import { movieService } from '../../services/movieService'; // For future API calls

/**
 * EPISODE MODEL - Thông tin tập phim
 */
export interface Episode {
  episode_title: string;          // Tên tập phim
  episode_number: number;         // Số thứ tự tập
  uri: string | null;             // Link video (có thể null)
}

/**
 * MOVIE MODEL - Thông tin chi tiết phim
 * NOTE: Model này khác với types/movie.ts (dành cho home screen)
 * SỬ DỤNG: Cho movie detail screens và player
 */
export interface Movie {
  _id: string;                    // MongoDB ObjectId
  movie_title: string;            // Tên phim
  description: string;            // Mô tả phim
  production_time: string;        // Thời gian sản xuất
  producer: string;               // Nhà sản xuất
  movie_type: string;             // Loại phim (movie/series/anime)
  price: number;                  // Giá phim
  is_free: boolean;               // Phim miễn phí hay không
  price_display: string;          // Giá hiển thị (formatted)
  genres: { name: string }[];     // Danh sách thể loại
  episodes?: Episode[];           // Danh sách tập (cho series/anime)
  total_episodes?: number;        // Tổng số tập
  uri?: string | null;            // Link video chính (cho movie)
  episode_description?: string;   // Mô tả tập
  poster?: string;                // URL poster
  image?: string;                 // URL image khác
}

/**
 * MOVIE STATE - Redux state cho movies
 */
export interface MovieState {
  loading: boolean;               // Loading state
  error: string | null;           // Error message
}

// Initial state
const initialState: MovieState = {
  loading: false,
  error: null,
};

/**
 * MOVIE SLICE - Redux slice definition
 * NOTE: Hiện tại chỉ có basic state, chưa có async thunks
 */
const movieSlice = createSlice({
  name: 'movies',
  initialState,
  reducers: {
    // Có thể thêm sync reducers ở đây nếu cần
  },
  extraReducers: (builder) => {
    // Có thể thêm async thunks ở đây nếu cần
    // Ví dụ: fetchMovieDetails, toggleFavorite, etc.
  },
});

export default movieSlice.reducer;
