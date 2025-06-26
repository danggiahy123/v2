/**
 * MOVIE LIST COMPONENT - ENHANCED VERSION
 * MÔ TẢ: Component hiển thị danh sách phim dạng grid với thiết kế chuyên nghiệp
 * CẢI TIẾN:
 * - Modern card design với shadow và gradient overlay
 * - Smooth animations và hover effects
 * - Better spacing và typography
 * - Enhanced loading states
 * - Professional header design
 * - Improved image handling
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { movieService } from '../../services/movieService';
import { animeService } from '../../services/animeService';
import { seriesService } from '../../services/seriesService';
import type { GridMovie } from '../../types/movie';
import { ContinueWatchingBadge } from './ContinueWatchingBadge';
import { useAppSelector } from '../../store/hooks';

const { width } = Dimensions.get('window');
const ITEMS_PER_PAGE = 20;
const COLUMN_COUNT = 2; // Giảm xuống 2 cột để có space tốt hơn
const SPACING = 16;
const ITEM_WIDTH = (width - (SPACING * (COLUMN_COUNT + 1))) / COLUMN_COUNT;
const ITEM_HEIGHT = ITEM_WIDTH * 1.4; // Tỷ lệ poster chuẩn

interface MovieListProps {
  category: string;
  title: string;
  onClose?: () => void;
  showAll?: boolean;
}

// Movie Item Component với animation và continue watching badge
const MovieItem = ({ item, onPress, userId }: { item: GridMovie; onPress: () => void; userId?: string }) => {
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.movieItem, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.movieCard}
      >
        <View style={styles.posterContainer}>
          <Image 
            source={{ uri: item.poster }} 
            style={styles.moviePoster} 
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.posterGradient}
          />
          
          {/* Play Button Overlay */}
          <View style={styles.playOverlay}>
            <View style={styles.playButton}>
              <Ionicons name="play" size={20} color="#fff" />
            </View>
          </View>

          {/* Continue Watching Badge - TODO: Implement after creating wrapper component */}
          {/* {userId && (
            <ContinueWatchingBadge
              movieId={item.movieId}
              userId={userId}
              style={styles.continueBadge}
            />
          )} */}

          {/* Rating Badge */}
          {item.rating && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          )}
        </View>

        <View style={styles.movieInfo}>
          <Text style={styles.movieTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.movieMeta}>
            <Text style={styles.movieType}>{item.movieType}</Text>
            {item.year && (
              <>
                <Text style={styles.metaDivider}>•</Text>
                <Text style={styles.movieYear}>{item.year}</Text>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function MovieList({ category, title, onClose, showAll = false }: MovieListProps) {
  const [movies, setMovies] = useState<GridMovie[]>([]);
  const [loading, setLoading] = useState(true);
  // Page state for pagination - will be implemented when pagination is added
  // const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get authenticated user for continue watching badges
  const authState = useAppSelector((state) => state.auth);
  const userId = authState?.isLoggedIn && authState?.userId ? authState.userId : undefined;

  useEffect(() => {
    loadMovies();
  }, [category, showAll]); // loadMovies will be memoized in future optimization

  const loadMovies = async (isLoadingMore = false) => {
    if (!isLoadingMore) {
      setLoading(true);
      setError(null);
    }
    
    try {
      let response;
      console.log('Loading movies for category:', category);
      
      switch (category) {
        case 'trending':
          response = await movieService.getTrending(showAll ? undefined : ITEMS_PER_PAGE, showAll);
          break;
        case 'toprated':
          response = await movieService.getTopRated(showAll ? undefined : ITEMS_PER_PAGE, showAll);
          break;
        case 'sports':
          response = await movieService.getSports({ 
            limit: showAll ? undefined : ITEMS_PER_PAGE, 
            status: 'released',
            showAll 
          });
          break;
        case 'anime':
          response = await animeService.getAllAnime({ showAll });
          break;
        case 'vietnamese':
          response = await seriesService.getVietnameseSeries({ limit: showAll ? undefined : ITEMS_PER_PAGE, showAll });
          break;
        case 'comingsoon':
          response = await movieService.getComingSoon({ 
            limit: showAll ? undefined : ITEMS_PER_PAGE, 
            days: 30,
            showAll 
          });
          break;
        case 'recommended':
          response = await movieService.getNewReleases({ 
            limit: showAll ? undefined : ITEMS_PER_PAGE, 
            days: 30 
          });
          break;
        default:
          response = await movieService.getNewReleases({ 
            limit: showAll ? undefined : ITEMS_PER_PAGE, 
            days: 30 
          });
      }

      if (response.status === 'success' && response.data) {
        let newMovies: GridMovie[] = [];
        
        if (category === 'recommended' && 'recommended' in response.data) {
          newMovies = response.data.recommended.movies;
        } else if ('movies' in response.data) {
          newMovies = response.data.movies;
        }
        
        if (isLoadingMore) {
          setMovies(prev => [...prev, ...newMovies]);
        } else {
          setMovies(newMovies);
        }
        setHasMore(!showAll && newMovies.length === ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error('Error loading movies:', error);
      setError('Không thể tải danh sách phim. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!hasMore || isLoadingMore || loading || showAll) return;
    setIsLoadingMore(true);
    // setPage(prev => prev + 1); // Will be uncommented when pagination is implemented
    loadMovies(true);
  };

  const handleMoviePress = (movie: GridMovie) => {
    console.log('Navigating to movie:', movie.movieId);
    router.push(`/movie/${movie.movieId}`);
  };

  const renderMovie = ({ item }: { item: GridMovie }) => (
    <MovieItem item={item} onPress={() => handleMoviePress(item)} userId={userId} />
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#E50914" />
        <Text style={styles.loadingText}>Đang tải thêm...</Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="film-outline" size={64} color="#666" />
      <Text style={styles.emptyTitle}>Không có phim nào</Text>
      <Text style={styles.emptySubtitle}>
        {error || 'Danh sách phim đang được cập nhật'}
      </Text>
      {error && (
        <TouchableOpacity style={styles.retryButton} onPress={() => loadMovies()}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && movies.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E50914" />
          <Text style={styles.loadingText}>Đang tải phim...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Enhanced Header */}
      <LinearGradient
        colors={['#000000', 'rgba(0,0,0,0.8)']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
            <Text style={styles.headerSubtitle}>
              {movies.length} phim{showAll ? ' • Tất cả' : ''}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={movies}
        renderItem={renderMovie}
        keyExtractor={(item, index) => `${category}-${item.movieId}-${index}`}
        numColumns={COLUMN_COUNT}
        contentContainerStyle={[
          styles.movieGrid,
          movies.length === 0 && styles.emptyGrid
        ]}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        columnWrapperStyle={COLUMN_COUNT > 1 ? styles.columnWrapper : undefined}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    minHeight: 60,
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  movieGrid: {
    padding: SPACING,
    paddingTop: SPACING / 2,
  },
  emptyGrid: {
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  movieItem: {
    width: ITEM_WIDTH,
    marginBottom: SPACING * 1.5,
  },
  movieCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
  },
  posterContainer: {
    position: 'relative',
  },
  moviePoster: {
    width: '100%',
    height: ITEM_HEIGHT,
    backgroundColor: '#2A2A2A',
  },
  posterGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    opacity: 0,
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(229,9,20,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  movieInfo: {
    padding: 16,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 8,
  },
  movieMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  movieType: {
    color: '#E50914',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  metaDivider: {
    color: '#666',
    fontSize: 12,
    marginHorizontal: 6,
  },
  movieYear: {
    color: '#999',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  loadingText: {
    color: '#999',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});