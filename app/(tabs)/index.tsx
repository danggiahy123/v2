import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { movieService } from '../../services/movieService';
import { useAppSelector } from '../../store/hooks';
import { BannerMovie, ContinueWatchingItem, GridMovie } from '../../types/movie';
import { TabHeader } from '../../components/ui';
import { useOptimizedScrollAnimation } from '../../hooks';


const { width } = Dimensions.get('window');

interface MovieSection {
  title: string;
  movies: GridMovie[];
}

// MEMOIZED COMPONENTS - Tối ưu re-render
const BannerItem = memo(({ item, width }: { item: BannerMovie; width: number }) => (
  <View style={{ width: width, height: '100%' }}>
    {/* MOVIE POSTER IMAGE */}
    <Image
      source={{ uri: item.poster }}
      style={styles.bannerImage}
      resizeMode="cover"
      onError={() => console.log('Banner image load error')}
    />
    {/* GRADIENT OVERLAY - để text dễ đọc */}
    <LinearGradient

      colors={['transparent', 'rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.99)', '#000']}
      style={styles.bannerOverlay}
      locations={[0, 0.5, 0.85, 1]}
    />
  </View>
));
BannerItem.displayName = 'BannerItem';

const MovieItem = memo(({ item }: { item: GridMovie }) => (
  <TouchableOpacity style={styles.movieItem}>
    {/* MOVIE POSTER */}
    <Image
      source={{ uri: item.poster }}
      style={styles.moviePoster}
      resizeMode="cover"
    />
  </TouchableOpacity>
));
MovieItem.displayName = 'MovieItem';

const ContinueItem = memo(({ item }: { item: ContinueWatchingItem }) => (
  <TouchableOpacity style={styles.continueItem}>
    {/* MOVIE POSTER */}
    <Image
      source={{ uri: item.poster }}
      style={styles.continuePoster}
      resizeMode="cover"
      onError={() => console.log('Continue watching poster load error')}
    />

    {/* PROGRESS BAR - Hiển thị % đã xem */}
    <View style={styles.progressBar}>
      <View
        style={[
          styles.progressFill,
          {
            // Tính toán width dựa trên progress (0-1) -> (0-100%)
            // Đảm bảo giá trị trong khoảng 0-100%
            width: `${Math.min(Math.max(item.progress * 100, 0), 100)}%`
          },
        ]}
      />
    </View>
  </TouchableOpacity>
));
ContinueItem.displayName = 'ContinueItem';

export default function HomeScreen() {
  const authState = useAppSelector((state) => state.auth);
  const { userId } = authState || { userId: null };

  const [bannerMovies, setBannerMovies] = useState<BannerMovie[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<GridMovie[]>([]);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
  const [sections, setSections] = useState<MovieSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const bannerFlatListRef = useRef<FlatList>(null);

  // MEMOIZED RENDER FUNCTIONS - Tối ưu performance
  const renderBannerItem = useCallback(({ item }: { item: BannerMovie }) => (
    <BannerItem item={item} width={width} />
  ), []);

  const renderMovieItem = useCallback(({ item }: { item: GridMovie }) => (
    <MovieItem item={item} />
  ), []);

  const renderContinueItem = useCallback(({ item }: { item: ContinueWatchingItem }) => (
    <ContinueItem item={item} />
  ), []);

  // SCROLL HEADER ANIMATION - Single optimized hook
  const {
    headerOpacity,
    headerTranslateY,
    onScroll: onScrollWithAnimation,
  } = useOptimizedScrollAnimation({
    preset: 'default',    // 'default' | 'instant' | 'smooth' | 'aggressive'
    // Custom overrides (optional):
    hideDelay: 50,        // Fast hide: kéo xuống là mất ngay
    showDelay: 0,         // Immediate show: kéo lên là hiện ngay
  });

  // TABHEADER HANDLERS - Memoized để tối ưu performance
  // useCallback ngăn re-render TabHeader khi HomeScreen re-render
  // Dependencies array rỗng vì không phụ thuộc external values
  const handleSearch = useCallback(() => {
    console.log('🔍 Search pressed - TODO: Implement search functionality');
    // TODO: Navigate to search screen or open search modal
    // router.push('/search');
  }, []);

  const handleNotification = useCallback(() => {
    console.log('🔔 Notification pressed - TODO: Implement notifications');
    // TODO: Navigate to notifications screen or show notification panel
    // router.push('/notifications');
  }, []);

  useEffect(() => {
    loadHomeData();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  /**
   * CHỨC NĂNG: Tải dữ liệu trang chủ
   * MÔ TẢ: Function chính để load tất cả dữ liệu movie cho home screen
   * BAO GỒM:
   * - Banner movies (phim nổi bật cho slideshow)
   * - Recommended movies (phim đề xuất)
   * - Continue watching (phim đang xem - chỉ khi user đã login)
   * - Movie sections (các danh mục: trending, top rated, thể thao, anime, việt nam, sắp chiếu)
   */
  const loadHomeData = async () => {
    try {
      setLoading(true);

      // MOVIE API 1: Lấy phim mới phát hành + banner
      // Trả về: banner movies (5 phim) + recommended movies (6 phim)
      try {
        const newReleasesRes = await movieService.getNewReleases({
          bannerLimit: 5,    // Số lượng phim cho banner slideshow
          limit: 6,          // Số lượng phim đề xuất
          days: 30,          // Phim trong vòng 30 ngày qua
        });

        if (newReleasesRes?.status === 'success' && newReleasesRes.data) {
          setBannerMovies(newReleasesRes.data.banner?.movies || []);           // Set banner movies
          setRecommendedMovies(newReleasesRes.data.recommended?.movies || []); // Set recommended movies
        }
      } catch (error) {
        console.error('Error loading new releases:', error);
      }

      // MOVIE API 2: Lấy danh sách phim đang xem (chỉ khi user đã đăng nhập)
      // Trả về: danh sách phim với progress xem
      if (userId) {
        try {
          const continueRes = await movieService.getContinueWatching(userId, 6);
          if (continueRes?.status === 'success' && continueRes.data) {
            setContinueWatching(continueRes.data.data || []); // Set continue watching list
          }
        } catch (error) {
          console.error('Error loading continue watching:', error);
        }
      }

      // MOVIE API 3-8: Lấy các danh mục phim khác nhau
      // Sử dụng Promise.allSettled để gọi song song 6 API
      try {
        const sectionCalls = await Promise.allSettled([
          movieService.getTrending(8),                                    // API: Phim trending
          movieService.getTopRated(8),                                   // API: Phim đánh giá cao
          movieService.getSports({ limit: 8, status: 'released' }),      // API: Phim thể thao
          movieService.getAnime(8),                                      // API: Anime
          movieService.getVietnamese(8),                                 // API: Phim Việt Nam
          movieService.getComingSoon({ limit: 8, days: 30 }),           // API: Phim sắp chiếu
        ]);

        // Mapping titles cho các section
        const titles = ['Trending', 'Top Rated', 'Thể thao', 'Anime', 'Việt Nam', 'Sắp chiếu'];

        // Xử lý kết quả từ các API calls
        // Chỉ lấy những section có data và thành công
        const builtSections: MovieSection[] = sectionCalls
          .map((res, idx) => {
            if (
              res.status === 'fulfilled' &&           // API call thành công
              res.value?.status === 'success' &&      // Response status OK
              res.value.data?.movies?.length > 0      // Có data movies
            ) {
              return {
                title: res.value.data.title || titles[idx],  // Sử dụng title từ API hoặc fallback
                movies: res.value.data.movies,               // Danh sách movies
              };
            }
            return null; // Bỏ qua section không có data
          })
          .filter((section): section is MovieSection => section !== null); // Lọc bỏ null values

        setSections(builtSections); // Set movie sections
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



  /**
   * CHỨC NĂNG: Render Banner Slideshow
   * MÔ TẢ: Hiển thị banner carousel với các phim nổi bật
   * TÍNH NĂNG:
   * - Auto-scroll mỗi 5 giây (được set ở useEffect)
   * - Horizontal swipe navigation
   * - Indicators hiển thị vị trí hiện tại
   * - Header với logo và search button
   * - Movie title và action buttons (Xem ngay, Xem thêm)
   * - Gradient overlay để text dễ đọc
   */
  const renderBanner = () => {
    // Kiểm tra có banner movies không
    if (!bannerMovies.length) return null;

    // Đảm bảo index không vượt quá array length
    const safeIndex = Math.min(currentBannerIndex, bannerMovies.length - 1);
    const currentBannerMovie = bannerMovies[safeIndex];

    // Kiểm tra movie hiện tại có tồn tại không
    if (!currentBannerMovie) return null;

    return (
      <View style={styles.bannerContainer}>
        {/* BANNER SLIDESHOW - FlatList horizontal với auto-scroll */}
        <FlatList
          ref={bannerFlatListRef}
          data={bannerMovies}                    // Data: danh sách banner movies
          horizontal                            // Scroll ngang
          pagingEnabled                         // Snap to page
          showsHorizontalScrollIndicator={false} // Ẩn scroll indicator
          keyExtractor={(item, index) => item.movieId || `banner-${index}`}
          // PERFORMANCE OPTIMIZATION - Tối ưu hiệu suất
          getItemLayout={(data, index) => ({
            length: width,                       // Chiều rộng mỗi item = screen width
            offset: width * index,               // Vị trí offset = width * index
            index,
          })}
          initialNumToRender={2}                 // Render 2 item đầu tiên
          maxToRenderPerBatch={3}                // Render tối đa 3 item mỗi batch
          windowSize={5}                         // Window size = 5 (2.5 screens each side)
          removeClippedSubviews={true}           // Remove items ngoài viewport
          updateCellsBatchingPeriod={100}        // Update cells mỗi 100ms
          onScrollToIndexFailed={() => {
            console.log('Scroll to index failed');
          }}
          // Xử lý khi user scroll manual - update current index
          onScroll={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            if (index >= 0 && index < bannerMovies.length) {
              setCurrentBannerIndex(index);
            }
          }}
          // Render từng banner item với memoized component
          renderItem={renderBannerItem}
        />

        {/* TABHEADER đã được move ra ngoài để có animation toàn màn hình */}

        {/* BANNER INDICATORS - Dots hiển thị vị trí hiện tại */}
        <View style={styles.bannerIndicators}>
          {bannerMovies.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,                                           // Style cơ bản
                index === currentBannerIndex && styles.activeIndicator,    // Style khi active
              ]}
            />
          ))}
        </View>

        {/* BANNER CONTENT - Movie title và action buttons */}
        <View style={styles.bannerContent}>
          {/* MOVIE TITLE */}
          <Text style={styles.bannerTitle} numberOfLines={2}>
            {currentBannerMovie.title || 'Untitled'}
          </Text>

          {/* ACTION BUTTONS */}
          <View style={styles.bannerButtons}>
            {/* PLAY BUTTON - Xem ngay */}
            <TouchableOpacity style={styles.playButton}>
              <Ionicons name="play" size={16} color="#fff" />
              <Text style={styles.playButtonText}>Xem ngay</Text>
            </TouchableOpacity>

            {/* MORE BUTTON - Xem thêm thông tin */}
            <TouchableOpacity style={styles.moreButton}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.moreButtonText}>Xem thêm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  /**
   * CHỨC NĂNG: Render Movie Grid Section
   * MÔ TẢ: Hiển thị một section phim dạng grid ngang (horizontal scroll)
   * THAM SỐ:
   * - movies: Danh sách phim cần hiển thị
   * - title: Tiêu đề section (VD: "Đề xuất cho bạn", "Trending")
   * - category: Category để tạo unique key (optional)
   * TÍNH NĂNG:
   * - Hiển thị tối đa 6 phim per section
   * - Horizontal scroll
   * - Movie poster clickable
   * - Responsive layout
   */
  const renderMovieGrid = (movies: GridMovie[], title: string, category?: string) => {
    // Kiểm tra có movies không
    if (!movies.length) return null;

    return (
      <View style={styles.section}>
        {/* SECTION HEADER - Tiêu đề section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>

        {/* MOVIE GRID - FlatList horizontal */}
        <FlatList
          data={movies.slice(0, 6)}                    // Giới hạn 6 phim per section
          horizontal                                   // Scroll ngang
          showsHorizontalScrollIndicator={false}       // Ẩn scroll indicator
          keyExtractor={(item, index) => `${category}-${item.movieId}-${index}`} // Unique key
          contentContainerStyle={styles.movieList}    // Style cho container
          // PERFORMANCE OPTIMIZATION - Tối ưu hiệu suất movie grid
          getItemLayout={(data, index) => ({
            length: 152,                               // Width: 140px + marginRight: 12px
            offset: 152 * index,                       // Vị trí offset
            index,
          })}
          initialNumToRender={4}                       // Render 4 item đầu tiên (vừa đủ 1 screen)
          maxToRenderPerBatch={2}                      // Render tối đa 2 item mỗi batch
          windowSize={8}                               // Window size lớn hơn cho horizontal scroll
          removeClippedSubviews={true}                 // Remove items ngoài viewport
          updateCellsBatchingPeriod={50}               // Update nhanh hơn cho smooth scroll
          renderItem={renderMovieItem}                 // Sử dụng memoized render function
        />
      </View>
    );
  };

  /**
   * CHỨC NĂNG: Render Continue Watching Section
   * MÔ TẢ: Hiển thị danh sách phim đang xem với progress bar
   * ĐIỀU KIỆN: Chỉ hiển thị khi user đã đăng nhập và có phim đang xem
   * TÍNH NĂNG:
   * - Hiển thị poster phim
   * - Progress bar cho biết % đã xem
   * - Horizontal scroll
   * - Click để tiếp tục xem
   * DATA: Lấy từ API getContinueWatching với userId
   */
  const renderContinueWatching = () => {
    // Kiểm tra có data continue watching không
    if (!continueWatching || continueWatching.length === 0) return null;

    return (
      <View style={styles.section}>
        {/* SECTION HEADER */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Đang xem</Text>
        </View>

        {/* CONTINUE WATCHING LIST */}
        <FlatList
          data={continueWatching}                                           // Data: phim đang xem
          horizontal                                                       // Scroll ngang
          keyExtractor={(item, index) => item.movieId || `continue-${index}`} // Unique key
          showsHorizontalScrollIndicator={false}                           // Ẩn scroll indicator
          contentContainerStyle={styles.continueList}                     // Style container
          // PERFORMANCE OPTIMIZATION - Tối ưu hiệu suất continue watching
          getItemLayout={(data, index) => ({
            length: 142,                                                   // Width: 130px + marginRight: 12px
            offset: 142 * index,                                           // Vị trí offset
            index,
          })}
          initialNumToRender={3}                                           // Render 3 item đầu tiên
          maxToRenderPerBatch={2}                                          // Render tối đa 2 item mỗi batch
          windowSize={6}                                                   // Window size cho continue watching
          removeClippedSubviews={true}                                     // Remove items ngoài viewport
          updateCellsBatchingPeriod={50}                                   // Update nhanh cho smooth scroll
          renderItem={renderContinueItem}                              // Sử dụng memoized render function
        />
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        {/* TABHEADER - Move outside để luôn visible và có animation */}
        <TabHeader
          onSearchPress={handleSearch}
          onNotificationPress={handleNotification}
          opacity={headerOpacity}        // 🎬 Fade animation (both approaches)
          translateY={headerTranslateY}  // 🎬 Slide animation
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          onScroll={onScrollWithAnimation}  // 🎬 Enable scroll header animation
          scrollEventThrottle={16}          // 🎬 Smooth 60fps scroll tracking
        >
          {renderBanner()}
          {renderMovieGrid(recommendedMovies, 'Đề xuất cho bạn', 'recommended')}
          {userId && continueWatching.length > 0 && renderContinueWatching()}
          {sections.map((section, index) => (
            <View key={index}>
              {renderMovieGrid(section.movies, section.title)}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return renderContent();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  // REMOVED STYLES - Moved to TabHeader component
  // logoImage: Logo image styles moved to TabHeader component for reusability
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
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20, // Reduced padding to prevent extra space
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
  // REMOVED STYLES - Moved to TabHeader component for centralization
  // headerBar: Absolute positioning styles moved to TabHeader
  // logoText: Text styles moved to TabHeader  
  // headerIcons: Icon container styles moved to TabHeader
  // This eliminates code duplication across tab screens
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
    backdropFilter: 'blur(10px)',
  },
  moreButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  section: {
    paddingLeft: 20,
    marginTop: 32
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
  movieList: {
    paddingRight: 20,
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
});