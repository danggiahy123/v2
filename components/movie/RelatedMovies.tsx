/**
 * 🎭 RELATED MOVIES COMPONENT
 * 
 * Component hiển thị danh sách phim liên quan
 * - Tích hợp với API /api/movies/{id}/related
 * - Hỗ trợ lọc theo thể loại
 * - Loading states và error handling
 * - Responsive design
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { movieDetailService } from '../../services/movieDetailService';

interface RelatedMovie {
  _id: string;
  movie_title: string;
  poster_path: string;
  movie_type: string;
  producer: string;
  genres: Array<{
    _id: string;
    genre_name: string;
    parent_genre?: {
      _id: string;
      genre_name: string;
    };
  }>;
}

interface RelatedMoviesProps {
  movieId: string;
  currentMovieGenres?: Array<{
    _id: string;
    genre_name: string;
  }>;
  limit?: number;
  showTitle?: boolean;
  onMoviePress?: (movieId: string) => void;
}

const RelatedMovies: React.FC<RelatedMoviesProps> = ({
  movieId,
  currentMovieGenres = [],
  limit = 8,
  showTitle = true,
  onMoviePress,
}) => {
  const [relatedMovies, setRelatedMovies] = useState<RelatedMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch related movies
  const fetchRelatedMovies = async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      
      // Get genre IDs from current movie for better filtering
      const genreIds = currentMovieGenres.map(g => g._id).join(',');
      
      console.log('🎭 [RelatedMovies] Fetching related movies:', {
        movieId,
        genreIds,
        limit,
        isRefresh
      });
      
      const movies = await movieDetailService.getRelatedMovies(movieId, {
        limit,
        genreIds: genreIds || undefined,
        useParentGenres: true
      });   
      
      setRelatedMovies(movies);
      
      console.log('✅ [RelatedMovies] Related movies loaded:', {
        count: movies.length,
        titles: movies.map(m => m.movie_title)
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load related movies';
      setError(errorMessage);
      console.error('❌ [RelatedMovies] Error fetching related movies:', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (movieId) {
      fetchRelatedMovies();
    }
  }, [movieId]);

  // Handle movie press
  const handleMoviePress = (relatedMovieId: string) => {
    if (onMoviePress) {
      onMoviePress(relatedMovieId);
    } else {
      router.push(`/movie/${relatedMovieId}`);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchRelatedMovies(true);
  };

  // Render movie item
  const renderMovieItem = (movie: RelatedMovie, index: number) => (
    <TouchableOpacity
      key={movie._id}
      style={styles.movieItem}
      onPress={() => handleMoviePress(movie._id)}
      activeOpacity={0.7}
      delayPressIn={0}
    >
      <View style={styles.movieImageContainer}>
        <Image
          source={{ uri: movie.poster_path }}
          style={styles.movieImage}
          resizeMode="cover"
        />
        
        {/* Movie type badge */}
        <View style={styles.movieTypeBadge}>
          <Text style={styles.movieTypeText}>
            {movie.movie_type}
          </Text>
        </View>
      </View>
      
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle} numberOfLines={3}>
          {movie.movie_title}
        </Text>
        
        {movie.producer && (
          <Text style={styles.movieProducer} numberOfLines={2}>
            {movie.producer}
          </Text>
        )}
        
        {movie.genres && movie.genres.length > 0 && (
          <View style={styles.genreContainer}>
            {movie.genres.slice(0, 2).map((genre, idx) => (
              <View key={genre._id} style={styles.genreTag}>
                <Text style={styles.genreText}>
                  {genre.genre_name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        {showTitle && (
          <Text style={styles.sectionTitle}>Phim liên quan</Text>
        )}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b6b" />
          <Text style={styles.loadingText}>Đang tải phim liên quan...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error && !loading) {
    return (
      <View style={styles.container}>
        {showTitle && (
          <Text style={styles.sectionTitle}>Phim liên quan</Text>
        )}
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>
            Không thể tải phim liên quan
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRefresh}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Empty state
  if (!relatedMovies || relatedMovies.length === 0) {
    return (
      <View style={styles.container}>
        {showTitle && (
          <Text style={styles.sectionTitle}>Phim liên quan</Text>
        )}
        <View style={styles.emptyContainer}>
<Ionicons name="film-outline" size={48} color="#666" />
          <Text style={styles.emptyText}>
            Không có phim liên quan
          </Text>
        </View>
      </View>
    );
  }

  // Main render
  return (
    <View style={styles.container}>
      {showTitle && (
        <View style={styles.headerContainer}>
          <Text style={styles.sectionTitle}>Phim liên quan</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <Ionicons 
              name="refresh" 
              size={20} 
              color="#fff" 
              style={refreshing ? styles.refreshingIcon : {}} 
            />
          </TouchableOpacity>
        </View>
      )}
      
      {refreshing ? (
        <View style={styles.refreshContainer}>
          <ActivityIndicator size="small" color="#ff6b6b" />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToAlignment="start"
          bounces={false}
          alwaysBounceHorizontal={false}
          nestedScrollEnabled={false}
        >
          {relatedMovies.map(renderMovieItem)}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  refreshButton: {
    padding: 5,
  },
  refreshingIcon: {
    opacity: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 15,
    alignItems: 'flex-start',
    paddingBottom: 10,
  },
  movieItem: {
    width: 140,
    marginRight: 15,
    backgroundColor: '#222',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 0,
    shadowOpacity: 0,
    transform: [{ scale: 1 }],
    flexShrink: 0,
  },
  movieImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    flexShrink: 0,
  },
  movieImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
  },
  movieTypeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  movieTypeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
  movieInfo: {
    padding: 8,
    minHeight: 80,
    flex: 1,
  },
  movieTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
    lineHeight: 16,
    flexWrap: 'wrap',
    minHeight: 48,
  },
  movieProducer: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    minHeight: 16,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  genreTag: {
    backgroundColor: '#333',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  genreText: {
    fontSize: 9,
    color: '#ccc',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#999',
    marginTop: 10,
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
paddingVertical: 40,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 15,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  refreshContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    height: 200,
  },
});

export default RelatedMovies;
