import { Episode } from './episode';

/**
 * 🎬 MOVIE DETAIL TYPES
 * 
 * Định nghĩa các interface cho màn hình chi tiết phim
 * Dựa trên API: getMovieDetailWithInteractions
 */

// =====================================
// CORE MOVIE DETAIL TYPES
// =====================================

export interface MovieDetail {
  movieId: string;
  movie_title: string;
  description: string;
  production_time: string;
  producer: string;
  movie_type: 'Phim lẻ' | 'Phim bộ' | 'Phim thể thao';
  price: number;
  is_free: boolean;
  price_display: string;
  poster_path: string;
  backdrop_path?: string;
  
  // Video properties for single movies
  uri?: string;
  video_url?: string;
  duration?: number;
  
  // Additional properties from API
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  release_date?: string;
  
  // Image properties
  poster?: string;
  image?: string;
  
  // Rating & Statistics
  totalRating?: number;
  averageRating?: number;
  rating?: number;
  likeCount?: number;
  viewCount?: number;
  commentCount?: number;
  
  // Related Data
  genres: Genre[];
  episodes: Episode[];
  userInteractions?: UserInteractions;
  recentComments: Comment[];
  relatedMovies: RelatedMovie[];
  
  // UI Configuration
  tabs: TabsConfig;
}

// =====================================
// USER INTERACTIONS
// =====================================

export interface UserInteractions {
  hasLiked: boolean;
  hasRated: boolean;
  userComment: string | null;
  isFavorite: boolean;
  isFollowing: boolean;
  watchingProgress: WatchingProgress | null;
}

export interface WatchingProgress {
  episodeId: string;
  episodeNumber: number;
  watchPercentage: number;
  currentTime: number;
  duration?: number;
  lastWatched: string;
  completed: boolean;
}

// =====================================
// RELATED DATA TYPES
// =====================================

export interface Genre {
  _id: string;
  genre_name: string;
  slug: string;
}

export interface Comment {
  _id: string;
  user: {
    full_name: string;
    email: string;    
  };
  comment: string;
  isLike: boolean;
  createdAt: string;
}

export interface RelatedMovie {
  movieId: string;
  title: string;
  poster: string;
  movieType: string;
  producer: string;
}

export interface TabsConfig {
  showEpisodesList: boolean;
  showRelated: boolean;
}

// =====================================
// API RESPONSE TYPES
// =====================================

export interface MovieDetailResponse {
  status: 'success' | 'error';
  data: {
    movie: MovieDetail;
  };
  message?: string;
}

export interface MovieDetailApiResponse {
  status: string;
  data: {
    movie: {
      // Basic Info
      _id: string;
      movie_title: string;
      description: string;
      production_time: string;
      producer: string;
      movie_type: string;
      price: number;
      is_free: boolean;
      price_display: string;
      poster_path: string;
      backdrop_path?: string;
      
      // Stats
      totalRating: number;
      averageRating: number;  
      likeCount: number;
      viewCount: number;
      
      // Related Data
      genres: any[];
      episodes: any[];
      userInteractions?: any;
      recentComments: any[];
      relatedMovies: any[];
      tabs: any;
    };
  };
}

// =====================================
// UI STATE TYPES
// =====================================

export interface MovieDetailState {
  movieDetail: MovieDetail | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}

export interface MovieDetailScreenParams {
  id: string;
  userId?: string;
}

// =====================================
// COMPONENT PROPS TYPES
// =====================================

export interface MovieDetailHeaderProps {
  movie: MovieDetail;
  onPlayPress: () => void;
  onSharePress: () => void;
}

export interface MovieDetailInfoProps {
  movie: MovieDetail;
}

export interface MovieDetailActionsProps {
  movie: MovieDetail;
  onLikePress: () => void;
  onFavoritePress: () => void;
  onCommentPress: () => void;
  onSharePress: () => void;
}

export interface EpisodesListProps {
  episodes: Episode[];
  currentEpisode?: Episode;
  onEpisodePress: (episode: Episode) => void;
}

export interface RelatedMoviesProps {
  movies: RelatedMovie[];
  onMoviePress: (movieId: string) => void;
}

export interface UserCommentsProps {
  comments: Comment[];
  onCommentPress: () => void;
  onViewAllPress: () => void;
}

// =====================================
// LOADING & ERROR TYPES
// =====================================

export interface LoadingState {
  movieDetail: boolean;
  userInteractions: boolean;
  episodes: boolean;
  comments: boolean;
}

export interface ErrorState {
  movieDetail: string | null;
  userInteractions: string | null;
  episodes: string | null;
  comments: string | null;
} 