import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Modal,
  StatusBar,
} from 'react-native';
// SafeAreaView imported but not used - will be used in future updates
import { LinearGradient } from 'expo-linear-gradient';
import { movieService } from '../../services/movieService';
import { animeService } from '../../services/animeService';
import { seriesService } from '../../services/seriesService';
import { sportsService } from '../../services/sportsService';
import { genreService } from '../../services/genreService';
import { shareMovie } from '../../services/shareService';
import { userInteractionService } from '../../services/userInteractionService';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { clearMessage } from '../../store/slices/authSlice';
import { BannerMovie, ContinueWatchingItem, GridMovie } from '../../types/movie';
import { useRouter, useFocusEffect } from 'expo-router';
import { TabHeader, SearchModal, ViewAllModal, LoginRequiredModal } from '../../components/ui';
import { ContinueWatchingSection } from '../../components/home';
import GenreGrid from '../../components/genre/GenreGrid';
import { shouldShowPaidBadge, enrichMoviesWithPriceInfo } from '../../utils/moviePriceHelper';
import { useAuthGuard } from '../../hooks';
// import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

/**
 * Interface cho kết quả tìm kiếm phim
 */
interface SearchResult extends GridMovie {
  description?: string;
}

interface MovieSection {
  title: string;
  movies: GridMovie[];
}

export default function HomeScreen() {
  const authState = useAppSelector((state) => state.auth);
  const { userId } = authState || { userId: null };
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoggedIn, showLoginModal, hideLoginModal, loginModalVisible, currentFeatureName } = useAuthGuard();
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const headerOpacity = useRef(new Animated.Value(1)).current;

  const [bannerMovies, setBannerMovies] = useState<BannerMovie[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<GridMovie[]>([]);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
  const [sections, setSections] = useState<MovieSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTitle, setSelectedTitle] = useState('');
  const [viewAllModalVisible, setViewAllModalVisible] = useState(false);
  const [genres, setGenres] = useState<any[]>([]);
  const [genreModalVisible, setGenreModalVisible] = useState(false);
  const [actionGenreMovies, setActionGenreMovies] = useState<GridMovie[]>([]);
  const [actionGenre, setActionGenre] = useState<any>(null);
  const [sportsMovies, setSportsMovies] = useState<GridMovie[]>([]);
  const [homeGenreModalVisible, setHomeGenreModalVisible] = useState(false);
  const [homeGenreSelected, setHomeGenreSelected] = useState('');
  const [homeGenreTitle, setHomeGenreTitle] = useState('');
  const [homeGenreViewAllVisible, setHomeGenreViewAllVisible] = useState(false);
  const [homeGenreCustomMovies, setHomeGenreCustomMovies] = useState<GridMovie[]>([]);
  const [homeGenreLoading, setHomeGenreLoading] = useState(false);
  const [showLogoutNotification, setShowLogoutNotification] = useState(false);
  
  // Banner interaction states
  const [bannerFavorites, setBannerFavorites] = useState<{[key: string]: boolean}>({});
  const [bannerLikes, setBannerLikes] = useState<{[key: string]: boolean}>({});

  const bannerFlatListRef = useRef<FlatList>(null);

  // Search functionality - will be implemented in future updates
  const [searchQuery] = useState('');
  const [, setSearchResults] = useState<SearchResult[]>([]);
  const [, setSearchPage] = useState(1);
  const [, setIsLoadingMore] = useState(false);
  const [, setHasMoreResults] = useState(true);

  useEffect(() => {
    loadHomeData();
    // Fetch genres from API
    fetch('https://backend-app-lou3.onrender.com/api/genres?type=parent')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') setGenres(data.data.genres);
      })
      .catch(err => console.error('Error fetching genres:', err));
    
    // Load action genre movies
    loadActionGenreMovies();
    
    // Load sports movies
    loadSportsMovies();
  }, [userId]); // loadHomeData is defined below, will be memoized in future optimization

  // Check if user just logged out and show notification
  useEffect(() => {
    if (!isLoggedIn && authState.message === 'Đăng xuất thành công') {
      setShowLogoutNotification(true);
      setTimeout(() => {
        setShowLogoutNotification(false);
      }, 3000);
      // Clear the logout message to prevent showing it again
      dispatch(clearMessage());
    }
  }, [isLoggedIn, authState.message, dispatch]);

  // Refresh continue watching data when screen is focused (user comes back from movie detail)
  useFocusEffect(
    React.useCallback(() => {
      if (userId) {
        console.log('🎬 [Home] Screen focused, refreshing continue watching data');
        // Only refresh continue watching, not full home data
        const refreshContinueWatching = async () => {
          try {
            const continueRes = await movieService.getContinueWatching(userId, 6);
            if (continueRes?.status === 'success' && continueRes.data) {
              console.log('🎬 [Home] Continue watching refreshed:', continueRes.data.data);
              setContinueWatching(continueRes.data.data || []);
            }
          } catch (error) {
            console.error('Error refreshing continue watching:', error);
          }
        };
        refreshContinueWatching();
      }
    }, [userId])
  );

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
          
          // Enhance recommended movies with price info
          const originalRecommended = newReleasesRes.data.recommended?.movies || [];
          if (originalRecommended.length > 0) {
            try {
              const enhancedRecommended = await enrichMoviesWithPriceInfo(originalRecommended);
              setRecommendedMovies(enhancedRecommended);
              console.log('Recommended movies enhanced with price info');
            } catch (error) {
              console.error('Error enhancing recommended movies:', error);
              setRecommendedMovies(originalRecommended);
            }
          }
        }
      } catch (error) {
        console.error('Error loading new releases:', error);
      }

      if (userId) {
        try {
          console.log('🎬 [Home] Loading continue watching for userId:', userId);
          const continueRes = await movieService.getContinueWatching(userId, 6);
          console.log('🎬 [Home] Continue watching response:', {
            status: continueRes?.status,
            dataType: typeof continueRes?.data,
            hasData: !!continueRes?.data?.data,
            dataLength: continueRes?.data?.data?.length
          });
          if (continueRes?.status === 'success' && continueRes.data) {
            console.log('🎬 [Home] Continue watching data updated:', continueRes.data.data);
            setContinueWatching(continueRes.data.data || []);
          }
        } catch (error) {
          console.error('Error loading continue watching:', error);
        }
      } else {
        console.log('⚠️ [Home] No userId found, skipping continue watching');
      }

      try {
        const sectionCalls = await Promise.allSettled([
          movieService.getTrending(8),
          movieService.getTopRated(8),
          movieService.getSports({ limit: 8, status: 'released' }),
          animeService.getAllAnime({ showAll: false }),
          seriesService.getVietnameseSeries({ limit: 8 }),
          movieService.getComingSoon({ limit: 8, days: 30 }),
        ]);

        const titles = ['Trending', 'Top Rated', 'Thể thao', 'Anime', 'Việt Nam', 'Sắp chiếu'];

        const builtSections: MovieSection[] = sectionCalls
          .map((res, idx) => {
            if (res.status === 'fulfilled' && res.value?.status === 'success') {
              // Special handling for anime section
              if (idx === 3) { // Anime section
                // Check different possible data structures
                let animeMovies = [];
                if (res.value.data?.movies) {
                  animeMovies = res.value.data.movies;
                } else if (res.value.data?.trending) {
                  animeMovies = res.value.data.trending;
                } else if (res.value.data?.series) {
                  animeMovies = res.value.data.series;
                } else if (Array.isArray(res.value.data)) {
                  animeMovies = res.value.data;
                }

                // Map anime data to GridMovie format
                const mappedAnimeMovies = animeMovies.map((anime: any) => ({
                  movieId: anime.movieId || anime._id || anime.id,
                  title: anime.title || anime.movie_title,
                  poster: anime.poster || anime.poster_path,
                  movieType: anime.movieType || anime.movie_type || 'Anime',
                  producer: anime.producer || '',
                  rating: anime.rating,
                  year: anime.year || anime.release_year
                }));

                if (mappedAnimeMovies.length > 0) {
                  return {
                    title: res.value.data.title || titles[idx],
                    movies: mappedAnimeMovies,
                  };
                }
                return null;
              }

              // Standard handling for other sections
              if (res.value.data?.movies?.length > 0) {
                return {
                  title: res.value.data.title || titles[idx],
                  movies: res.value.data.movies,
                };
              }
            }
            return null;
          })
          .filter((section): section is MovieSection => section !== null);

        // Enhance sections with price info
        console.log('Enhancing sections with price info...');
        const enhancedSections = await Promise.all(
          builtSections.map(async (section) => {
            try {
              const enhancedMovies = await enrichMoviesWithPriceInfo(section.movies);
              return { ...section, movies: enhancedMovies };
            } catch (error) {
              console.error(`Error enhancing section ${section.title}:`, error);
              return section; // Return original if enhancement fails
            }
          })
        );
        
        setSections(enhancedSections);
        console.log('Sections enhanced successfully');
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

  const loadActionGenreMovies = async () => {
    try {
      // Tìm thể loại "Hành động" trong danh sách genres
      const genresResponse = await genreService.getGenres('parent');
      if (genresResponse.status === 'success') {
        const actionGenre = genresResponse.data.genres.find(
          (genre: any) => genre.genre_name.toLowerCase().includes('hành động')
        );
        
        if (actionGenre) {
          setActionGenre(actionGenre);
          // Load phim của thể loại hành động
          const moviesResponse = await genreService.getGenreMovies(actionGenre._id);
          if (moviesResponse.status === 'success') {
            const originalMovies = moviesResponse.data.movies.slice(0, 8);
            
            // Enhance action genre movies with price info
            try {
              const enhancedMovies = await enrichMoviesWithPriceInfo(originalMovies);
              setActionGenreMovies(enhancedMovies);
              console.log('Action genre movies enhanced with price info');
            } catch (error) {
              console.error('Error enhancing action genre movies:', error);
              setActionGenreMovies(originalMovies);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading action genre movies:', error);
    }
  };

  const loadSportsMovies = async () => {
    try {
      const sportsRes = await sportsService.getAllSports();
      if (sportsRes.status === 'success' && sportsRes.data) {
        // Get a mix from all sports categories for variety
        const allSports = sportsRes.data.slice(0, 4);
        
        // Try to get NBA and Football for mix
        const [nbaRes, footballRes] = await Promise.allSettled([
          sportsService.getNBAMovies(),
          sportsService.getFootballMovies(),
        ]);
        
        let mixedSports = [...allSports];
        
        if (nbaRes.status === 'fulfilled' && nbaRes.value.status === 'success') {
          mixedSports.push(...nbaRes.value.data.slice(0, 2));
        }
        
        if (footballRes.status === 'fulfilled' && footballRes.value.status === 'success') {
          mixedSports.push(...footballRes.value.data.slice(0, 2));
        }
        
        // Remove duplicates based on _id
        const uniqueSports = mixedSports.filter((movie, index, arr) => {
          const movieId = (movie as any)._id || movie.movieId;
          return arr.findIndex((m) => {
            const mId = (m as any)._id || m.movieId;
            return mId === movieId;
          }) === index;
        });
        
        // Enhance with price info
        try {
          const enhancedSports = await enrichMoviesWithPriceInfo(uniqueSports.slice(0, 8));
          setSportsMovies(enhancedSports);
          console.log('🏃‍♂️ [Home] Sports movies loaded:', enhancedSports.length);
        } catch (enhanceError) {
          console.warn('Failed to enhance sports with price info:', enhanceError);
          setSportsMovies(uniqueSports.slice(0, 8));
        }
      }
    } catch (error) {
      console.error('Error loading sports movies:', error);
    }
  };

  // Banner interaction handlers (no notifications)
  const handleBannerSharePress = async (movieId: string) => {
    try {
      await shareMovie(movieId);
    } catch (error) {
      console.error('Error sharing movie:', error);
    }
  };

  const handleBannerFavoritePress = async (movieId: string) => {
    if (!isLoggedIn) {
      showLoginModal('Lưu phim yêu thích');
      return;
    }

    try {
      const currentFavoriteStatus = bannerFavorites[movieId] || false;
      const newFavoriteStatus = !currentFavoriteStatus;

      // Optimistically update UI
      setBannerFavorites(prev => ({ ...prev, [movieId]: newFavoriteStatus }));

      const result = await userInteractionService.toggleFavorite(movieId, newFavoriteStatus, userId!);
      
      if (result.status !== 'success') {
        // Revert on failure
        setBannerFavorites(prev => ({ ...prev, [movieId]: currentFavoriteStatus }));
      }
    } catch (error) {
      // Revert on error
      const currentFavoriteStatus = bannerFavorites[movieId] || false;
      setBannerFavorites(prev => ({ ...prev, [movieId]: currentFavoriteStatus }));
      console.error('Error toggling favorite:', error);
    }
  };

  const handleBannerLikePress = async (movieId: string) => {
    if (!isLoggedIn) {
      showLoginModal('Thích phim');
      return;
    }

    try {
      const currentLikeStatus = bannerLikes[movieId] || false;
      const newLikeStatus = !currentLikeStatus;

      // Optimistically update UI
      setBannerLikes(prev => ({ ...prev, [movieId]: newLikeStatus }));

      const result = await userInteractionService.toggleLike(movieId, newLikeStatus, userId!);
      
      if (result.status !== 'success') {
        // Revert on failure
        setBannerLikes(prev => ({ ...prev, [movieId]: currentLikeStatus }));
      }
    } catch (error) {
      // Revert on error
      const currentLikeStatus = bannerLikes[movieId] || false;
      setBannerLikes(prev => ({ ...prev, [movieId]: currentLikeStatus }));
      console.error('Error toggling like:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHomeData();
  };

  const getCategoryCode = (title: string): string => {
    // Chuẩn hóa title bằng cách loại bỏ dấu cách thừa và chuyển về chữ thường
    const normalizedTitle = title.trim().toLowerCase();
    
    switch (normalizedTitle) {
      case 'trending':
      case 'phim đang thịnh hành':
        return 'trending';
      case 'top rated':
      case 'phim được đánh giá cao':
        return 'toprated';
      case 'thể thao':
      case 'phim thể thao':
        return 'sports';
      case 'anime':
      case 'anime hot':
      case 'hoạt hình':
        return 'anime';
      case 'việt nam':
      case 'phim việt xuất sắc':
      case 'phim việt nam':
        return 'vietnamese';
      case 'sắp chiếu':
      case 'phim sắp chiếu':
        return 'comingsoon';
      case 'đề xuất cho bạn':
      case 'phim đề xuất':
        return 'recommended';
      default:
        console.log('Unknown category title:', title);
        return 'trending';
    }
  };

  const handleViewAll = (category: string, title: string) => {
    const categoryCode = getCategoryCode(title);
    console.log('Category code for title:', title, '->', categoryCode); // Thêm log để debug
    setSelectedCategory(categoryCode);
    setSelectedTitle(title);
    setViewAllModalVisible(true);
  };

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

  const handleGenrePress = (item: any) => {
    setSelectedCategory(item._id);
    setSelectedTitle(item.genre_name);
    setViewAllModalVisible(false);
    setGenreModalVisible(false);
  };

  const handleHomeGenreSelect = async (genre: any) => {
    try {
      setHomeGenreLoading(true);
      setHomeGenreSelected(genre._id);
      setHomeGenreTitle(genre.genre_name);
      
      // Gọi API để lấy phim theo thể loại
      const response = await genreService.getMoviesByGenre(genre._id, 1, 50, true);
      const movies = response.data.movies.map((movie: any) => ({
        movieId: movie._id,
        title: movie.movie_title,
        poster: movie.poster_path,
        producer: movie.producer || '',
        movieType: movie.movie_type || 'Phim lẻ',
        rating: movie.rating,
        year: movie.release_year
      }));
      
      setHomeGenreCustomMovies(movies);
      setHomeGenreViewAllVisible(true);
      setHomeGenreModalVisible(false);
    } catch (error) {
      console.error('Error fetching genre movies:', error);
      setHomeGenreCustomMovies([]);
      setHomeGenreViewAllVisible(true);
      setHomeGenreModalVisible(false);
    } finally {
      setHomeGenreLoading(false);
    }
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
                colors={['transparent', 'rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.99)', '#000']}
                style={styles.bannerOverlay}
                locations={[0, 0.5, 0.85, 1]}
              />
            </View>
          )}
        />
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle} numberOfLines={2}>
            {currentBannerMovie.title || 'Untitled'}
          </Text>
          <View style={styles.bannerButtons}>
            <TouchableOpacity 
              style={styles.playButton}
              onPress={() => router.push(`/movie/${currentBannerMovie.movieId}`)}
            >
              <Ionicons name="play" size={18} color="#fff" />
              <Text style={styles.playButtonText}>Xem ngay</Text>
            </TouchableOpacity>
            <View style={styles.actionIcons}>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => handleBannerLikePress(currentBannerMovie.movieId)}
              >
                <Ionicons 
                  name={bannerLikes[currentBannerMovie.movieId] ? "heart" : "heart-outline"} 
                  size={22} 
                  color={bannerLikes[currentBannerMovie.movieId] ? "#D11030" : "#fff"} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => handleBannerSharePress(currentBannerMovie.movieId)}
              >
                <Ionicons name="share-social-outline" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => handleBannerFavoritePress(currentBannerMovie.movieId)}
              >
                <Ionicons 
                  name={bannerFavorites[currentBannerMovie.movieId] ? "bookmark" : "bookmark-outline"} 
                  size={22} 
                  color={bannerFavorites[currentBannerMovie.movieId] ? "#ffc107" : "#fff"} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderMovieGrid = (movies: GridMovie[], title: string, category?: string) => {
    if (!movies.length) return null;

    // Check different section types
    const isRecommended = title.toLowerCase().includes('đề xuất');
    const isTrending = title.toLowerCase().includes('thịnh hành');
    const isSports = title.toLowerCase().includes('thể thao');
    const isAnime = title.toLowerCase().includes('anime');
    const isVietnamese = title.toLowerCase().includes('việt nam');

    if (isRecommended) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <TouchableOpacity onPress={() => handleViewAll(category || 'recommended', title)}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={movies.slice(0, 4)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `${category}-${item.movieId}-${index}`}
            contentContainerStyle={styles.largeMovieList}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.largeMovieItem}
                onPress={() => router.push(`/movie/${item.movieId}`)}
              >
                <View style={styles.largeMovieContainer}>
                  <Image source={{ uri: item.poster }} style={styles.largeMoviePoster} resizeMode="cover" />
                  
                  {/* Paid Badge for Recommended */}
                  {shouldShowPaidBadge(item) && (
                    <View style={styles.largePaidBadge}>
                      <Ionicons name="card" size={9} color="#fff" />
                      <Text style={styles.largePaidText}>Trả phí</Text>
                    </View>
                  )}
                  
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.largeMovieGradient}
                  >
                    <Text style={styles.largeMovieTitle} numberOfLines={2}>{item.title}</Text>
                  </LinearGradient>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      );
    }

    if (isTrending) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <TouchableOpacity onPress={() => handleViewAll(category || 'trending', title)}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={movies.slice(0, 6)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `${category}-${item.movieId}-${index}`}
            contentContainerStyle={styles.trendingList}
            renderItem={({ item, index }) => (
              <TouchableOpacity 
                style={[
                  styles.trendingItem,
                  { transform: [{ translateY: index % 2 === 0 ? 30 : 0 }] }
                ]}
                onPress={() => router.push(`/movie/${item.movieId}`)}
              >
                <View style={styles.trendingRank}>
                  <Text style={styles.trendingRankText}>{index + 1}</Text>
                </View>
                <View style={styles.trendingPosterContainer}>
                  <Image source={{ uri: item.poster }} style={styles.trendingPoster} resizeMode="cover" />
                  
                  {/* Paid Badge for Trending */}
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
          />
        </View>
      );
    }

    if (isSports) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <TouchableOpacity onPress={() => handleViewAll(category || 'sports', title)}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={movies.slice(0, 6)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `${category}-${item.movieId}-${index}`}
            contentContainerStyle={styles.sportsList}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.sportsItem}
                onPress={() => router.push(`/movie/${item.movieId}`)}
              >
                <View style={styles.sportsPosterContainer}>
                  <Image source={{ uri: item.poster }} style={styles.sportsPoster} resizeMode="cover" />
                  
                  {/* Paid Badge for Sports */}
                  {shouldShowPaidBadge(item) && (
                    <View style={styles.sportsPaidBadge}>
                      <Ionicons name="card" size={8} color="#fff" />
                      <Text style={styles.sportsPaidText}>Trả phí</Text>
                    </View>
                  )}
                  
                  <View style={styles.sportsOverlay}>
                    <LinearGradient
                      colors={['transparent', '#000']}
                      style={styles.sportsGradient}
                    />
                    <View style={styles.sportsContent}>
                      <Text style={styles.sportsTitle} numberOfLines={2}>{item.title}</Text>
                      <View style={styles.sportsBadge}>
                        <Text style={styles.sportsBadgeText}>SPORTS</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      );
    }

    if (isAnime) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <TouchableOpacity onPress={() => handleViewAll(category || 'anime', title)}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={movies.slice(0, 6)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `${category}-${item.movieId}-${index}`}
            contentContainerStyle={styles.animeList}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.animeItem}
                onPress={() => router.push(`/movie/${item.movieId}`)}
              >
                <View style={styles.animeImageContainer}>
                  <Image source={{ uri: item.poster }} style={styles.animePoster} resizeMode="cover" />
                  
                  {/* Paid Badge for Anime */}
                  {shouldShowPaidBadge(item) && (
                    <View style={styles.animePaidBadge}>
                      <Ionicons name="card" size={8} color="#fff" />
                      <Text style={styles.animePaidText}>Trả phí</Text>
                    </View>
                  )}
                  
                  <View style={styles.animeShine} />
                </View>
                <Text style={styles.animeTitle} numberOfLines={2}>{item.title}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      );
    }

    if (isVietnamese) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <TouchableOpacity onPress={() => handleViewAll(category || 'vietnamese', title)}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={movies.slice(0, 6)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `${category}-${item.movieId}-${index}`}
            contentContainerStyle={styles.vietnameseList}
            renderItem={({ item, index }) => (
              <TouchableOpacity 
                style={[
                  styles.vietnameseItem,
                  { transform: [{ translateY: index % 2 === 0 ? -15 : 15 }] }
                ]}
                onPress={() => router.push(`/movie/${item.movieId}`)}
              >
                <View style={styles.vietnameseStack}>
                  {/* Background Card */}
                  <View style={[styles.vietnameseCard, styles.vietnameseCardBack]} />
                  {/* Middle Card */}
                  <View style={[styles.vietnameseCard, styles.vietnameseCardMiddle]} />
                  {/* Front Card with Content */}
                  <View style={[styles.vietnameseCard, styles.vietnameseCardFront]}>
                    <Image source={{ uri: item.poster }} style={styles.vietnamesePoster} resizeMode="cover" />
                    
                    {/* Paid Badge for Vietnamese */}
                    {shouldShowPaidBadge(item) && (
                      <View style={styles.vietnamesePaidBadge}>
                        <Ionicons name="card" size={8} color="#fff" />
                        <Text style={styles.vietnamesePaidText}>Trả phí</Text>
                      </View>
                    )}
                    
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.9)']}
                      style={styles.vietnameseGradient}
                    >
                      <Text style={styles.vietnameseTitle} numberOfLines={2}>{item.title}</Text>
                    </LinearGradient>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      );
    }

    // Original layout for other sections
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <TouchableOpacity onPress={() => handleViewAll(category || 'recommended', title)}>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={movies.slice(0, 6)}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => `${category}-${item.movieId}-${index}`}
          contentContainerStyle={styles.movieList}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.movieItem}
              onPress={() => router.push(`/movie/${item.movieId}`)}
            >
              <View style={styles.posterContainer}>
                <Image source={{ uri: item.poster }} style={styles.moviePoster} resizeMode="cover" />
                
                {/* Paid Badge */}
                {shouldShowPaidBadge(item) && (
                  <View style={styles.paidBadge}>
                    <Ionicons name="card" size={8} color="#fff" />
                    <Text style={styles.paidText}>Trả phí</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  const handleContinueWatchingPress = (movieId: string, hasRentalAccess?: boolean) => {
    console.log('🎬 [Home] Continue watching item pressed:', { movieId, hasRentalAccess });
    router.push({
      pathname: '/movie/[id]',
      params: {
        id: movieId,
        fromContinueWatching: 'true',
        autoPlay: 'true',
        hasRentalAccess: hasRentalAccess ? 'true' : 'false'
      }
    });
  };

  const renderContinueWatching = () => {
    return (
      <ContinueWatchingSection
        data={continueWatching}
        onViewAll={() => handleViewAll('continue-watching', 'Tiếp tục xem')}
        onItemPress={handleContinueWatchingPress}
        loading={loading}
        error={null}
      />
    );
  };

  const renderSportsSection = () => {
    if (!sportsMovies || sportsMovies.length === 0) return null;

    return (
      <View style={styles.sportsSection}>
        {/* Premium Sports Header */}
        <LinearGradient
          colors={['#FF6B35', '#FF8C42', '#FFA54C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sportsHeaderGradient}
        >
          <View style={styles.sportsHeaderContent}>
            <View style={styles.sportsHeaderLeft}>
              <View style={styles.sportsIconContainer}>
                <Ionicons name="trophy" size={28} color="#FFF" />
              </View>
              <View style={styles.sportsTitleContainer}>
                <Text style={styles.sportsSectionTitle} numberOfLines={1}>Thể Thao Đặc Sắc</Text>
                <Text style={styles.sportsSubtitle} numberOfLines={1}>Trận đấu kịch tính nhất</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.sportsViewAllButton}
              onPress={() => router.push('/sports')}
              activeOpacity={0.8}
            >
              <Text style={styles.sportsViewAllText}>Tất cả</Text>
              <Ionicons name="chevron-forward" size={12} color="#FFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Sports Movies Grid */}
        <FlatList
          data={sportsMovies}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => {
            const movieId = (item as any)._id || item.movieId;
            return `sports-home-${movieId || index}-${index}`;
          }}
          contentContainerStyle={styles.sportsMoviesList}
          renderItem={({ item, index }) => (
            <TouchableOpacity 
              style={[styles.sportsMovieItem, index === 0 && styles.firstSportsItem]}
              onPress={() => {
                const movieId = (item as any)._id || item.movieId;
                router.push(`/movie/${movieId}`);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.sportsMovieContainer}>
                {/* Sports Category Badge */}
                <View style={styles.sportsCategoryBadge}>
                  <Ionicons 
                    name={index < 4 ? "basketball" : index < 6 ? "american-football" : "football"} 
                    size={12} 
                    color="#FF6B35" 
                  />
                  <Text style={styles.sportsCategoryText}>
                    {index < 4 ? "SPORTS" : index < 6 ? "NBA" : "FOOTBALL"}
                  </Text>
                </View>

                <Image 
                  source={{ uri: (item as any).poster_path || item.poster }} 
                  style={styles.sportsMoviePoster} 
                  resizeMode="cover" 
                />
                
                {/* Paid Badge */}
                {shouldShowPaidBadge(item) && (
                  <View style={styles.sportsPaidBadge}>
                    <Ionicons name="card" size={8} color="#fff" />
                    <Text style={styles.sportsPaidText}>Trả phí</Text>
                  </View>
                )}

                {/* Premium Gradient Overlay */}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
                  style={styles.sportsMovieOverlay}
                >
                  <View style={styles.sportsMovieInfo}>
                    <Text style={styles.sportsMovieTitle} numberOfLines={2}>
                      {(item as any).movie_title || item.title}
                    </Text>
                    {item.producer && (
                      <Text style={styles.sportsMovieProducer} numberOfLines={1}>
                        {item.producer}
                      </Text>
                    )}
                    
                    {/* Live Indicator */}
                    <View style={styles.liveIndicator}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>HIGHLIGHTS</Text>
                    </View>
                  </View>
                </LinearGradient>

                {/* Premium Border */}
                <View style={styles.premiumBorder} />
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  /**
   * Hàm xử lý tìm kiếm phim
   * @param resetPage - True nếu muốn reset về trang 1
   */
  // Search functionality - will be implemented when search feature is active
  // const handleSearch = async (resetPage = true) => {
  //   console.log('Search functionality placeholder:', { searchQuery, resetPage });
  //   // Prevent unused variable warnings by using the state setters
  //   setSearchPage(1);
  //   setSearchResults([]);
  //   setHasMoreResults(true);
  //   setIsLoadingMore(false);
  // };

  /**
   * Xử lý load thêm kết quả khi scroll đến cuối
   */
  // Load more functionality - will be implemented when search is active
  // const handleLoadMore = () => {
  //   if (!isLoadingMore && hasMoreResults) {
  //     handleSearch(false);
  //   }
  // };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E50914" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        
        <TabHeader
          title=""
          showLogo
          onSearchPress={() => setSearchModalVisible(true)}
          onNotificationPress={() => router.push('/notifications')}
          showGenreSelector
          genres={genres}
          onGenreSelect={handleHomeGenreSelect}
          opacity={headerOpacity}
        />
        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
          }
        >
          {renderBanner()}

          {isLoggedIn && renderContinueWatching()}
          {renderMovieGrid(recommendedMovies, 'Đề xuất cho bạn', 'recommended')}
          {/* Action Genre Section */}
          {actionGenre && actionGenreMovies.length > 0 && (
            <View style={styles.actionGenreSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🔥 {actionGenre.genre_name}</Text>
                <TouchableOpacity 
                  onPress={() => router.push(`/genre/${actionGenre._id}`)}
                  style={styles.seeAllButton}
                >
                  <Text style={styles.seeAllText}>Xem tất cả</Text>
                  <Ionicons name="chevron-forward" size={16} color="#B0B0B0" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={actionGenreMovies}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => `action-${item.movieId || index}-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.actionMovieItem}
                    onPress={() => router.push(`/movie/${item.movieId}`)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.actionMovieContainer}>
                      <Image source={{ uri: item.poster }} style={styles.actionMoviePoster} resizeMode="cover" />
                      
                      {/* Paid Badge for Action Movies */}
                      {shouldShowPaidBadge(item) && (
                        <View style={styles.actionPaidBadge}>
                          <Ionicons name="card" size={8} color="#fff" />
                          <Text style={styles.actionPaidText}>Trả phí</Text>
                        </View>
                      )}
                      
                      <View style={styles.actionMovieInfo}>
                        <Text style={styles.actionMovieTitle} numberOfLines={2}>{item.title}</Text>
                        {item.rating && (
                          <View style={styles.actionMovieRating}>
                            <Ionicons name="star" size={12} color="#FFD700" />
                            <Text style={styles.actionMovieRatingText}>{item.rating.toFixed(1)}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.actionMovieList}
              />
            </View>
          )}

          {sections.map((section, index) => (
            <View key={index}>
              {renderMovieGrid(section.movies, section.title, getCategoryFromTitle(section.title))}
            </View>
          ))}

          {/* Premium Sports Section - Professional & Modern */}
          {renderSportsSection()}
        </Animated.ScrollView>
        <SearchModal
          visible={searchModalVisible}
          onClose={() => setSearchModalVisible(false)}
        />
        <ViewAllModal
          visible={viewAllModalVisible}
          onClose={() => setViewAllModalVisible(false)}
          category={selectedCategory}
          title={selectedTitle}
        />
        <ViewAllModal
          visible={homeGenreViewAllVisible}
          onClose={() => setHomeGenreViewAllVisible(false)}
          category={homeGenreSelected}
          title={homeGenreTitle}
          customMovies={homeGenreCustomMovies || []}
        />
        {homeGenreLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Đang tải phim...</Text>
          </View>
        )}
        
        {/* Login Required Modal */}
        <LoginRequiredModal
          visible={loginModalVisible}
          onClose={hideLoginModal}
          featureName={currentFeatureName || undefined}
        />

        {/* Logout Notification */}
        {showLogoutNotification && (
          <View style={styles.logoutNotification}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.logoutNotificationText}>Đã đăng xuất thành công</Text>
          </View>
        )}
      </View>
    );
  };

  return renderContent();
}

// Helper function to get category from title
function getCategoryFromTitle(title: string): string {
  switch (title.toLowerCase()) {
    case 'trending':
      return 'trending';
    case 'top rated':
      return 'toprated';
    case 'thể thao':
      return 'sports';
    case 'anime':
      return 'anime';
    case 'việt nam':
      return 'vietnamese';
    case 'sắp chiếu':
      return 'comingsoon';
    default:
      return 'recommended';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  logoImage: {
    width: 160,
    height: 70,
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
    position: 'relative',
    zIndex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  bannerContainer: {
    height: 570,
    position: 'relative',
   
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  bannerIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 5,
  },
  activeIndicator: {
    backgroundColor: '#E50914',
    width: 14,
    height: 14,
  },
  headerBar: {
    position: 'absolute',
    top: 40, 
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
    alignItems: 'flex-start',
    zIndex: 2,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '800',
    
    marginHorizontal: 20,
    textAlign: 'left',
    lineHeight: 32,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  bannerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingHorizontal: 20,
    width: '100%',
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginLeft: 40,
    marginRight: 10,
  },
  iconButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
   
  },
  playButton: {
    backgroundColor: '#D11030',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 140,
    justifyContent: 'center',
    shadowColor: '#D11030',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    backdropFilter: 'blur(10px)',
  },
  moreButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
 section: {
  
    marginTop: 32, // Khoảng cách trên các section phim
  },
  sectionHeader: {
    
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 10, 
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
  movieList: {
    paddingRight: 20,
    paddingLeft: 5, 
  },
  movieItem: {
    width: 140,
    marginRight: 12,
  },
  posterContainer: {
    position: 'relative',
  },
  moviePoster: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    backgroundColor: '#222',
  },
  paidBadge: {
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
  paidText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 2,
  },

  lastSection: {
    paddingHorizontal: 20,
    marginTop: 32,
    marginBottom: 32, 
  },
  paginationDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
    gap: 6,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginHorizontal: 4,
  },

  // Styles cho modal search
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    padding: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginLeft: 16,
    color: '#FFF',
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
    marginLeft: 8,
  },
  searchResults: {
    padding: 16,
  },
  searchResultItem: {
    flex: 1,
    margin: 4,
    maxWidth: `${100 / 3}%`,
  },
  searchResultPoster: {
    width: '100%',
    aspectRatio: 2/3,
    borderRadius: 8,
    backgroundColor: '#222',
  },
  searchResultTitle: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyResults: {
    padding: 32,
    alignItems: 'center',
  },
  emptyResultsText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingMore: {
    padding: 16,
  },
  // Large Movie Layout Styles (only for recommended section)
  largeMovieList: {
    paddingHorizontal: 10,
  },
  largeMovieItem: {
    width: width * 0.7,
    height: 260,
    marginRight: 15,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  largeMoviePoster: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  largeMovieGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    padding: 15,
  },
  largeMovieTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Wide Movie Layout Styles
  wideMovieList: {
    paddingHorizontal: 10,
  },
  wideMovieItem: {
    width: width * 0.8,
    height: 140,
    marginRight: 15,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  wideMoviePoster: {
    width: 100,
    height: '100%',
  },
  wideMovieInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  wideMovieTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  wideMovieMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wideMovieYear: {
    color: '#B0B0B0',
    fontSize: 14,
    marginRight: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Grid Movie Layout Styles
  gridSection: {
    paddingHorizontal: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  gridMovieItem: {
    width: '31%',
    marginBottom: 15,
  },
  gridMovieItemMiddle: {
    marginHorizontal: '3.5%',
  },
  gridMoviePoster: {
    width: '100%',
    aspectRatio: 2/3,
    borderRadius: 8,
    backgroundColor: '#222',
  },
  gridMovieTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },

  // Trending Movie Layout Styles
  trendingList: {
    paddingHorizontal: 15,
    paddingVertical: 25,
    height: 310,
  },
  trendingItem: {
  
    width: width * 0.35,
    height: 240,
    marginRight: 15,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  trendingPoster: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  trendingGradient: {
   
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    justifyContent: 'flex-end',
    padding: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  trendingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    textAlign: 'center',
  },
  trendingRank: {
    position: 'absolute',
    top: 15,
    left: 15,
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: 'rgba(229, 9, 20, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  trendingRankText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },

  // Sports Movies Layout
  sportsList: {
    paddingHorizontal: 10,
  },
  sportsItem: {
    width: width * 0.6,
    height: 200,
    marginRight: 15,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  sportsPoster: {
    width: '100%',
    height: '100%',
  },
  sportsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  sportsGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  sportsContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
  },
  sportsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  sportsBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  sportsBadgeText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },

  // Anime Movies Layout
  animeList: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  animeItem: {
    width: width * 0.33,
    marginRight: 15,
  },
  animeImageContainer: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#D11030',
    aspectRatio: 3/4,
  },
  animePoster: {
    width: '100%',
    height: '100%',
  },
  animeShine: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 50,
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ rotate: '45deg' }],
  },
  animeTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },

  // Vietnamese Movies Layout - Updated
  vietnameseList: {
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  vietnameseItem: {
    width: width * 0.4,
    marginRight: 20,
  },
  vietnameseStack: {
    position: 'relative',
    height: 280,
    alignItems: 'center',
  },
  vietnameseCard: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  vietnameseCardBack: {
    backgroundColor: '#E50914',
    transform: [{ scale: 0.85 }, { translateY: 10 }],
    opacity: 0.3,
  },
  vietnameseCardMiddle: {
    backgroundColor: '#E50914',
    transform: [{ scale: 0.92 }, { translateY: 5 }],
    opacity: 0.5,
  },
  vietnameseCardFront: {
    backgroundColor: '#1A1A1A',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  vietnamesePoster: {
    width: '100%',
    height: '100%',
  },
  vietnameseGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    padding: 15,
    justifyContent: 'flex-end',
  },
  vietnameseTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  genreSelectorContainer: {
    marginBottom: 10,
  },
  genreSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    elevation: 4,
    alignSelf: 'flex-start',
  },
  genreSelectorIcon: {
    marginRight: 6,
  },
  genreSelectorText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
    marginRight: 4,
  },
  genreSelectorArrow: {
    marginLeft: 2,
  },
  actionGenreSection: {
    marginTop: 32,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionMovieItem: {
    width: width * 0.33,
    height: 260,
    marginRight: 15,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  actionMoviePoster: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  actionMovieInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  actionMovieTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  actionMovieRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionMovieRatingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  actionMovieList: {
    paddingHorizontal: 10,
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

  // Badge styles for different sections
  // Large movie (recommended) section
  largeMovieContainer: {
    position: 'relative',
    flex: 1,
  },
  largePaidBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(229, 9, 20, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  largePaidText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },

  // Trending section
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

  // Sports section
  sportsPosterContainer: {
    position: 'relative',
    flex: 1,
  },
  sportsPaidBadge: {
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
  sportsPaidText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 2,
  },

  // Anime section
  animePaidBadge: {
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
  animePaidText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 2,
  },

  // Vietnamese section
  vietnamesePaidBadge: {
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
  vietnamesePaidText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 2,
  },

  // Action movies section
  actionMovieContainer: {
    position: 'relative',
    flex: 1,
  },
  actionPaidBadge: {
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
  actionPaidText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 2,
  },

  // Premium Sports Section Styles
  sportsSection: {
    marginTop: 32,
    marginBottom: 24,
  },
  sportsHeaderGradient: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sportsHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  sportsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0, // Ensures proper text truncation if needed
  },
  sportsIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  sportsTitleContainer: {
    flex: 1,
    minWidth: 0, // Ensures proper text truncation if needed
  },
  sportsSectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sportsSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  sportsViewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sportsViewAllText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 3,
  },
  sportsMoviesList: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sportsMovieItem: {
    marginRight: 16,
  },
  firstSportsItem: {
    marginLeft: 0,
  },
  sportsMovieContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  sportsCategoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    zIndex: 3,
    elevation: 3,
  },
  sportsCategoryText: {
    color: '#FF6B35',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  sportsMoviePoster: {
    width: 160,
    height: 240,
  },
  sportsMovieOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    padding: 16,
  },
  sportsMovieInfo: {
    alignItems: 'flex-start',
  },
  sportsMovieTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  sportsMovieProducer: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
    marginRight: 6,
  },
  liveText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  premiumBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#FF6B35',
  },
  logoutNotification: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  logoutNotificationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});