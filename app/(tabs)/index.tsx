import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
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
const POSTER_WIDTH = (width - 60) / 3; // 3 columns with padding

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

  // Return loading state if Redux store is not ready
  if (!authState) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Đang khởi tạo...</Text>
      </View>
    );
  }

  const loadHomeData = async () => {
    try {
      // Load new releases (banner + recommended)
      const newReleasesResponse = await movieService.getNewReleases({
        bannerLimit: 5,
        limit: 6,
        days: 30
      });

      if (newReleasesResponse.status === 'success') {
        setBannerMovies(newReleasesResponse.data?.banner?.movies || []);
        setRecommendedMovies(newReleasesResponse.data?.recommended?.movies || []);
      }

      // Load continue watching if user is logged in
      if (userId) {
        try {
          const continueResponse = await movieService.getContinueWatching(userId, 6);
          if (continueResponse.status === 'success') {
            setContinueWatching(continueResponse.data?.data || []);
          }
        } catch (error) {
          console.log('No continue watching data available');
        }
      }

      // Load all other sections in parallel
      const [trending, topRated, sports, anime, vietnamese, comingSoon] = await Promise.allSettled([
        movieService.getTrending(8),
        movieService.getTopRated(8),
        movieService.getSports({ limit: 8, status: 'released' }),
        movieService.getAnime(8),
        movieService.getVietnamese(8),
        movieService.getComingSoon({ limit: 8, days: 30 })
      ]);

      const newSections: MovieSection[] = [];

      // Add sections that loaded successfully
      if (trending.status === 'fulfilled' && trending.value.status === 'success') {
        newSections.push({
          title: trending.value.data?.title || 'Trending',
          movies: trending.value.data?.movies || []
        });
      }

      if (topRated.status === 'fulfilled' && topRated.value.status === 'success') {
        newSections.push({
          title: topRated.value.data?.title || 'Top Rated',
          movies: topRated.value.data?.movies || []
        });
      }

      if (sports.status === 'fulfilled' && sports.value.status === 'success') {
        newSections.push({
          title: sports.value.data?.title || 'Sports',
          movies: sports.value.data?.movies || []
        });
      }

      if (anime.status === 'fulfilled' && anime.value.status === 'success') {
        newSections.push({
          title: anime.value.data?.title || 'Anime',
          movies: anime.value.data?.movies || []
        });
      }

      if (vietnamese.status === 'fulfilled' && vietnamese.value.status === 'success') {
        newSections.push({
          title: vietnamese.value.data?.title || 'Vietnamese',
          movies: vietnamese.value.data?.movies || []
        });
      }

      if (comingSoon.status === 'fulfilled' && comingSoon.value.status === 'success') {
        newSections.push({
          title: comingSoon.value.data?.title || 'Coming Soon',
          movies: comingSoon.value.data?.movies || []
        });
      }

      setSections(newSections);

    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHomeData();
  };

  useEffect(() => {
    // Only load data if component is properly mounted and store is ready
    if (authState) {
      loadHomeData();
    }
  }, [userId, authState]);

  const renderBanner = () => {
    if (!bannerMovies || !bannerMovies.length) return null;

    const currentMovie = bannerMovies[currentBannerIndex] || bannerMovies[0];

    return (
      <View style={styles.bannerContainer}>
        <Image
          source={{ uri: currentMovie.poster }}
          style={styles.bannerImage}
          resizeMode="cover"
        />
        <View style={styles.bannerOverlay} />
        
        <View style={styles.bannerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>TECH5 PLAY</Text>
          </View>
          
          <View style={styles.bannerInfo}>
            <Text style={styles.bannerTitle}>{currentMovie.title}</Text>
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

        {/* Search and Profile Icons */}
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="search" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="person-circle" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderMovieGrid = (movies: GridMovie[], title: string) => {
    if (!movies || !movies.length) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.movieGrid}>
          {(movies || []).slice(0, 6).map((movie, index) => ( // Show max 6 movies per section
            <TouchableOpacity key={movie.movieId} style={styles.movieItem}>
              <Image
                source={{ uri: movie.poster }}
                style={styles.moviePoster}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderContinueWatching = () => {
    if (!continueWatching || !continueWatching.length) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Đang xem</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={continueWatching}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.movieId}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.continueItem}>
              <Image
                source={{ uri: item.poster }}
                style={styles.continuePoster}
                resizeMode="cover"
              />
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${item.progress * 100}%` }]} 
                />
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.continueList}
        />
      </View>
    );
  };

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
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
      >
        {renderBanner()}
        {renderMovieGrid(recommendedMovies, "Phim dành cho bạn")}
        {renderContinueWatching()}
        
        {/* Render all other sections */}
        {sections.map((section, index) => (
          <React.Fragment key={`section-${index}`}>
            {renderMovieGrid(section.movies, section.title)}
          </React.Fragment>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  bannerContainer: {
    height: 400,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  bannerContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  logoContainer: {
    position: 'absolute',
    top: -350,
    left: 20,
  },
  logoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerIcons: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    gap: 15,
  },
  iconButton: {
    padding: 8,
  },
  bannerInfo: {
    alignItems: 'center',
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  bannerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  playButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
  moreButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moreButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    color: '#888',
    fontSize: 14,
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
    height: POSTER_WIDTH * 1.5, // Aspect ratio for movie posters
    borderRadius: 8,
  },
  continueList: {
    paddingRight: 20,
  },
  continueItem: {
    width: 120,
    marginRight: 12,
  },
  continuePoster: {
    width: 120,
    height: 180,
    borderRadius: 8,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginTop: 8,
    borderRadius: 1.5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D32F2F',
    borderRadius: 1.5,
  },
});
