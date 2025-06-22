/**
 * 👤 USER INTERACTION TYPES
 * 
 * Định nghĩa các interface cho tương tác người dùng
 * Dựa trên các toggle APIs: toggleLike, toggleFavorite, etc.
 */

// =====================================
// TOGGLE LIKE TYPES
// =====================================

export interface ToggleLikeRequest {
  isLike: boolean;
  userId: string;
}

export interface ToggleLikeResponse {
  status: 'success' | 'error';
  message: string;
  data: {
    movieId: string;
    isLike: boolean;
    likeCount: number;
    userRating: UserRating | null;
  };
}

export interface UserRating {
  _id: string;
  isLike: boolean;
  hasComment: boolean;
  createdAt: string;
  updatedAt: string;
}

// =====================================
// TOGGLE FAVORITE TYPES
// =====================================

export interface ToggleFavoriteRequest {
  isFavorite: boolean;
  userId: string;
}

export interface ToggleFavoriteResponse {
  status: 'success' | 'error';
  message: string;
  data: {
    movieId: string;
    isFavorite: boolean;
    favoriteId?: string;
    addedAt?: string;
  };
}

// =====================================
// ADD COMMENT TYPES
// =====================================

export interface AddCommentRequest {
  comment: string;
  userId: string;
  isLike?: boolean;
}

export interface AddCommentResponse {
  status: 'success' | 'error';
  message: string;
  data: {
    movieId: string;
    comment: MovieComment;
    commentCount: number;
  };
}

export interface MovieComment {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  comment: string;
  isLike: boolean;
  createdAt: string;
  updatedAt: string;
}

// =====================================
// RATING TYPES
// =====================================

export interface RateMovieRequest {
  rating: number; // 1-5 stars
  comment?: string;
  userId: string;
}

export interface RateMovieResponse {
  status: 'success' | 'error';
  message: string;
  data: {
    movieId: string;
    userRating: {
      rating: number;
      comment?: string;
      createdAt: string;
    };
    movieStats: {
      averageRating: number;
      totalRatings: number;
    };
  };
}

// =====================================
// WATCHING PROGRESS TYPES
// =====================================

export interface UpdateProgressRequest {
  episodeId: string;
  currentTime: number;
  watchPercentage: number;
  userId: string;
  completed?: boolean;
}

export interface UpdateProgressResponse {
  status: 'success' | 'error';
  message: string;
  data: {
    episodeId: string;
    currentTime: number;
    watchPercentage: number;
    completed: boolean;
    lastWatched: string;
  };
}

// =====================================
// UI STATE TYPES
// =====================================

export interface UserInteractionState {
  // Like state
  isLiking: boolean;
  likeError: string | null;
  
  // Favorite state
  isFavoriting: boolean;
  favoriteError: string | null;
  
  // Comment state
  isCommenting: boolean;
  commentError: string | null;
  
  // Rating state
  isRating: boolean;
  ratingError: string | null;
  
  // Progress state
  isUpdatingProgress: boolean;
  progressError: string | null;
}

// =====================================
// INTERACTION HISTORY TYPES
// =====================================

export interface InteractionHistory {
  movieId: string;
  actions: InteractionAction[];
}

export interface InteractionAction {
  type: 'like' | 'unlike' | 'favorite' | 'unfavorite' | 'comment' | 'rate' | 'watch';
  timestamp: string;
  data?: any;
}

// =====================================
// COMPONENT INTERACTION TYPES
// =====================================

export interface LikeButtonProps {
  movieId: string;
  initialLiked: boolean;
  likeCount: number;
  userId: string;
  onLikeChange: (liked: boolean, newCount: number) => void;
  disabled?: boolean;
}

export interface FavoriteButtonProps { 
  movieId: string;
  initialFavorited: boolean;
  userId: string;
  onFavoriteChange: (favorited: boolean) => void;
  disabled?: boolean;
}

export interface RatingStarsProps {
  movieId: string;
  initialRating: number;
  averageRating: number;
  totalRatings: number;
  userId: string;
  onRatingChange: (rating: number) => void;
  readonly?: boolean;
}

export interface CommentInputProps {
  movieId: string;
  userId: string;
  placeholder?: string;
  onCommentSubmit: (comment: string) => void;
  onCancel: () => void;
  initialComment?: string;
  isEditing?: boolean;
}

// =====================================
// INTERACTION ANALYTICS TYPES
// =====================================

export interface InteractionAnalytics {
  movieId: string;
  userId: string;
  sessionId: string;
  interactions: {
    likes: number;
    favorites: number;
    comments: number;
    ratings: number;
    watchTime: number;
  };
  startTime: string;
  endTime?: string;
}

// =====================================
// BULK OPERATIONS TYPES
// =====================================

export interface BulkInteractionRequest {
  userId: string;
  operations: BulkOperation[];
}

export interface BulkOperation {
  movieId: string;
  action: 'like' | 'unlike' | 'favorite' | 'unfavorite';
}

export interface BulkInteractionResponse {
  status: 'success' | 'error';
  message: string;
  data: {
    successful: number;
    failed: number;
    results: BulkOperationResult[];
  };
}

export interface BulkOperationResult {
  movieId: string;
  action: string;
  success: boolean;
  error?: string;
} 