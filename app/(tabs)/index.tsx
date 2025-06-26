import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState, useRef } from 'react';
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
} from 'react-native';
// SafeAreaView imported but not used - will be used in future updates
import { LinearGradient } from 'expo-linear-gradient';
import { movieService } from '../../services/movieService';
import { animeService } from '../../services/animeService';
import { seriesService } from '../../services/seriesService';
import { useAppSelector } from '../../store/hooks';
import { BannerMovie, ContinueWatchingItem, GridMovie } from '../../types/movie';
import { useRouter } from 'expo-router';
import { TabHeader, SearchModal, ViewAllModal } from '../../components/ui';
import GenreGrid from '../../components/genre/GenreGrid';

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
  }, [userId]); // loadHomeData is defined below, will be memoized in future optimization

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
          animeService.getAllAnime({ showAll: false }),
          seriesService.getVietnameseSeries({ limit: 8 }),
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
    setViewAllModalVisible(true);
    setGenreModalVisible(false);
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
              <Ionicons name="play" size={16} color="#fff" />
              <Text style={styles.playButtonText}>Xem ngay</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.moreButton}
              onPress={() => router.push(`/movie/${currentBannerMovie.movieId}`)}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.moreButtonText}>Xem thêm</Text>
            </TouchableOpacity>
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
                <Image source={{ uri: item.poster }} style={styles.largeMoviePoster} resizeMode="cover" />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.largeMovieGradient}
                >
                  <Text style={styles.largeMovieTitle} numberOfLines={2}>{item.title}</Text>
                </LinearGradient>
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
                <Image source={{ uri: item.poster }} style={styles.trendingPoster} resizeMode="cover" />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.9)']}
                  style={styles.trendingGradient}
                >
                  <Text style={styles.trendingTitle} numberOfLines={2}>{item.title}</Text>
                </LinearGradient>
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
                <Image source={{ uri: item.poster }} style={styles.sportsPoster} resizeMode="cover" />
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
              <Image source={{ uri: item.poster }} style={styles.moviePoster} resizeMode="cover" />
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  const renderContinueWatching = () => {
    if (!continueWatching || continueWatching.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Đang xem</Text>
          <TouchableOpacity onPress={() => handleViewAll('continue', 'Đang xem')}>
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
            <TouchableOpacity 
              style={styles.continueItem}
              onPress={() => router.push(`/movie/${item.movieId}`)}
            >
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
        <TabHeader
          onSearchPress={() => setSearchModalVisible(true)}
          onNotificationPress={() => {}}
          opacity={headerOpacity}
        />
        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
          }>
          {renderBanner()}
          {/* Genre selector button below banner */}
          <View style={styles.genreSelectorContainer}>
            <TouchableOpacity
              style={styles.genreSelectorButton}
              onPress={() => setGenreModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="grid-outline" size={18} color="#FFF" style={styles.genreSelectorIcon} />
              <Text style={styles.genreSelectorText}>Thể loại</Text>
              <Ionicons name="chevron-up" size={16} color="#FFF" style={styles.genreSelectorArrow} />
            </TouchableOpacity>
          </View>
          {renderContinueWatching()}
          {renderMovieGrid(recommendedMovies, 'Đề xuất cho bạn', 'recommended')}
          {sections.map((section, index) => (
            <View key={index}>
              {renderMovieGrid(section.movies, section.title, getCategoryFromTitle(section.title))}
            </View>
          ))}
        </Animated.ScrollView>
        {/* Modal hiển thị genres dạng lưới */}
        <Modal
          visible={genreModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setGenreModalVisible(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.96)',
            justifyContent: 'flex-start',
            paddingTop: 60,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 }}>
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>Thể loại</Text>
              <TouchableOpacity onPress={() => setGenreModalVisible(false)}>
                <Ionicons name="close" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
            <GenreGrid
              genres={genres}
              onGenrePress={item => {
                setSelectedCategory(item._id);
                setSelectedTitle(item.genre_name);
                setViewAllModalVisible(true);
                setGenreModalVisible(false);
              }}
            />
          </View>
        </Modal>
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
  // Test Movie Detail Button
  testMovieButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 10,
  },
  testMovieButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  testLoginButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 5,
  },
  testLoginButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
  moviePoster: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    backgroundColor: '#222',
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
  continueList: {
    paddingRight: 20,
  },
  continueItem: {
    width: 130,
    marginRight: 12,
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
  
    paddingHorizontal: 10,
    paddingVertical: 20,
    height:310,
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
    top: 10,
    left: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
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
    fontSize: 16,
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
});