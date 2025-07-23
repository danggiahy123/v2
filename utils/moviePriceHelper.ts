/**
 * 💰 MOVIE PRICE HELPER
 * 
 * Utility để thêm thông tin price và rental cho movies từ detail API
 * Sử dụng cho các grid movies cần hiển thị badge "Trả phí"
 */

import { movieDetailService } from '../services/movieDetailService';
import { GridMovie } from '../types/movie';

interface MoviePriceInfo {
  movieId: string;
  price: number;
  is_free: boolean;
  price_display: string;
  viewCount: number;
  likeCount: number;
  hasLiked: boolean;
}

// Cache để tránh gọi API nhiều lần cho cùng 1 phim
const priceInfoCache = new Map<string, MoviePriceInfo>();

/**
 * 🔍 Lấy thông tin price cho 1 phim
 */
export const getMoviePriceInfo = async (movieId: string): Promise<MoviePriceInfo | null> => {
  try {
    // Validate movieId trước khi gọi API
    if (!movieId || movieId === 'undefined' || movieId === 'null') {
      console.warn('⚠️ [MoviePriceHelper] Invalid movieId:', movieId);
      return null;
    }

    // Check cache trước
    if (priceInfoCache.has(movieId)) {
      return priceInfoCache.get(movieId)!;
    }

    // Gọi detail API với timeout để tránh hang
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 10000) // 10s timeout
    );
    
    const movieDetail = await Promise.race([
      movieDetailService.getMovieDetail(movieId),
      timeoutPromise
    ]) as any;
    
    const priceInfo: MoviePriceInfo = {
      movieId: movieDetail.movieId || movieId,
      price: movieDetail.price || 0,
      is_free: movieDetail.is_free ?? true, // Default true nếu không có info
      price_display: movieDetail.price_display || 'Miễn phí',
      viewCount: movieDetail.viewCount ?? 0,
      likeCount: movieDetail.likeCount ?? 0,
      hasLiked: movieDetail.userInteractions?.hasLiked ?? false,
    };

    // Cache kết quả
    priceInfoCache.set(movieId, priceInfo);
    
    return priceInfo;
  } catch (error) {
    console.error('❌ [MoviePriceHelper] Error fetching price info:', {
      movieId,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
};

/**
 * 🎬 Thêm thông tin price cho danh sách movies
 * Sử dụng parallel requests để tăng tốc độ với error handling cải thiện
 */
export const enrichMoviesWithPriceInfo = async (
  movies: GridMovie[], 
  maxConcurrent: number = 2 // Giảm từ 5 xuống 2 để tránh quá tải server
): Promise<GridMovie[]> => {
  if (!movies || movies.length === 0) {
    return movies;
  }



  try {
    // Batch process movies để tránh quá tải server
    const enrichedMovies: GridMovie[] = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < movies.length; i += maxConcurrent) {
      const batch = movies.slice(i, i + maxConcurrent);
      
      // Parallel fetch price info cho batch này
      const priceInfoPromises = batch.map(movie => {
        // Validate movieId trước khi gọi API
        if (!movie.movieId || movie.movieId === 'undefined' || movie.movieId === 'null') {
          console.warn(`⚠️ [MoviePriceHelper] Skipping movie with invalid ID:`, {
            movieId: movie.movieId,
            title: movie.title || 'Unknown'
          });
          return Promise.resolve(null);
        }
        
        return getMoviePriceInfo(movie.movieId).catch(error => {
          console.warn(`⚠️ [MoviePriceHelper] Failed to get price for ${movie.movieId}:`, error.message);
          return null; // Return null instead of throwing
        });
      });
      
      const priceInfoResults = await Promise.allSettled(priceInfoPromises);
      
      // Merge price info vào movies
      const enrichedBatch = batch.map((movie, index) => {
        const priceInfoResult = priceInfoResults[index];
        
        if (priceInfoResult.status === 'fulfilled' && priceInfoResult.value) {
          const priceInfo = priceInfoResult.value;
          successCount++;
          return {
            ...movie,
            price: priceInfo.price,
            is_free: priceInfo.is_free,
            price_display: priceInfo.price_display,
            viewCount: priceInfo.viewCount,
            likeCount: priceInfo.likeCount,
            hasLiked: priceInfo.hasLiked,
          };
        } else {
          errorCount++;
          // Fallback: nếu không lấy được thông tin thì coi như miễn phí
          return {
            ...movie,
            price: 0,
            is_free: true,
            price_display: 'Miễn phí',
            viewCount: movie.viewCount ?? 0,
            likeCount: movie.likeCount ?? 0,
            hasLiked: movie.hasLiked ?? false,
          };
        }
      });
      
      enrichedMovies.push(...enrichedBatch);
      
      // Tăng delay giữa các batch để giảm tải server
      if (i + maxConcurrent < movies.length) {
        await new Promise(resolve => setTimeout(resolve, 300)); // Tăng từ 100ms lên 300ms
      }
    }
    
    console.log('✅ [MoviePriceHelper] Enrichment completed:', {
      original: movies.length,
      enriched: enrichedMovies.length,
      successCount,
      errorCount,
      paidMovies: enrichedMovies.filter(m => !m.is_free).length
    });

    return enrichedMovies;
  } catch (error) {
    console.error('❌ [MoviePriceHelper] Critical error during enrichment:', error);
    // Return original movies với default values nếu có lỗi critical
    return movies.map(movie => ({
      ...movie,
      price: 0,
      is_free: true,
      price_display: 'Miễn phí'
    }));
  }
};

/**
 * 🧹 Clear cache khi cần
 */
export const clearPriceInfoCache = (): void => {
  priceInfoCache.clear();
  console.log('🧹 [MoviePriceHelper] Price info cache cleared');
};

/**
 * 📊 Thống kê cache
 */
export const getCacheStats = (): { size: number; keys: string[] } => {
  return {
    size: priceInfoCache.size,
    keys: Array.from(priceInfoCache.keys())
  };
};

/**
 * 🎯 Kiểm tra xem movie có cần trả phí không (dùng cho badge logic)
 */
export const shouldShowPaidBadge = (movie: GridMovie): boolean => {
  return movie.is_free === false || (movie.is_free !== true && !!movie.price && movie.price > 0);
}; 