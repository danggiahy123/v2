import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.5.85:3003';

/**
 * Interface cho thống kê rating của phim
 */
interface RatingStats {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

/**
 * Interface cho rating của user
 */
interface UserRating {
  _id: string;
  star_rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface cho rating item trong danh sách
 */
interface RatingItem {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  star_rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface cho response của API thêm/cập nhật rating
 */
interface AddRatingResponse {
  status: string;
  message: string;
  data: {
    rating: {
      _id: string;
      user: {
        _id: string;
        name: string;
        email: string;
      };
      star_rating: number;
      comment: string;
      rating_type: string;
      createdAt: string;
      updatedAt: string;
    };
    movieStats: RatingStats;
  };
}

/**
 * Interface cho response của API lấy rating của user
 */
interface GetUserRatingResponse {
  status: string;
  data: {
    userRating: UserRating | null;
  };
}

/**
 * Interface cho response của API lấy danh sách rating
 */
interface GetMovieRatingsResponse {
  status: string;
  data: {
    movieStats: RatingStats;
    ratings: RatingItem[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalRatings: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

/**
 * RATING SERVICE - Quản lý tất cả API calls liên quan đến rating system
 * BASE URL: https://backend-app-lou3.onrender.com
 * 
 * CHỨC NĂNG CHÍNH:
 * 1. addStarRating - Thêm/cập nhật đánh giá sao
 * 2. getUserStarRating - Lấy đánh giá của user cho phim
 * 3. getMovieStarRatings - Lấy thống kê và danh sách rating của phim
 * 4. deleteStarRating - Xóa đánh giá của user
 */

/**
 * Lấy userId từ AsyncStorage
 */
const getUserId = async (): Promise<string | null> => {
  try {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user._id || user.id || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

/**
 * Thêm hoặc cập nhật đánh giá sao cho phim
 * @param movieId - ID của phim
 * @param starRating - Số sao (1-5)
 * @param comment - Bình luận (tùy chọn)
 * @returns Promise<AddRatingResponse>
 */
export const addStarRating = async (
  movieId: string, 
  starRating: number, 
  comment: string = ''
): Promise<AddRatingResponse> => {
  try {
    const userId = await getUserId();
    if (!userId) {
      throw new Error('User not logged in');
    }

    const response = await fetch(`${API_BASE_URL}/api/ratings/movies/${movieId}/stars`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        star_rating: starRating,
        comment: comment.trim(),
        userId: userId,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to add rating');
    }

    return data;
  } catch (error) {
    console.error('Error adding star rating:', error);
    throw error;
  }
};

/**
 * Lấy đánh giá sao của user cho một phim
 * @param movieId - ID của phim
 * @returns Promise<GetUserRatingResponse>
 */
export const getUserStarRating = async (movieId: string): Promise<GetUserRatingResponse> => {
  try {
    const userId = await getUserId();
    if (!userId) {
      return {
        status: 'success',
        data: { userRating: null }
      };
    }

    const response = await fetch(
      `${API_BASE_URL}/api/ratings/movies/${movieId}/stars/user?userId=${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get user rating');
    }

    return data;
  } catch (error) {
    console.error('Error getting user star rating:', error);
    throw error;
  }
};

/**
 * Lấy thống kê và danh sách đánh giá sao của một phim
 * @param movieId - ID của phim
 * @param page - Số trang (mặc định 1)
 * @param limit - Số lượng mỗi trang (mặc định 10)
 * @param sort - Sắp xếp: 'newest', 'oldest', 'highest', 'lowest' (mặc định 'newest')
 * @param starFilter - Lọc theo số sao (1-5, tùy chọn)
 * @returns Promise<GetMovieRatingsResponse>
 */
export const getMovieStarRatings = async (
  movieId: string,
  page: number = 1,
  limit: number = 10,
  sort: 'newest' | 'oldest' | 'highest' | 'lowest' = 'newest',
  starFilter?: number
): Promise<GetMovieRatingsResponse> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort: sort,
    });

    if (starFilter && starFilter >= 1 && starFilter <= 5) {
      params.append('star_filter', starFilter.toString());
    }

    const response = await fetch(
      `${API_BASE_URL}/api/ratings/movies/${movieId}/stars?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get movie ratings');
    }

    return data;
  } catch (error) {
    console.error('Error getting movie star ratings:', error);
    throw error;
  }
};

/**
 * Xóa đánh giá sao của user
 * @param movieId - ID của phim
 * @returns Promise<{ status: string; message: string; data: { movieStats: RatingStats } }>
 */
export const deleteStarRating = async (movieId: string): Promise<{
  status: string;
  message: string;
  data: { movieStats: RatingStats };
}> => {
  try {
    const userId = await getUserId();
    if (!userId) {
      throw new Error('User not logged in');
    }

    const response = await fetch(`${API_BASE_URL}/api/ratings/movies/${movieId}/stars`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete rating');
    }

    return data;
  } catch (error) {
    console.error('Error deleting star rating:', error);
    throw error;
  }
};

/**
 * Lấy thống kê rating tổng quan của tất cả phim (cho admin)
 * @param page - Số trang (mặc định 1)
 * @param limit - Số lượng mỗi trang (mặc định 20)
 * @param sort - Sắp xếp: 'highest_rated', 'most_rated', 'newest' (mặc định 'highest_rated')
 * @returns Promise<any>
 */
export const getAllMoviesRatingStats = async (
  page: number = 1,
  limit: number = 20,
  sort: 'highest_rated' | 'most_rated' | 'newest' = 'highest_rated'
): Promise<any> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort: sort,
    });

    const response = await fetch(
      `${API_BASE_URL}/api/ratings/stats/all-movies?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get movies rating stats');
    }

    return data;
  } catch (error) {
    console.error('Error getting all movies rating stats:', error);
    throw error;
  }
};

/**
 * Export các types để sử dụng ở nơi khác
 */
export type {
  RatingStats,
  UserRating,
  RatingItem,
  AddRatingResponse,
  GetUserRatingResponse,
  GetMovieRatingsResponse,
}; 