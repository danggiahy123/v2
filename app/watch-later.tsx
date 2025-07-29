/**
 * WATCH LATER SCREEN - Màn hình phim xem sau
 * MÔ TẢ: Screen hiển thị danh sách phim đã lưu để xem sau
 * CHỨC NĂNG:
 * - Hiển thị danh sách phim yêu thích (được dùng như "xem sau")
 * - Cho phép xóa phim khỏi danh sách
 * - Navigation đến movie detail
 * - Pull-to-refresh để tải lại danh sách
 * API: Sử dụng API favourite hiện có
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import eventBus from '../utils/eventBus';
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

import { useAppSelector } from '../store/hooks';
import { userInteractionService } from '../services/userInteractionService';
import { useAuthGuard } from '../hooks';
import { LoginRequiredModal } from '../components/ui';

interface WatchLaterMovie {
  _id: string;
  movie_title: string;
  poster_path?: string;
  poster?: string;
  description: string;
  movie_type: string;
  producer: string;
  genres?: string[];
  production_time: string;
  price: number;
  is_free: boolean;
  added_at: string;
}

export default function WatchLaterScreen() {
  const router = useRouter();
  const { userId } = useAppSelector((state) => state.auth);
  const { isLoggedIn, showLoginModal, hideLoginModal, loginModalVisible, currentFeatureName } = useAuthGuard();
  
  const [movies, setMovies] = useState<WatchLaterMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    loadWatchLaterMovies();
  }, [userId]);

  // Listen for favorite changes from movie detail screen
  useEffect(() => {
    const handleFavoriteChange = (data: { movieId: string; isFavorite: boolean }) => {
      console.log('🔄 [WatchLater] Favorite change detected:', data);
      if (data.isFavorite) {
        // Movie was added to favorites, refresh the list
        loadWatchLaterMovies();
      } else {
        // Movie was removed from favorites, remove from local list
        setMovies(prev => prev.filter(item => item._id !== data.movieId));
      }
    };

    eventBus.on('movie-favorite-changed', handleFavoriteChange);

    return () => {
      eventBus.off('movie-favorite-changed', handleFavoriteChange);
    };
  }, []);

  const loadWatchLaterMovies = async () => {
    if (!userId) {
      console.log('⚠️ [WatchLater] No userId provided');
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔄 [WatchLater] Loading movies for userId:', userId);
      
      const API_URL = `http://192.168.5.90:3003/api/favorites?userId=${userId}`;
      console.log('🌐 [WatchLater] Calling API:', API_URL);
      
      const response = await fetch(API_URL);
      console.log('📡 [WatchLater] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [WatchLater] API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('🎬 [WatchLater] API Response:', {
        status: data.status,
        favorites_count: data.data?.favorites?.length || 0,
        first_movie: data.data?.favorites?.[0],
        raw_data: data
      });
      
      if (data.status === 'success' && data.data && Array.isArray(data.data.favorites)) {
        console.log('✅ [WatchLater] Movies loaded successfully:', {
          count: data.data.favorites.length,
          firstMovie: data.data.favorites[0] ? {
            id: data.data.favorites[0]._id,
            title: data.data.favorites[0].movie_title,
            poster: data.data.favorites[0].poster_path
          } : null
        });
        setMovies(data.data.favorites);
      } else {
        console.log('⚠️ [WatchLater] No favorites found or invalid response format:', {
          status: data.status,
          hasData: !!data.data,
          hasFavorites: !!data.data?.favorites,
          favoritesLength: data.data?.favorites?.length,
          favoritesType: typeof data.data?.favorites
        });
        setMovies([]);
      }
    } catch (error: any) {
      console.error('❌ [WatchLater] Error details:', {
        name: error?.name || 'Unknown',
        message: error?.message || 'Unknown error occurred',
        stack: error?.stack || 'No stack trace available'
      });
      
      // Show user-friendly error message
      Alert.alert(
        'Lỗi tải danh sách', 
        'Không thể tải danh sách phim xem sau. Vui lòng kiểm tra kết nối và thử lại.',
        [
          { text: 'Thử lại', onPress: () => loadWatchLaterMovies() },
          { text: 'Đóng', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
await loadWatchLaterMovies();
    setRefreshing(false);
  };

  const handleRemoveFromWatchLater = async (movieId: string, movieTitle: string) => {
    if (!userId) return;

    Alert.alert(
      'Xóa khỏi danh sách',
      `Bạn có chắc chắn muốn xóa "${movieTitle}" khỏi danh sách phim xem sau?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              setRemoving(movieId);
              console.log('🗑️ [WatchLater] Removing movie from favorites:', { movieId, userId });
              
              await userInteractionService.toggleFavorite(movieId, false, userId);
              
              // Cập nhật danh sách local
              setMovies(prev => prev.filter(item => item._id !== movieId));
              
              // Hiển thị thông báo thành công
              Alert.alert('Thành công', 'Đã xóa phim khỏi danh sách xem sau');
              console.log('✅ [WatchLater] Movie removed successfully');
            } catch (error) {
              console.error('❌ [WatchLater] Error removing from watch later:', error);
              Alert.alert('Lỗi', 'Không thể xóa phim khỏi danh sách');
            } finally {
              setRemoving(null);
            }
          }
        }
      ]
    );
  };

  const handleMoviePress = (movieId: string) => {
    router.push(`/movie/${movieId}`);
  };

  const renderMovie = ({ item }: { item: WatchLaterMovie }) => {
    const isRemoving = removing === item._id;
    
    // Log poster data for each movie being rendered
    console.log('🎨 [WatchLater] Rendering movie:', {
      title: item.movie_title,
      poster_path: item.poster_path,
      poster_path_exists: !!item.poster_path,
      poster_path_value: item.poster_path || 'NULL/UNDEFINED'
    });
    
    return (
      <TouchableOpacity
        style={[styles.movieItem, isRemoving && styles.movieItemRemoving]}
        onPress={() => handleMoviePress(item._id)}
        disabled={isRemoving}
      >
        <View style={styles.movieContent}>
          {(item.poster_path || item.poster) ? (
            <Image
              source={{ uri: item.poster_path || item.poster }}
              style={styles.moviePoster}
              resizeMode="cover"
              onError={(error) => {
                console.error('🖼️ [WatchLater] Image load error for:', item.movie_title, error);
              }}
              onLoad={() => {
                console.log('✅ [WatchLater] Image loaded successfully for:', item.movie_title);
              }}
            />
          ) : (
            <View style={[styles.moviePoster, styles.posterPlaceholder]}>
              <Ionicons name="film-outline" size={40} color="#666" />
              <Text style={styles.placeholderText}>Không có poster</Text>
            </View>
          )}
          
          <View style={styles.movieInfo}>
            <Text style={styles.movieTitle} numberOfLines={2}>
              {item.movie_title}
            </Text>
            
            {item.genres && Array.isArray(item.genres) && item.genres.length > 0 && (
              <View style={styles.genreContainer}>
                {item.genres.slice(0, 2).map((genre, index) => (
                  <View key={index} style={styles.genreTag}>
                    <Text style={styles.genreText}>
                      {genre}
                    </Text>
                  </View>
                ))}
                {item.genres.length > 2 && (
                  <View style={styles.genreTag}>
                    <Text style={styles.genreText}>
                      +{item.genres.length - 2}
                    </Text>
                  </View>
                )}
              </View>
            )}
            
            <Text style={styles.addedDate}>
              Đã lưu: {new Date(item.added_at).toLocaleDateString('vi-VN')}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveFromWatchLater(item._id, item.movie_title)}
          disabled={isRemoving}
        >
          {isRemoving ? (
            <ActivityIndicator size="small" color="#ff6b6b" />
          ) : (
            <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="bookmark-outline" size={80} color="#666" />
      <Text style={styles.emptyTitle}>Chưa có phim nào</Text>
      <Text style={styles.emptyDescription}>
        Bạn chưa lưu phim nào để xem sau. Hãy khám phá và lưu những phim yêu thích!
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => router.push('/(tabs)')}
      >
        <Text style={styles.exploreButtonText}>Khám phá phim</Text>
      </TouchableOpacity>
    </View>
  );

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
          <Text style={styles.headerTitle}>Phim xem sau</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.loadingContainer}>
          <Ionicons name="bookmark-outline" size={64} color="#666" style={{ marginBottom: 16 }} />
          <Text style={styles.loadingText}>Bạn cần đăng nhập để xem danh sách phim xem sau</Text>
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={() => showLoginModal('Xem danh sách phim xem sau')}
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
          <Text style={styles.headerTitle}>Phim xem sau</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E50914" />
          <Text style={styles.loadingText}>Đang tải danh sách phim xem sau...</Text>
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
        <Text style={styles.headerTitle}>Phim xem sau</Text>
        <View style={styles.headerRight}>
          <Text style={styles.countText}>
            {movies.length} {movies.length === 1 ? 'phim' : 'phim'}
          </Text>
        </View>
      </View>

      <FlatList
        data={movies}
        renderItem={renderMovie}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[
          styles.listContainer,
movies.length === 0 && styles.listContainerEmpty
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E50914"
          />
        }
        ListEmptyComponent={renderEmpty}
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
  movieItem: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  movieItemRemoving: {
    opacity: 0.5,
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
  posterPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
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
    marginBottom: 6,
    lineHeight: 20,
  },
  movieType: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 8,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    marginTop: 4,
  },
  genreTag: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  genreText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  addedDate: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
  },
  removeButton: {
    padding: 12,
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
  placeholderText: {
    color: '#666',
    fontSize: 12,
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
});
