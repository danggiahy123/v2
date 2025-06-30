import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { genreService, Genre } from '../../services/genreService';
import { LinearGradient } from 'expo-linear-gradient';

interface Movie {
  _id: string;
  title: string;
  poster: string;
  producer?: string;
  movieType?: string;
  description?: string;
  releaseYear?: number;
  price?: number;
  is_free?: boolean;
  view_count?: number;
  rating?: number;
}

const GenreDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [genre, setGenre] = useState<Genre | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGenreDetail = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await genreService.getGenreMovies(id);
      if (response.status === 'success') {
        setGenre(response.data.genre);
        setMovies(response.data.movies);
      }
    } catch (err) {
      console.error('Error fetching genre detail:', err);
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenreDetail();
  }, [id]);

  const handleBackPress = () => {
    router.back();
  };

  const handleMoviePress = (movie: Movie) => {
    router.push(`/movie/${movie._id}`);
  };

  const renderMovieItem = ({ item }: { item: Movie }) => (
    <TouchableOpacity 
      style={styles.movieItem}
      onPress={() => handleMoviePress(item)}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: item.poster }} 
        style={styles.moviePoster} 
        resizeMode="cover"
      />
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.releaseYear && (
          <Text style={styles.movieYear}>{item.releaseYear}</Text>
        )}
        {item.rating && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đang tải...</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E50914" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      </View>
    );
  }

  if (error || !genre) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thể loại</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>{error || 'Không tìm thấy thể loại'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchGenreDetail}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{genre.genre_name}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Genre Banner */}
      {genre.poster && (
        <View style={styles.bannerContainer}>
          <Image source={{ uri: genre.poster }} style={styles.bannerImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.bannerGradient}
          >
            <View style={styles.bannerContent}>
              <Text style={styles.bannerTitle}>{genre.genre_name}</Text>
              {genre.description && (
                <Text style={styles.bannerDescription} numberOfLines={3}>
                  {genre.description}
                </Text>
              )}
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Movies List */}
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Phim {genre.genre_name} ({movies.length})
          </Text>
        </View>
        
        <FlatList
          data={movies}
          renderItem={renderMovieItem}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.movieRow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.movieList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="film-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>Chưa có phim nào trong thể loại này</Text>
            </View>
          }
        />
      </View>
    </View>
  );
};

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
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  bannerContainer: {
    height: 200,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bannerContent: {
    padding: 20,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bannerDescription: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  movieList: {
    paddingHorizontal: 16,
  },
  movieRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  movieItem: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  moviePoster: {
    width: '100%',
    height: 180,
    backgroundColor: '#333',
  },
  movieInfo: {
    padding: 12,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  movieYear: {
    color: '#999',
    fontSize: 12,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default GenreDetailScreen; 