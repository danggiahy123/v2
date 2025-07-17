/**
 * 🎬 WATCHING HELPER UTILITIES
 * 
 * Tập hợp các function utilities để xử lý logic continue watching
 * Sử dụng cho cả trường hợp từ Continue Watching Section và các trường hợp khác
 */

import { Episode } from '../types/episode';
import { MovieDetail } from '../types/movieDetail';
import { WatchingContext, ContinueWatchingItem } from '../types/movie';

/**
 * 🎯 SMART RESUME LOGIC
 * 
 * Xác định episode nào user nên tiếp tục xem dựa trên:
 * 1. Watching progress có sẵn
 * 2. Loại phim (Phim lẻ vs Phim bộ)
 * 3. AutoPlay context
 */
export interface ResumeWatchingOptions {
  movieDetail: MovieDetail;
  autoPlay?: boolean;
  fromContinueWatching?: boolean;
}

export interface ResumeWatchingResult {
  episode: Episode | null;
  shouldAutoPlay: boolean;
  resumeFromTime: number;
  resumeMessage: string;
  watchingContext: WatchingContext;
  hasVideoUrl: boolean;
}

/**
 * 🎯 Debug function để kiểm tra episode switching logic
 */
export const debugEpisodeSwitching = (
  episode: Episode,
  watchingProgress: any
): {
  isSameEpisode: boolean;
  shouldResume: boolean;
  resumeTime: number;
  debugInfo: any;
} => {
  const isSameEpisode = 
    watchingProgress?.episodeId === episode._id ||
    watchingProgress?.episodeId === episode._id?.toString() ||
    episode._id === watchingProgress?.episodeId?.toString();
  
  const shouldResume = isSameEpisode && watchingProgress?.currentTime && watchingProgress.currentTime > 0;
  const resumeTime = shouldResume ? watchingProgress.currentTime : 0;
  
  const debugInfo = {
    episodeId: episode._id,
    episodeNumber: episode.episode_number,
    watchingProgressEpisodeId: watchingProgress?.episodeId,
    watchingProgressCurrentTime: watchingProgress?.currentTime,
    isSameEpisode,
    shouldResume,
    resumeTime
  };
  
  console.log('🔍 [debugEpisodeSwitching]', debugInfo);
  
  return {
    isSameEpisode,
    shouldResume,
    resumeTime,
    debugInfo
  };
};

/**
 * 🎯 Lọc continue watching data cho phim bộ
 * Chỉ giữ lại episode cuối cùng đã xem cho mỗi phim bộ
 */
export const filterContinueWatchingForSeries = (continueWatchingData: ContinueWatchingItem[]): ContinueWatchingItem[] => {
  const seriesMap = new Map<string, ContinueWatchingItem>();
  
  console.log('🎬 [filterContinueWatchingForSeries] Input data:', {
    totalItems: continueWatchingData.length,
    items: continueWatchingData.map(item => ({
      movieId: item.movieId,
      title: item.title,
      movieType: item.movieType,
      episodeNumber: item.episodeNumber,
      episodeId: item.episodeId
    }))
  });
  
  continueWatchingData.forEach(item => {
    if (item.movieType === 'Phim bộ') {
      const existingItem = seriesMap.get(item.movieId);
      
      // Logic: Giữ lại episode có số tập lớn nhất (episode cuối cùng đã xem)
      if (!existingItem) {
        // Chưa có item cho phim này
        seriesMap.set(item.movieId, item);
        console.log('✅ [filterContinueWatchingForSeries] Added first item for series:', {
          movieId: item.movieId,
          title: item.title,
          episodeNumber: item.episodeNumber
        });
      } else if (item.episodeNumber && existingItem.episodeNumber && item.episodeNumber > existingItem.episodeNumber) {
        // Item hiện tại có episode number lớn hơn (episode mới hơn)
        seriesMap.set(item.movieId, item);
        console.log('🔄 [filterContinueWatchingForSeries] Replaced with newer episode:', {
          movieId: item.movieId,
          title: item.title,
          oldEpisode: existingItem.episodeNumber,
          newEpisode: item.episodeNumber
        });
      } else {
        console.log('⏭️ [filterContinueWatchingForSeries] Skipped older episode:', {
          movieId: item.movieId,
          title: item.title,
          existingEpisode: existingItem.episodeNumber,
          currentEpisode: item.episodeNumber
        });
      }
    } else {
      // Phim lẻ giữ nguyên
      seriesMap.set(item.movieId, item);
      console.log('🎬 [filterContinueWatchingForSeries] Added single movie:', {
        movieId: item.movieId,
        title: item.title,
        movieType: item.movieType
      });
    }
  });
  
  const result = Array.from(seriesMap.values());
  console.log('✅ [filterContinueWatchingForSeries] Filtered result:', {
    totalItems: result.length,
    items: result.map(item => ({
      movieId: item.movieId,
      title: item.title,
      movieType: item.movieType,
      episodeNumber: item.episodeNumber
    }))
  });
  
  return result;
};

/**
 * 🎯 Xác định episode và thời gian để resume watching
 */
export const getResumeWatchingInfo = ({
  movieDetail,
  autoPlay = false,
  fromContinueWatching = false
}: {
  movieDetail: MovieDetail;
  autoPlay?: boolean;
  fromContinueWatching?: boolean;
}): {
  episode: Episode | null;
  shouldAutoPlay: boolean;
  resumeFromTime: number;
  resumeMessage: string;
  watchingContext: WatchingContext;
  hasVideoUrl: boolean;
} => {
  let defaultEpisode: Episode | null = null;
  let resumeFromTime = 0;
  let resumeMessage = 'Bắt đầu xem';
  let watchingContext: WatchingContext = 'start_new';

  // Log initial state
  console.log('🎬 [getResumeWatchingInfo] Starting:', {
    movieType: movieDetail.movie_type,
    hasEpisodes: !!movieDetail.episodes?.length,
    episodeCount: movieDetail.episodes?.length,
    watchingProgress: movieDetail.userInteractions?.watchingProgress
  });

  if (movieDetail.movie_type === 'Phim bộ' && movieDetail.episodes?.length > 0) {
    // For series, get the first episode or the last watched episode
    const watchingProgress = movieDetail.userInteractions?.watchingProgress;
    
    console.log('🔍 [getResumeWatchingInfo] Debug series episode selection:', {
      hasWatchingProgress: !!watchingProgress,
      watchingProgressEpisodeId: watchingProgress?.episodeId,
      watchingProgressCurrentTime: watchingProgress?.currentTime,
      totalEpisodes: movieDetail.episodes.length,
      availableEpisodeIds: movieDetail.episodes.map(ep => ({ id: ep._id, title: ep.episode_title, number: ep.episode_number }))
    });
    
    if (watchingProgress?.episodeId) {
      // Try to find the last watched episode
      const lastWatchedEpisode = movieDetail.episodes.find(ep => ep._id === watchingProgress.episodeId);
      
      console.log('🔍 [getResumeWatchingInfo] Episode matching result:', {
        searchingForEpisodeId: watchingProgress.episodeId,
        foundEpisode: lastWatchedEpisode ? {
          id: lastWatchedEpisode._id,
          title: lastWatchedEpisode.episode_title,
          number: lastWatchedEpisode.episode_number,
          hasUri: !!lastWatchedEpisode.uri
        } : null
      });
      
      if (lastWatchedEpisode && lastWatchedEpisode.uri) {
        defaultEpisode = lastWatchedEpisode;
        resumeFromTime = watchingProgress.currentTime || 0;
        
        // 🔧 FIX: Create proper resume message with episode info
        if (resumeFromTime > 0) {
          const minutes = Math.floor(resumeFromTime / 60);
          const seconds = Math.floor(resumeFromTime % 60);
          const timeStr = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `0:${seconds.toString().padStart(2, '0')}`;
          resumeMessage = `Tiếp tục từ ${timeStr} - Tập ${lastWatchedEpisode.episode_number}`;
        } else {
          resumeMessage = `Bắt đầu xem Tập ${lastWatchedEpisode.episode_number}`;
        }
        
        watchingContext = 'resume';
        
        console.log('✅ [getResumeWatchingInfo] Found last watched episode:', {
          episodeId: lastWatchedEpisode._id,
          episodeTitle: lastWatchedEpisode.episode_title,
          episodeNumber: lastWatchedEpisode.episode_number,
          resumeFromTime,
          resumeMessage
        });
      }
    }
    
    // If no last watched episode found, find first episode with valid URI
    if (!defaultEpisode && movieDetail.episodes.length > 0) {
      defaultEpisode = movieDetail.episodes.find(ep => ep.uri && ep.uri.trim() !== '') || null;
      if (defaultEpisode) {
        resumeMessage = `Bắt đầu xem Tập ${defaultEpisode.episode_number}`;
        console.log('📺 [getResumeWatchingInfo] Using first available episode:', {
          episodeId: defaultEpisode._id,
          episodeTitle: defaultEpisode.episode_title,
          episodeNumber: defaultEpisode.episode_number
        });
      }
    }

    // Log episode selection
    console.log('🎬 [getResumeWatchingInfo] Series episode selected:', {
      episodeId: defaultEpisode?._id,
      episodeTitle: defaultEpisode?.episode_title,
      episodeNumber: defaultEpisode?.episode_number,
      episodeUri: defaultEpisode?.uri,
      resumeFromTime,
      resumeMessage,
      watchingContext
    });
  } else {
    // For single movies, create a virtual episode
    const videoUrl = movieDetail.uri;
    defaultEpisode = {
      _id: movieDetail._id || movieDetail.movieId || '',
      episode_title: movieDetail.movie_title,
      episode_number: 1,
      episode_description: movieDetail.description || '',
      uri: videoUrl || '',
      duration: movieDetail.duration || 0,
      movie_id: movieDetail._id || movieDetail.movieId || '',
      createdAt: movieDetail.createdAt || new Date().toISOString(),
      updatedAt: movieDetail.updatedAt || new Date().toISOString()
    };

    // 🔧 FIX: Check for watching progress in single movies too
    const watchingProgress = movieDetail.userInteractions?.watchingProgress;
    if (watchingProgress?.currentTime && watchingProgress.currentTime > 0) {
      resumeFromTime = watchingProgress.currentTime;
      resumeMessage = 'Tiếp tục xem';
      watchingContext = 'resume';
      
      console.log('🎬 [getResumeWatchingInfo] Single movie resume:', {
        currentTime: watchingProgress.currentTime,
        watchPercentage: watchingProgress.watchPercentage,
        resumeFromTime,
        resumeMessage
      });
    }

    // Log virtual episode creation
    console.log('🎬 [getResumeWatchingInfo] Created virtual episode:', {
      episodeId: defaultEpisode._id,
      movieId: movieDetail._id,
      hasValidId: !!defaultEpisode._id,
      uri: defaultEpisode.uri,
      resumeFromTime,
      watchingContext
    });
  }

  // Validate the selected episode
  const hasValidUrl = !!(defaultEpisode?.uri && defaultEpisode.uri.trim() !== '');
  console.log('🎬 [getResumeWatchingInfo] Episode validation:', {
    hasEpisode: !!defaultEpisode,
    episodeId: defaultEpisode?._id,
    hasUri: hasValidUrl,
    uri: defaultEpisode?.uri
  });

  return {
    episode: defaultEpisode,
    shouldAutoPlay: autoPlay,
    resumeFromTime,
    resumeMessage,
    watchingContext,
    hasVideoUrl: hasValidUrl
  };
};

/**
 * 🕐 Format time for display
 */
export const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * 🎬 Format remaining time for Continue Watching display
 */
export const formatRemainingTime = (seconds: number): string => {
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {
    return `${minutes} phút còn lại`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} giờ còn lại`;
  }
  return `${hours}g ${remainingMinutes}p còn lại`;
};

/**
 * 🎯 Generate Continue Watching Item từ Movie Detail
 * Sử dụng để tạo data cho Continue Watching Section
 */
export const generateContinueWatchingItem = (movieDetail: MovieDetail): ContinueWatchingItem | null => {
  const watchingProgress = movieDetail.userInteractions?.watchingProgress;
  
  if (!watchingProgress || !watchingProgress.episodeId) {
    return null;
  }
  
  const progress = Math.min(Math.max(watchingProgress.watchPercentage || 0, 0), 100) / 100;
  const currentTime = watchingProgress.currentTime || 0;
  const duration = watchingProgress.duration || movieDetail.duration || 0;
  const remainingTime = Math.max(0, duration - currentTime);
  
  // Find episode info for series
  let episodeNumber: number | undefined;
  let episodeTitle: string | undefined;
  
  if (movieDetail.movie_type === 'Phim bộ' && movieDetail.episodes) {
    const episode = movieDetail.episodes.find(ep => ep._id === watchingProgress.episodeId);
    if (episode) {
      episodeNumber = episode.episode_number;
      episodeTitle = episode.episode_title;
    }
  }
  
  return {
    movieId: movieDetail._id || movieDetail.movieId,
    title: movieDetail.movie_title,
    poster: movieDetail.poster || movieDetail.image || movieDetail.poster_path || '',
    movieType: movieDetail.movie_type as 'Phim lẻ' | 'Phim bộ',
    progress,
    progressPercentage: Math.round(progress * 100),
    currentTime,
    duration,
    remainingTime,
    remainingTimeFormatted: formatRemainingTime(remainingTime),
    lastWatchedAt: watchingProgress.lastWatched || new Date().toISOString(),
    episodeId: watchingProgress.episodeId,
    episodeNumber,
    episodeTitle
  };
};

/**
 * 🎯 Should Show Continue Watching Badge
 * Xác định có nên hiển thị badge "Tiếp tục xem" trên movie card không
 */
export const shouldShowContinueBadge = (movieDetail: MovieDetail): boolean => {
  const watchingProgress = movieDetail.userInteractions?.watchingProgress;
  
  if (!watchingProgress) return false;
  
  const progressPercent = watchingProgress.watchPercentage || 0;
  
  // Hiển thị badge nếu:
  // 1. Đã xem > 5% và < 90%
  // 2. Có thời gian xem > 30 giây
  return progressPercent > 5 && progressPercent < 90 && (watchingProgress.currentTime || 0) > 30;
};

/**
 * 🎯 Get Resume Button Text
 * Xác định text cho nút resume dựa trên trạng thái watching và thời gian xem
 */
export const getResumeButtonText = (movieDetail: MovieDetail): string => {
  const watchingProgress = movieDetail.userInteractions?.watchingProgress;
  
  if (!watchingProgress) return 'Xem ngay';
  
  const progressPercent = watchingProgress.watchPercentage || 0;
  const currentTime = watchingProgress.currentTime || 0;
  
  // Nếu đã xem hơn 90%, hiển thị "Xem lại"
  if (progressPercent > 90) return 'Xem lại';
  
  // Nếu đã xem hơn 5% và có thời gian xem, hiển thị "Tiếp tục từ [thời gian]"
  if (progressPercent > 5 && currentTime > 0) {
    const minutes = Math.floor(currentTime / 60);
    const seconds = Math.floor(currentTime % 60);
    const timeStr = minutes > 0 
      ? `${minutes}:${seconds.toString().padStart(2, '0')}`
      : `0:${seconds.toString().padStart(2, '0')}`;
    
    // Nếu là phim bộ, thêm thông tin tập phim
    if (movieDetail.movie_type === 'Phim bộ' && watchingProgress.episodeNumber) {
      return `Tiếp tục từ ${timeStr} - Tập ${watchingProgress.episodeNumber}`;
    }
    
    return `Tiếp tục từ ${timeStr}`;
  }
  
  return 'Xem ngay';
}; 