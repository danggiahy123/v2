/**
 * WATCHING HISTORY SCREEN - Màn hình lịch sử xem phim
 * MÔ TẢ: Screen hiển thị danh sách phim/episode user đã xem
 * CHỨC NĂNG:
 * - Hiển thị lịch sử xem phim với tiến trình
 * - Phân loại: Tất cả lịch sử và Tiếp tục xem
 * - Navigation đến movie detail với resume
 * - Pull-to-refresh để tải lại danh sách
 * - Pagination cho danh sách dài
 * API: Sử dụng API watching history
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useAppSelector } from '../store/hooks';
import { userInteractionService } from '../services/userInteractionService';
import { useAuthGuard } from '../hooks';
import { LoginRequiredModal } from '../components/ui';
import { WatchingHistoryItem } from '../types/userInteraction';
import eventBus from '../utils/eventBus';

export default function WatchingHistoryScreen() {
  const router = useRouter();
  const { userId } = useAppSelector((state) => state.auth);
  const { isLoggedIn, showLoginModal, hideLoginModal, loginModalVisible, currentFeatureName } = useAuthGuard();
  
  const [historyItems, setHistoryItems] = useState<WatchingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  // Load history when component mounts
  useEffect(() => {
    loadWatchingHistory();
  }, [userId]);

  // Auto refresh when screen comes into focus (user returns from movie detail)
  useFocusEffect(
    React.useCallback(() => {
      if (userId) {
        console.log('🔄 [WatchingHistory] Screen focused, refreshing history data');
        setIsAutoRefreshing(true);
        // Add a small delay to ensure backend has updated the progress
        setTimeout(() => {
          loadWatchingHistory(1, true).finally(() => {
            setIsAutoRefreshing(false);
          });
        }, 500);
      }
    }, [userId])
  );

  // Listen for progress updates from video player
  useEffect(() => {
    const handleProgressUpdate = () => {
      console.log('📺 [WatchingHistory] Progress update detected, will refresh on next focus');
      // Mark that we need to refresh when screen comes into focus
    };

    const handleMovieWatched = () => {
      console.log('🎬 [WatchingHistory] Movie watched, refreshing history');
      if (userId) {
        setIsAutoRefreshing(true);
        loadWatchingHistory(1, true).finally(() => {
          setIsAutoRefreshing(false);
        });
      }
    };

    // Listen for progress updates and movie completion
    eventBus.on('progress-updated', handleProgressUpdate);
    eventBus.on('movie-watched', handleMovieWatched);

    return () => {
      eventBus.off('progress-updated', handleProgressUpdate);
      eventBus.off('movie-watched', handleMovieWatched);
    };
  }, [userId]);

  const loadWatchingHistory = async (page: number = 1, isRefresh: boolean = false) => {
    if (!userId) {
      console.log('⚠️ [WatchingHistory] No userId provided');
      return;
    }
    
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      console.log('🔄 [WatchingHistory] Loading history for userId:', userId, 'page:', page);
      
      const response = await userInteractionService.getWatchingHistory(userId, page, 20);
      
      console.log('📺 [WatchingHistory] API Response:', {
        status: response.status,
        totalItems: response.data?.pagination?.total_items || 0,
        currentPage: response.data?.pagination?.current_page || 1,
        totalPages: response.data?.pagination?.total_pages || 1,
        historyItems: response.data?.watching_history?.length || 0,
        continueItems: response.data?.continue_watching?.length || 0
      });
      
      if (response.status === 'success' && response.data) {
        const newItems = response.data.watching_history || response.data.continue_watching || [];
        
        if (isRefresh || page === 1) {
          setHistoryItems(newItems);
        } else {
          setHistoryItems(prev => [...prev, ...newItems]);
        }
        
        setCurrentPage(page);
        setHasMoreData(page < (response.data.pagination?.total_pages || 1));
        
        console.log('✅ [WatchingHistory] History loaded successfully:', {
          totalItems: newItems.length,
          hasMoreData: page < (response.data.pagination?.total_pages || 1)
        });
        
        // Update last refresh time
        setLastRefreshTime(new Date());
        
        // Show notification if this was an auto-refresh
        if (isRefresh && !isAutoRefreshing) {
          console.log('✅ [WatchingHistory] History refreshed successfully');
        }
      } else {
        console.log('⚠️ [WatchingHistory] No history found or invalid response format');
        if (isRefresh || page === 1) {
          setHistoryItems([]);
        }
      }
    } catch (error: any) {
      console.error('❌ [WatchingHistory] Error details:', {
        name: error?.name || 'Unknown',
        message: error?.message || 'Unknown error occurred',
        stack: error?.stack || 'No stack trace available'
      });
      
      Alert.alert(
        'Lỗi tải lịch sử', 
        'Không thể tải lịch sử xem phim. Vui lòng kiểm tra kết nối và thử lại.',
        [
          { text: 'Thử lại', onPress: () => loadWatchingHistory(1, true) },
          { text: 'Đóng', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWatchingHistory(1, true);
  };

  const loadMoreData = async () => {
    if (!loadingMore && hasMoreData) {
      await loadWatchingHistory(currentPage + 1, false);
    }
  };

  const handleHistoryItemPress = (item: WatchingHistoryItem) => {
    const movieId = item.episode_id.movie_id._id;
    const episodeId = item.episode_id._id;
    const currentTime = item.current_time;
    const watchPercentage = item.watch_percentage;
    
    console.log('🎬 [WatchingHistory] Item pressed:', {
      movieId,
      episodeId,
      currentTime,
      watchPercentage,
      completed: item.completed
    });
    
    // Navigate to movie detail with resume information
    router.push({
      pathname: '/movie/[id]',
      params: {
        id: movieId,
        fromHistory: 'true',
        episodeId: episodeId,
        resumeTime: currentTime.toString(),
        watchPercentage: watchPercentage.toString(),
        completed: item.completed.toString()
      }
    });
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatLastWatched = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Vừa xem';
    } else if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} ngày trước`;
    }
  };

  const renderHistoryItem = ({ item }: { item: WatchingHistoryItem }) => {
    const movie = item.episode_id.movie_id;
    const episode = item.episode_id;
    const progressPercentage = Math.floor(item.watch_percentage);
    const isCompleted = item.completed;
    
    return (
      <TouchableOpacity
        style={styles.historyItem}
        onPress={() => handleHistoryItemPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.movieContent}>
          <Image
            source={{ uri: movie.poster_path }}
            style={styles.moviePoster}
            resizeMode="cover"
            onError={() => {
              console.error('🖼️ [WatchingHistory] Image load error for:', movie.movie_title);
            }}
          />
          
          <View style={styles.movieInfo}>
            <Text style={styles.movieTitle} numberOfLines={2}>
              {movie.movie_title}
            </Text>
            
            {episode.episode_number && (
              <Text style={styles.episodeInfo}>
                Tập {episode.episode_number}
              </Text>
            )}
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${progressPercentage}%` },
                    isCompleted && styles.progressCompleted
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {progressPercentage}% • {formatDuration(item.current_time)} / {formatDuration(item.duration)}
              </Text>
            </View>
            
            <Text style={styles.lastWatchedText}>
              {formatLastWatched(item.last_watched)}
            </Text>
          </View>
        </View>
        
        <View style={styles.statusIndicator}>
          {isCompleted ? (
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          ) : (
            <Ionicons name="play-circle" size={20} color="#E50914" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="time-outline" size={80} color="#666" />
      <Text style={styles.emptyTitle}>
        Chưa có lịch sử xem
      </Text>
      <Text style={styles.emptyDescription}>
        Bạn chưa xem phim nào. Hãy khám phá và xem những bộ phim thú vị!
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => router.push('/(tabs)')}
      >
        <Text style={styles.exploreButtonText}>Khám phá phim</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color="#E50914" />
        <Text style={styles.loadingMoreText}>Đang tải thêm...</Text>
      </View>
    );
  };

  // Kiểm tra đăng nhập
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Lịch sử xem
          </Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.loadingContainer}>
          <Ionicons name="time-outline" size={64} color="#666" style={{ marginBottom: 16 }} />
          <Text style={styles.loadingText}>
            Bạn cần đăng nhập để xem lịch sử xem phim
          </Text>
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={() => showLoginModal('Xem lịch sử xem phim')}
          >
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
        
        <LoginRequiredModal
          visible={loginModalVisible}
          onClose={hideLoginModal}
          featureName={currentFeatureName || undefined}
        />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Lịch sử xem
          </Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E50914" />
          <Text style={styles.loadingText}>
            Đang tải lịch sử xem phim...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Lịch sử xem
        </Text>
        <View style={styles.headerRight}>
          <Text style={styles.countText}>
            {historyItems.length} {historyItems.length === 1 ? 'phim' : 'phim'}
          </Text>
          <Text style={styles.lastUpdateText}>
            Cập nhật: {lastRefreshTime.toLocaleTimeString('vi-VN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
          {isAutoRefreshing && (
            <View style={styles.autoRefreshIndicator}>
              <ActivityIndicator size="small" color="#E50914" />
              <Text style={styles.autoRefreshText}>Đang cập nhật...</Text>
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={historyItems}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[
          styles.listContainer,
          historyItems.length === 0 && styles.listContainerEmpty
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E50914"
          />
        }
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    paddingHorizontal: 8,
  },
  countText: {
    fontSize: 14,
    color: '#666',
  },
  lastUpdateText: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  autoRefreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  autoRefreshText: {
    fontSize: 10,
    color: '#E50914',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  listContainerEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  movieContent: {
    flex: 1,
    flexDirection: 'row',
  },
  moviePoster: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  movieInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
    lineHeight: 20,
  },
  episodeInfo: {
    fontSize: 14,
    color: '#E50914',
    fontWeight: '500',
    marginBottom: 8,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E50914',
    borderRadius: 2,
  },
  progressCompleted: {
    backgroundColor: '#4CAF50',
  },
  progressText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  lastWatchedText: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
  statusIndicator: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginTop: 24,
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  exploreButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#D11030',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingMoreText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 8,
  },
}); 