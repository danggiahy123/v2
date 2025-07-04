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

interface WatchLaterMovie {
  _id: string;
  movie_title: string;
  poster_path?: string;
  poster?: string;
  description: string;
  movie_type: string;
  producer: string;
  genres?: Array<{ genre_name: string }>;
  production_time: string;
  price: number;
  is_free: boolean;
  added_at: string;
}

export default function WatchLaterScreen() {
  const router = useRouter();
  const { userId } = useAppSelector((state) => state.auth);
  
  const [movies, setMovies] = useState<WatchLaterMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    loadWatchLaterMovies();
  }, [userId]);

  const loadWatchLaterMovies = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      console.log('🔄 [WatchLater] Loading movies for userId:', userId);
      
      const API_URL = `https://backend-app-lou3.onrender.com/api/favorites?userId=${userId}`;
      console.log('🌐 [WatchLater] Calling API:', API_URL);
      
      const response = await fetch(API_URL);
      console.log('📡 [WatchLater] Response status:', response.status);
      
      const data = await response.json();
      console.log('🎬 [WatchLater] API Response:', {
        status: data.status,
        favorites_count: data.data?.favorites?.length || 0,
        first_movie: data.data?.favorites?.[0]
      });
      
      if (data.status === 'success' && data.data && data.data.favorites) {
        setMovies(data.data.favorites);
        console.log('✅ [WatchLater] Movies loaded:', data.data.favorites.length);
      }
    } catch (error: any) {
      console.error('❌ [WatchLater] Error details:', {
        name: error?.name || 'Unknown',
        message: error?.message || 'Unknown error occurred',
        stack: error?.stack || 'No stack trace available'
      });
      Alert.alert('Error', 'Could not load watch later movies. Please check your connection and try again.');
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
              await userInteractionService.toggleFavorite(movieId, false, userId);
              
              // Cập nhật danh sách local
              setMovies(prev => prev.filter(item => item._id !== movieId));
              
              // Hiển thị thông báo thành công
              Alert.alert('Thành công', 'Đã xóa phim khỏi danh sách xem sau');
            } catch (error) {
              console.error('Error removing from watch later:', error);
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
          {item.poster_path ? (
            <Image
              source={{ uri: item.poster_path }}
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
            
            <Text style={styles.movieType}>
              {item.movie_type} • {item.producer}
            </Text>
{item.genres && item.genres.length > 0 && (
              <View style={styles.genreContainer}>
                {item.genres.slice(0, 3).map((genre, index) => (
                  <View key={index} style={styles.genreTag}>
                    <Text style={styles.genreText}>{genre.genre_name}</Text>
                  </View>
                ))}
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Phim xem sau</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E50914" />
          <Text style={styles.loadingText}>Đang tải...</Text>
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
          <Text style={styles.countText}>{movies.length} phim</Text>
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
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
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
  },
  genreTag: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  genreText: {
    fontSize: 12,
    color: '#E50914',
  },
  addedDate: {
    fontSize: 12,
    color: '#666',
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
});
