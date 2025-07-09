import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  Animated,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TabHeader, SearchModal, ViewAllModal } from '../../components/ui';
import { animeService } from '../../services/animeService';
import { genreService, Genre } from '../../services/genreService';
import { Banner, GenreSelector } from '../../components/anime';
import { useRouter } from 'expo-router';
import { shouldShowPaidBadge, enrichMoviesWithPriceInfo } from '../../utils/moviePriceHelper';

type Anime = {
  _id?: string;
  movieId: string;
  title: string;
  poster: string;
  producer: string;
  movieType: string;
  price?: number;
  is_free?: boolean;
  price_display?: string;
};

export default function AnimeScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);
  const [searchVisible, setSearchVisible] = useState(false);
  const [genreSelectorVisible, setGenreSelectorVisible] = useState(false);
  const [trending, setTrending] = useState<Anime[]>([]);
  const [series, setSeries] = useState<Anime[]>([]);
  const [movies, setMovies] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [viewAllModalVisible, setViewAllModalVisible] = useState(false);
  const [viewAllCustomMovies, setViewAllCustomMovies] = useState<any[] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTitle, setSelectedTitle] = useState('');
  const [genreLoading, setGenreLoading] = useState(false);
  
  // Thêm state cho thể loại từ API
  const [animeGenres, setAnimeGenres] = useState<Genre[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);
  const [genresError, setGenresError] = useState<string | null>(null);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { 
      useNativeDriver: true,
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const scrollDiff = currentScrollY - lastScrollY.current;
        
        if (scrollDiff > 2 && currentScrollY > 0) {
          headerOpacity.setValue(0);
        } else if (scrollDiff < -2 || currentScrollY <= 0) {
          headerOpacity.setValue(1);
        }
        
        lastScrollY.current = currentScrollY;
      }
    }
  );

  const fetchAnimeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await animeService.getAllAnime();
      const data = response.data || {};
      
      // Map raw anime data to GridMovie format
      const mapAnimeToGridMovie = (animeList: any[]) => {
        return animeList.map((anime: any) => ({
          movieId: anime.movieId || anime._id || anime.id || 'unknown',
          title: anime.title || anime.movie_title || 'Untitled',
          poster: anime.poster || anime.poster_path || '',
          movieType: anime.movieType || anime.movie_type || 'Anime',
          producer: anime.producer || '',
          rating: anime.rating,
          year: anime.year || anime.release_year,
          _id: anime._id || anime.movieId // Keep original _id for API calls
        }));
      };

      // Extract and map different anime sections
      const rawTrending = data.trending || [];
      const rawSeries = data.series || [];
      const rawMovies = data.movies || [];

      const mappedTrending = mapAnimeToGridMovie(rawTrending);
      const mappedSeries = mapAnimeToGridMovie(rawSeries);
      const mappedMovies = mapAnimeToGridMovie(rawMovies);
      
      // 💰 Enhance anime data với price info
      
      try {
        const [enhancedTrending, enhancedSeries, enhancedMovies] = await Promise.all([
          enrichMoviesWithPriceInfo(mappedTrending, 2),
          enrichMoviesWithPriceInfo(mappedSeries, 2),
          enrichMoviesWithPriceInfo(mappedMovies, 2)
        ]);
        
        setTrending(enhancedTrending);
        setSeries(enhancedSeries);
        setMovies(enhancedMovies);
        
        console.log('✅ [AnimeScreen] Enhanced anime data:', {
          trending: enhancedTrending.length,
          series: enhancedSeries.length,
          movies: enhancedMovies.length,
          paidTrending: enhancedTrending.filter(m => shouldShowPaidBadge(m)).length,
          paidSeries: enhancedSeries.filter(m => shouldShowPaidBadge(m)).length,
          paidMovies: enhancedMovies.filter(m => shouldShowPaidBadge(m)).length
        });
      } catch (enhanceError) {
        console.warn('⚠️ [AnimeScreen] Failed to enhance with price info, using original data:', enhanceError);
        setTrending(mappedTrending);
        setSeries(mappedSeries);
        setMovies(mappedMovies);
      }
    } catch (err) {
      console.error('Error fetching anime data:', err);
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Thêm hàm fetch thể loại từ API
  const fetchAnimeGenres = async () => {
    try {
      setGenresLoading(true);
      setGenresError(null);
      const response = await genreService.getGenres('all');
      
      if (response.status === 'success' && response.data.genres) {
        // Tìm thể loại "Hoạt hình" và lấy các thể loại con
        const animeParent = response.data.genres.find(
          (genre: Genre) => genre.genre_name === 'Hoạt hình' && genre.is_parent
        );
        
        if (animeParent && animeParent.children) {
          setAnimeGenres(animeParent.children);
        } else {
          // Fallback: nếu không tìm thấy thể loại cha, lấy tất cả thể loại có movie_count > 0
          const activeGenres = response.data.genres.filter(
            (genre: Genre) => genre.movie_count && genre.movie_count > 0 && genre.is_active
          );
          setAnimeGenres(activeGenres);
        }
      }
    } catch (err) {
      console.error('Error fetching anime genres:', err);
      setGenresError('Có lỗi xảy ra khi tải thể loại');
      setAnimeGenres([]); // Để trống nếu API lỗi
    } finally {
      setGenresLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimeData();
    fetchAnimeGenres();
  }, []);

  const renderMovieItem = ({ item }: { item: Anime }) => (
    <TouchableOpacity 
      style={styles.movieItem}
      onPress={() => router.push(`/movie/${item.movieId || item._id}`)}
    >
      <View style={styles.posterContainer}>
        <Image source={{ uri: item.poster }} style={styles.poster} resizeMode="cover" />
        
        {/* Badge "Trả phí" cho anime trả phí */}
        {shouldShowPaidBadge(item) && (
          <View style={styles.paidBadge}>
            <Ionicons name="card" size={8} color="#fff" />
            <Text style={styles.paidBadgeText}>Trả phí</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSection = (title: string, data: Anime[], category: string) => {
    if (!data || data.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <FlatList
          data={data}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.movieId}
          renderItem={renderMovieItem}
          contentContainerStyle={styles.movieList}
        />
      </View>
    );
  };

  const renderTrendingSection = (data: Anime[]) => {
    if (!data || data.length === 0) return null;

    return (
      <View style={styles.trendingSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Hoạt hình đang thịnh hành</Text>
        </View>
        <FlatList
          data={data.slice(0, 10)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trendingList}
          renderItem={({ item, index }) => (
            <TouchableOpacity 
              style={styles.trendingItem}
              onPress={() => router.push(`/movie/${item.movieId || item._id}`)}
            >
              <View style={styles.rankContainer}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              <View style={styles.trendingPosterContainer}>
                <Image source={{ uri: item.poster }} style={styles.trendingPoster} />
                
                {/* Badge "Trả phí" cho trending anime */}
                {shouldShowPaidBadge(item) && (
                  <View style={styles.trendingPaidBadge}>
                    <Ionicons name="card" size={8} color="#fff" />
                    <Text style={styles.trendingPaidText}>Trả phí</Text>
                  </View>
                )}
                
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.9)']}
                  style={styles.trendingGradient}
                >
                  <Text style={styles.trendingTitle} numberOfLines={2}>{item.title}</Text>
                </LinearGradient>
              </View>
            </TouchableOpacity>
          )}
                        keyExtractor={(item) => item.movieId}
        />
      </View>
    );
  };

  const handleGenreSelect = async (genre: Genre) => {
    try {
      setGenreLoading(true);
      setSelectedCategory(genre._id);
      setSelectedTitle(genre.genre_name);
      
      // Gọi API để lấy phim theo thể loại
      const response = await genreService.getMoviesByGenre(genre._id, 1, 50, true);
      const movies = response.data.movies.map((movie: any) => ({
        movieId: movie._id,
        _id: movie._id,
        title: movie.movie_title,
        poster: movie.poster_path,
        producer: movie.producer,
        price: movie.price,
        description: movie.description
      }));
      
      setViewAllCustomMovies(movies);
      setViewAllModalVisible(true);
    } catch (error) {
      console.error('Error fetching genre movies:', error);
      setViewAllCustomMovies([]);
      setViewAllModalVisible(true);
    } finally {
      setGenreLoading(false);
    }
  };

  if (loading || genresLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <TabHeader
          title="Hoạt hình"
          onSearchPress={() => setSearchVisible(true)}
          onNotificationPress={() => router.push('/notifications')}
          showGenreSelector
          genres={animeGenres}
          onGenreSelect={handleGenreSelect}
          opacity={headerOpacity}
        />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      </View>
    );
  }

  if (error || genresError) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <TabHeader
          title="Hoạt hình"
          onSearchPress={() => setSearchVisible(true)}
          onNotificationPress={() => router.push('/notifications')}
          showGenreSelector
          genres={animeGenres}
          onGenreSelect={handleGenreSelect}
          opacity={headerOpacity}
        />
        <View style={styles.error}>
          <Ionicons name="alert-circle" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>{error || genresError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => {
            fetchAnimeData();
            fetchAnimeGenres();
          }}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <Animated.ScrollView 
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Banner />
          {renderTrendingSection(trending)}
          {renderSection('Hoạt hình phim bộ', series, 'series')}
          {renderSection('Hoạt hình chiếu rạp', movies, 'movies')}
        </View>
      </Animated.ScrollView>

      <TabHeader 
        title="Hoạt hình"
        onSearchPress={() => setSearchVisible(true)}
        onNotificationPress={() => router.push('/notifications')}
        showGenreSelector
        genres={animeGenres}
        onGenreSelect={handleGenreSelect}
        opacity={headerOpacity}
      />

      <SearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        category="anime"
      />

      <ViewAllModal
        visible={viewAllModalVisible}
        onClose={() => setViewAllModalVisible(false)}
        category={selectedCategory}
        title={selectedTitle}
        customMovies={viewAllCustomMovies || undefined}
      />

      {genreLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Đang tải phim...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 120,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
   
  },
  seeAllText: {
    color: '#B0B0B0',
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textDecorationColor: 'transparent',
  },
  movieList: {
    paddingHorizontal: 16,
  },
  movieItem: {
    marginRight: 20,
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
  },
  error: {
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
  trendingSection: {
    marginBottom: 24,
    paddingTop: 16,
  },
  trendingList: {
    paddingLeft: 20,
    paddingTop: 15,
  },
  trendingItem: {
    width: 160,
    height: 240,
    marginRight: 16,
    position: 'relative',
  },
  rankContainer: {
    position: 'absolute',
    top: -5,
    left: -5,
    zIndex: 2,
    width: 45,
    height: 45,
    backgroundColor: '#D32F2F',
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rankNumber: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  trendingPoster: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  trendingGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
    justifyContent: 'flex-end',
  },
  trendingTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  // Badge "Trả phí" styles
  posterContainer: {
    position: 'relative',
  },
  paidBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(229, 9, 20, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    zIndex: 10,
  },
  paidBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  // Trending section badge styles
  trendingPosterContainer: {
    position: 'relative',
    flex: 1,
  },
  trendingPaidBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(229, 9, 20, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 4,
    zIndex: 10,
  },
  trendingPaidText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 2,
  },
}); 