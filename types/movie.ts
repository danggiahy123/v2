/**
 * MOVIE TYPES - Định nghĩa types cho movie system
 * MÔ TẢ: Chứa tất cả interfaces liên quan đến movies và content
 * BASE: Swagger API documentation
 * BAO GỒM:
 * - Movie models (Banner, Grid, Continue Watching)
 * - API response types
 * - Section types cho home screen
 * SỬ DỤNG: Import vào các component và services cần movie data
 */

/**
 * BANNER MOVIE - Movie hiển thị trong banner slideshow
 * FEATURES: Full info với description, genres, release year
 */
export interface BannerMovie {
  movieId: string;                // Unique movie identifier
  title: string;                  // Tên phim
  poster: string;                 // URL poster image
  description?: string;           // Mô tả phim (optional)
  releaseYear?: number;           // Năm phát hành (optional)
  movieType: string;              // Loại phim (movie/series/anime)
  producer: string;               // Nhà sản xuất
  genres: string[];               // Danh sách thể loại
}

/**
 * GRID MOVIE - Movie hiển thị trong grid layout
 * FEATURES: Basic info cho grid display
 */
export interface GridMovie {
  movieId: string;                // Unique movie identifier
  title: string;                  // Tên phim
  poster: string;                 // URL poster image
  movieType: string;              // Loại phim
  producer: string;               // Nhà sản xuất
  rating?: number;                // Rating score (optional)
  year?: number;                  // Release year (optional)
}

/**
 * NAVIGABLE MOVIE ITEM - Unified interface cho navigation
 * FEATURES: Standardized props cho tất cả movie cards với navigation
 */
export interface NavigableMovieItem {
  movieId: string;                // Unique movie identifier
  title: string;                  // Tên phim
  poster: string;                 // URL poster image
  movieType?: string;             // Loại phim (optional)
  year?: number;                  // Release year (optional)
  rating?: number;                // Rating score (optional)
}

/**
 * CONTINUE WATCHING ITEM - Phim đang xem dở
 * FEATURES: Enhanced progress tracking với remaining time và episode info
 */
export interface ContinueWatchingItem {
  movieId: string;                // Unique movie identifier
  title: string;                  // Tên phim
  poster: string;                 // URL poster image
  movieType: 'Phim lẻ' | 'Phim bộ'; // Loại phim
  progress: number;               // Tiến độ xem (0-1)
  progressPercentage: number;     // Tiến độ xem (0-100%)
  currentTime: number;            // Thời gian hiện tại (seconds)
  duration: number;               // Tổng thời lượng (seconds)
  remainingTime: number;          // Thời gian còn lại (seconds)
  remainingTimeFormatted: string; // "15 phút còn lại"
  lastWatchedAt: string;          // Thời gian xem cuối cùng
  episodeId: string;              // ID của episode
  episodeNumber?: number;         // Số tập (cho phim bộ)
  episodeTitle?: string;          // Tên tập (cho phim bộ)
}

/**
 * MOVIE SECTION - Generic section cho home screen
 * FEATURES: Flexible structure cho different content types
 */
export interface MovieSection {
  title: string;                                    // Tiêu đề section
  type: 'banner_list' | 'grid' | 'continue_watching';  // Loại hiển thị
  movies?: BannerMovie[] | GridMovie[];             // Movie data (cho banner/grid)
  data?: ContinueWatchingItem[];                    // Continue watching data
}

/**
 * API RESPONSE TYPES - Response từ movie APIs
 */

// Response từ home API (banner + recommended)
export interface HomeApiResponse {
  status: string;                 // API status
  data: {
    banner: {
      title: string;              // Banner section title
      type: 'banner_list';        // Section type
      movies: BannerMovie[];      // Banner movies array
    };
    recommended: {
      title: string;              // Recommended section title
      type: 'grid';               // Section type
      movies: GridMovie[];        // Recommended movies array
    };
  };
}

// Response từ continue watching API
export interface ContinueWatchingResponse {
  status: string;                 // API status
  data: {
    title: string;                // Section title
    type: 'continue_watching';    // Section type
    data: ContinueWatchingItem[]; // Continue watching items
  };
}

/**
 * SERIES TYPES - Types cho series API
 */

// Genre type cho series
export interface SeriesGenre {
  _id: string;
  genre_name: string;
  description?: string;
}

// Episode type cho series
export interface SeriesEpisode {
  _id: string;
  episode_title: string;
  uri: string;
  episode_number: number;
  episode_description: string;
  duration: number;
  movie_id: string;
  createdAt: string;
  updatedAt: string;
}

// Series movie type
export interface SeriesMovie {
  _id: string;
  movie_title: string;
  description: string;
  poster_path: string;
  genres: SeriesGenre[];
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

// Series detail type (bao gồm episodes)
export interface SeriesDetail extends SeriesMovie {
  episodes: SeriesEpisode[];
}

// Series API response types
export interface SeriesResponse {
  success: boolean;
  data: SeriesMovie[];
}

export interface SeriesDetailResponse {
  success: boolean;
  data: SeriesDetail;
}

// Country tab type
export interface CountryTab {
  id: string;
  name: string;
}

export interface CountryTabsResponse {
  success: boolean;
  data: CountryTab[];
}

// Banner series response type
export interface BannerSeriesResponse {
  success: boolean;
  data: {
    banner: {
      title: string;
      type: 'banner_list';
      movies: BannerMovie[];
    };
    recommended: {
      title: string;
      type: 'grid';
      movies: GridMovie[];
    };
  };
}

// API response thực tế từ server cho series grid
export interface SeriesGridResponse {
  success: boolean;
  data: {
    movies: SeriesMovie[];
    title: string;
    type: 'grid';
    total: number;
    showAll: boolean;
  };
}

export type WatchingContext = 'resume' | 'start_new' | 'continue_episode' | 'error'; 