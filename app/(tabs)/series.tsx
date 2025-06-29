import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  Animated,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { TabHeader, SearchModal, ViewAllModal } from '../../components/ui';
import { seriesService } from '../../services/seriesService';
import { genreService } from '../../services/genreService';
import { SeriesBanner } from '../../components/series';
import { SeriesGenreSelector } from '../../components/series/SeriesGenreSelector';

type Movie = {
  movieId: string;
  title: string;
  poster: string;
  producer: string;
  movieType: string;
};

const SERIES_GENRES = [
  { genre_name: 'Phim drama', _id: '68418dc73556ab3de6e4c437', movie_count: 0 },
  { genre_name: 'Phim Bộ Hàn Quốc', _id: '68418dc73556ab3de6e4c43a', movie_count: 0 },
  { genre_name: 'Phim Bộ Trung Quốc', _id: '68418dc73556ab3de6e4c43d', movie_count: 0 },
  { genre_name: 'Phim Bộ Thái Lan', _id: '68418dc73556ab3de6e4c440', movie_count: 0 },
  { genre_name: 'Phim Bộ Mỹ', _id: '68418dc83556ab3de6e4c446', movie_count: 0 },
  { genre_name: 'Sitcom', _id: '68418dc83556ab3de6e4c449', movie_count: 0 },
];

export default function SeriesScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);
  const [searchVisible, setSearchVisible] = useState(false);
  const [recommended, setRecommended] = useState<Movie[]>([]);
  const [trending, setTrending] = useState<Movie[]>([]);
  const [vietnamese, setVietnamese] = useState<Movie[]>([]);
  const [anime, setAnime] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [genreModalVisible, setGenreModalVisible] = useState(false);
  const [viewAllModalVisible, setViewAllModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTitle, setSelectedTitle] = useState('');
  const [genreLoading, setGenreLoading] = useState(false);
  const [genreCustomMovies, setGenreCustomMovies] = useState<any[]>([]);

  const router = useRouter();

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
      },
    }
  );

  useEffect(() => {
    fetchSeriesData();
  }, []);

  const fetchSeriesData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch các phần còn lại, bỏ banner (đã có component Banner riêng)
      const [trendingRes, vietnameseRes, animeRes] = await Promise.all([
        seriesService.getTrendingSeries({ limit: 10 }),
        seriesService.getVietnameseSeries({ limit: 10 }),
        seriesService.getAnimeSeries({ limit: 10 }),
      ]);

      // Lấy đúng trường dữ liệu từ backend mới
      const extractMovies = (res: any) => (res.data?.movies || res.data || []);
      const convertToMovie = (series: any) => ({
        movieId: series.movieId || series._id,
        title: series.title || series.movie_title,
        poster: series.poster || series.poster_path,
        producer: series.producer || '',
        movieType: series.movieType || series.movie_type || '',
      });

      setTrending(extractMovies(trendingRes).map(convertToMovie));
      setVietnamese(extractMovies(vietnameseRes).map(convertToMovie));
      setAnime(extractMovies(animeRes).map(convertToMovie));
      setRecommended(extractMovies(trendingRes).map(convertToMovie));

    } catch (err) {
      console.error('Error fetching series data:', err);
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleGenreSelect = async (genre: any) => {
    try {
      setGenreLoading(true);
      setSelectedCategory(genre._id);
      setSelectedTitle(genre.genre_name);
      
      // Gọi API để lấy phim theo thể loại
      const response = await genreService.getMoviesByGenre(genre._id, 1, 50, true);
      const movies = response.data.movies.map((movie: any) => ({
        _id: movie._id,
        title: movie.movie_title,
        poster: movie.poster_path,
        producer: movie.producer,
        price: movie.price,
        description: movie.description
      }));
      
      setGenreCustomMovies(movies);
      setViewAllModalVisible(true);
      setGenreModalVisible(false);
    } catch (error) {
      console.error('Error fetching genre movies:', error);
      setGenreCustomMovies([]);
      setViewAllModalVisible(true);
      setGenreModalVisible(false);
    } finally {
      setGenreLoading(false);
    }
  };

  const renderMovieItem = ({ item }: { item: Movie }) => (
    <TouchableOpacity 
      style={styles.movieItem}
      onPress={() => router.push(`/movie/${item.movieId}`)}
    >
      <Image source={{ uri: item.poster }} style={styles.poster} resizeMode="cover" />
    </TouchableOpacity>
  );

  const renderSection = (title: string, data: Movie[], category: string) => {
    if (!data || data.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <FlatList
          data={data}
          renderItem={renderMovieItem}
          keyExtractor={(item) => item.movieId}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.movieList}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <TabHeader
          title="Phim bộ"
          onSearchPress={() => setSearchVisible(true)}
          onNotificationPress={() => {}}
          showGenreSelector
          genres={SERIES_GENRES}
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

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <TabHeader
          title="Phim bộ"
          onSearchPress={() => setSearchVisible(true)}
          onNotificationPress={() => {}}
          showGenreSelector
          genres={SERIES_GENRES}
          onGenreSelect={handleGenreSelect}
          opacity={headerOpacity}
        />
        <View style={styles.error}>
          <Ionicons name="alert-circle" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSeriesData}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <TabHeader
        title="Phim bộ"
        onSearchPress={() => setSearchVisible(true)}
        onNotificationPress={() => {}}
        showGenreSelector
        genres={SERIES_GENRES}
        onGenreSelect={handleGenreSelect}
        opacity={headerOpacity}
      />

      <Animated.ScrollView
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <SeriesBanner />
          <View style={styles.trendingSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Phim Bộ Xu Hướng</Text>
            </View>
            <FlatList
              data={trending.slice(0, 10)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.trendingList}
              renderItem={({ item, index }) => (
                <TouchableOpacity 
                  style={styles.trendingItem}
                  onPress={() => router.push(`/movie/${item.movieId}`)}
                >
                  <View style={styles.rankContainer}>
                    <Text style={styles.rankNumber}>{index + 1}</Text>
                  </View>
                  <Image source={{ uri: item.poster }} style={styles.trendingPoster} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.9)']}
                    style={styles.trendingGradient}
                  >
                    <Text style={styles.trendingTitle} numberOfLines={2}>{item.title}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.movieId}
            />
          </View>
          {renderSection('Phim bộ dành cho bạn', recommended, 'recommended')}
          {renderSection('Phim bộ Việt Nam', vietnamese, 'vietnamese')}
          {renderSection('Phim bộ Anime', anime, 'anime')}
        </View>
      </Animated.ScrollView>

      <SearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        category="series"
      />

      {/* ViewAllModal hiển thị list phim từ API */}
      <ViewAllModal
        visible={viewAllModalVisible}
        onClose={() => setViewAllModalVisible(false)}
        category={selectedCategory}
        title={selectedTitle}
        customMovies={genreCustomMovies}
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
    paddingTop: 120,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  movieList: {
    paddingLeft: 15,
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
    backgroundColor: '#E50914',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  trendingSection: {
    marginBottom: 24,
    paddingTop: 16,
  },
  trendingList: {
    paddingLeft: 15,
    paddingTop: 8,
  },
  trendingItem: {
    width: 160,
    height: 240,
    marginRight: 16,
    position: 'relative',
  },
  rankContainer: {
    position: 'absolute',
    top: -10,
    left: -10,
    zIndex: 2,
    width: 40,
    height: 40,
    backgroundColor: '#D32F2F',
    borderRadius: 20,
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  trendingPoster: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
  },
  trendingGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    padding: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    justifyContent: 'flex-end',
  },
  trendingTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
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
});