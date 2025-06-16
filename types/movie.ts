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
}

/**
 * CONTINUE WATCHING ITEM - Phim đang xem dở
 * FEATURES: Progress tracking và last watched time
 */
export interface ContinueWatchingItem {
  movieId: string;                // Unique movie identifier
  title: string;                  // Tên phim
  poster: string;                 // URL poster image
  progress: number;               // Tiến độ xem (0-100%)
  lastWatchedAt: string;          // Thời gian xem cuối cùng
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