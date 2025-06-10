
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { movieService } from '../../services/movieService';
import { useAppSelector } from '../../store/hooks';
import { BannerMovie, ContinueWatchingItem, GridMovie } from '../../types/movie';

const { width } = Dimensions.get('window');
const POSTER_WIDTH = (width - 60) / 3;

interface MovieSection {
  title: string;
  movies: GridMovie[];
}

export default function HomeScreen() {
  const authState = useAppSelector((state) => state.auth);
  const { user, userId } = authState || { user: null, userId: null };

  const [bannerMovies, setBannerMovies] = useState<BannerMovie[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<GridMovie[]>([]);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
  const [sections, setSections] = useState<MovieSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    if (authState) loadHomeData();
  }, [userId, authState]);

  const loadHomeData = async () => {
    try {
      const newReleasesResponse = await movieService.getNewReleases({ bannerLimit: 5, limit: 6, days: 30 });
      if (newReleasesResponse.status === 'success') {
        setBannerMovies(newReleasesResponse.data?.banner?.movies || []);
        setRecommendedMovies(newReleasesResponse.data?.recommended?.movies || []);
      }

      if (userId) {
        try {
          const continueResponse = await movieService.getContinueWatching(userId, 6);
          if (continueResponse.status === 'success') {
            setContinueWatching(continueResponse.data?.data || []);
          }
        } catch {}
      }

      const results = await Promise.allSettled([
        movieService.getTrending(8),
        movieService.getTopRated(8),
        movieService.getSports({ limit: 8, status: 'released' }),
        movieService.getAnime(8),
        movieService.getVietnamese(8),
        movieService.getComingSoon({ limit: 8, days: 30 }),
      ]);

      const newSections: MovieSection[] = results.map((res, i) => {
        const titles = ['Trending', 'Top Rated', 'Sports', 'Anime', 'Vietnamese', 'Coming Soon'];
        if (res.status === 'fulfilled' && res.value.status === 'success') {
          return {
            title: res.value.data?.title || titles[i],
            movies: res.value.data?.movies || [],
          };
        }
        return null;
      }).filter(Boolean) as MovieSection[];

      setSections(newSections);
    } catch (e) {
      console.error('Error loading home data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHomeData();
  };

  const renderBanner = () => {
    if (!bannerMovies.length) return null;
    const current = bannerMovies[currentBannerIndex];
    return (
      <View style={styles.bannerContainer}>
        <Image source={{ uri: current.poster }} style={styles.bannerImage} resizeMode="cover" />
        <View style={styles.bannerOverlay} />
        <View style={styles.headerBar}>
          <Text style={styles.logoText}>TECH5 PLAY</Text>
          <View style={styles.headerIcons}>
            <Ionicons name="search" size={24} color="#fff" style={styles.iconSpacing} />
            <Ionicons name="person-circle" size={28} color="#fff" />
          </View>
        </View>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>{current.title}</Text>
          <View style={styles.bannerButtons}>
            <TouchableOpacity style={styles.playButton}>
              <Ionicons name="play" size={16} color="#000" />
              <Text style={styles.playButtonText}>Xem ngay</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreButton}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.moreButtonText}>Xem thêm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderMovieGrid = (movies: GridMovie[], title: string) => (
    !!movies.length && (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <TouchableOpacity><Text style={styles.seeAllText}>Xem tất cả</Text></TouchableOpacity>
        </View>
        <View style={styles.movieGrid}>
          {movies.slice(0, 6).map((movie) => (
            <TouchableOpacity key={movie.movieId} style={styles.movieItem}>
              <Image source={{ uri: movie.poster }} style={styles.moviePoster} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )
  );

  const renderContinueWatching = () => (
    !!continueWatching.length && (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Đang xem</Text>
          <TouchableOpacity><Text style={styles.seeAllText}>Xem tất cả</Text></TouchableOpacity>
        </View>
        <FlatList
          data={continueWatching}
          horizontal
          keyExtractor={(item) => item.movieId}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.continueList}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.continueItem}>
              <Image source={{ uri: item.poster }} style={styles.continuePoster} resizeMode="cover" />
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${item.progress * 100}%` }]} />
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    )
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        {renderBanner()}
        {renderMovieGrid(recommendedMovies, 'Phim dành cho bạn')}
        {renderContinueWatching()}
        {sections.map((section, index) => (
          <React.Fragment key={index}>
            {renderMovieGrid(section.movies, section.title)}
          </React.Fragment>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  loadingText: { color: '#fff', marginTop: 16, fontSize: 16 },
  scrollView: { flex: 1 },

  bannerContainer: { height: 400, position: 'relative' },
  bannerImage: { width: '100%', height: '100%' },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.4)' },

  headerBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconSpacing: { marginRight: 16 },

  bannerContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  bannerButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  playButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  playButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
  moreButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  moreButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  section: { paddingHorizontal: 20, marginTop: 32 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  seeAllText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '500',
  },
  movieGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  movieItem: {
    width: POSTER_WIDTH,
    marginBottom: 16,
  },
  moviePoster: {
    width: '100%',
    height: POSTER_WIDTH * 1.5,
    borderRadius: 10,
    backgroundColor: '#222',
  },

  continueList: { paddingRight: 20 },
  continueItem: { width: 120, marginRight: 12 },
  continuePoster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    backgroundColor: '#222',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    marginTop: 6,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E53935',
    borderRadius: 2,
  },
});
