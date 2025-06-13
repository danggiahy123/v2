import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState, useRef } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
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
  const user = authState?.user;
  const userId = authState?.userId;

  const [bannerMovies, setBannerMovies] = useState<BannerMovie[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<GridMovie[]>([]);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
  const [sections, setSections] = useState<MovieSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const bannerFlatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadHomeData();
  }, [userId]);

  useEffect(() => {
    if (bannerMovies.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % bannerMovies.length;
          try {
            bannerFlatListRef.current?.scrollToIndex({
              index: nextIndex,
              animated: true,
            });
          } catch (error) {
            console.log('Banner scroll error:', error);
          }
          return nextIndex;
        });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [bannerMovies.length]);

  const loadHomeData = async () => {
    try {
      setLoading(true);

      try {
        const newReleasesRes = await movieService.getNewReleases({
          bannerLimit: 5,
          limit: 6,
          days: 30,
        });

        if (newReleasesRes?.status === 'success' && newReleasesRes.data) {
          setBannerMovies(newReleasesRes.data.banner?.movies || []);
          setRecommendedMovies(newReleasesRes.data.recommended?.movies || []);
        }
      } catch (error) {
        console.error('Error loading new releases:', error);
      }

      if (userId) {
        try {
          const continueRes = await movieService.getContinueWatching(userId, 6);
          if (continueRes?.status === 'success' && continueRes.data) {
            setContinueWatching(continueRes.data.data || []);
          }
        } catch (error) {
          console.error('Error loading continue watching:', error);
        }
      }

      try {
        const sectionCalls = await Promise.allSettled([
          movieService.getTrending(8),
          movieService.getTopRated(8),
          movieService.getSports({ limit: 8, status: 'released' }),
          movieService.getAnime(8),
          movieService.getVietnamese(8),
          movieService.getComingSoon({ limit: 8, days: 30 }),
        ]);

        const titles = ['Trending', 'Top Rated', 'Thể thao', 'Anime', 'Việt Nam', 'Sắp chiếu'];

        const builtSections: MovieSection[] = sectionCalls
          .map((res, idx) => {
            if (
              res.status === 'fulfilled' &&
              res.value?.status === 'success' &&
              res.value.data?.movies?.length > 0
            ) {
              return {
                title: res.value.data.title || titles[idx],
                movies: res.value.data.movies,
              };
            }
            return null;
          })
          .filter((section): section is MovieSection => section !== null);

        setSections(builtSections);
      } catch (error) {
        console.error('Error loading sections:', error);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu:', err);
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

    const safeIndex = Math.min(currentBannerIndex, bannerMovies.length - 1);
    const currentBannerMovie = bannerMovies[safeIndex];

    if (!currentBannerMovie) return null;

    return (
      <View style={styles.bannerContainer}>
        <FlatList
          ref={bannerFlatListRef}
          data={bannerMovies}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => item.movieId || `banner-${index}`}
          onScrollToIndexFailed={() => {
            console.log('Scroll to index failed');
          }}
          onScroll={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            if (index >= 0 && index < bannerMovies.length) {
              setCurrentBannerIndex(index);
            }
          }}
          renderItem={({ item }) => (
            <View style={{ width: width, height: '100%' }}>
              <Image
                source={{ uri: item.poster }}
                style={styles.bannerImage}
                resizeMode="cover"
                onError={() => console.log('Banner image load error')}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.bannerOverlay}
              />
            </View>
          )}
        />

        <View style={styles.headerBar}>
          <Image source={require('../../assets/anh/logo.png')} style={styles.logoImage} />
          <View style={styles.headerIcons}>
            <TouchableOpacity>
              <Ionicons name="search" size={24} color="#fff" style={styles.iconSpacing} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="person-circle" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle} numberOfLines={2}>
            {currentBannerMovie.title || 'Untitled'}
          </Text>
          <View style={styles.bannerButtons}>
            <TouchableOpacity style={styles.playButton}>
              <Ionicons name="play" size={16} color="#fff" />
              <Text style={styles.playButtonText}>Xem ngay</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreButton}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.moreButtonText}>Xem thêm</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pagination Dots */}
        <View style={styles.paginationDotsContainer}>
          {bannerMovies.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                { opacity: currentBannerIndex === index ? 1 : 0.4 },
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderMovieGrid = (movies: GridMovie[], title: string) => {
    if (!movies || movies.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.movieGrid}>
          {movies.slice(0, 6).map((movie, index) => (
            <TouchableOpacity key={movie.movieId || `movie-${index}`} style={styles.movieItem}>
              <Image
                source={{ uri: movie.poster }}
                style={styles.moviePoster}
                resizeMode="cover"
                onError={() => console.log('Movie poster load error')}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderContinueWatching = () => {
    if (!continueWatching || continueWatching.length === 0) return null;

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
          keyExtractor={(item, index) => item.movieId || `continue-${index}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.continueList}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.continueItem}>
              <Image
                source={{ uri: item.poster }}
                style={styles.continuePoster}
                resizeMode="cover"
                onError={() => console.log('Continue watching poster load error')}
              />
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(Math.max(item.progress * 100, 0), 100)}%` },
                  ]}
                />
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        {renderBanner()}
        {renderMovieGrid(recommendedMovies, 'Phim dành cho bạn')}
        {renderContinueWatching()}
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
    backgroundColor: '#0A0A0A', 
  },
   logoImage: {
   width: 160,  // Adjusted size for better prominence
    height: 70,  // Adjusted height
    resizeMode: 'contain',
    shadowColor: '#00000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  bannerContainer: {
    height: 460, 
    position: 'relative',
    marginBottom: 8, 
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
   
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 100, 
  },
 
  headerBar: {
    position: 'absolute',
    top: 10, 
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
    paddingVertical: 8,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20, 
  },
  iconSpacing: { 
    marginRight: 0, 
  },
  
  bannerContent: {
    position: 'absolute',
    bottom: 40, 
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 2,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 34,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bannerButtons: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    marginTop: 8,
  },
  playButton: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 120,
    justifyContent: 'center',
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  moreButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 120,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(10px)', // Glass effect
  },
  moreButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Pagination
  paginationDotsContainer: {
    position: 'absolute',
    bottom: 140, // Better positioning
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  
  section: {
    paddingHorizontal: 20,
    marginTop: 32,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4, 
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  seeAllText: {
    color: '#B0B0B0',
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textDecorationColor: 'transparent', 
  },
  
 
  movieGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8, 
  },
  movieItem: {
    width: POSTER_WIDTH,
    marginBottom: 20, 
  },
  moviePoster: {
    width: '100%',
    height: POSTER_WIDTH * 1.5,
    borderRadius: 12, 
    backgroundColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  
 
  continueList: {
    paddingRight: 20,
    paddingLeft: 4, 
  },
  continueItem: {
    width: 130,
    marginRight: 16, 
  },
  continuePoster: {
    width: 130,
    height: 195, 
    borderRadius: 10,
    backgroundColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  progressBar: {
    height: 5, 
    backgroundColor: '#2A2A2A',
    marginTop: 8,
    borderRadius: 3,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E50914', 
    borderRadius: 3,
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  lastSection: {
    paddingHorizontal: 20,
    marginTop: 32,
    marginBottom: 32, 
  },
});