import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
  Modal,
  ImageBackground,
  Platform,
  Alert, // Thêm Alert để thông báo lỗi khi fetch API
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { movieService } from '../../services/movieService';
import { useAppSelector } from '../../store/hooks';
import { BannerMovie, ContinueWatchingItem, GridMovie } from '../../types/movie'; // Giả sử GridMovie có poster (string)

const { width } = Dimensions.get('window');
const POSTER_WIDTH = (width - 60) / 3;

interface MovieSection {
  title: string;
  movies: GridMovie[];
}

// Định nghĩa kiểu dữ liệu cho thể loại từ API
interface GenreFromApi {
    id: string; // Sử dụng id hoặc _id tùy thuộc API trả về
    title: string; // Tên thể loại
    description: string;
    poster: string; // URL ảnh của thể loại
    movie_count: number;
    has_children: boolean;
    children_count: number;
    sort_order: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const authState = useAppSelector((state) => state.auth);
  const { user, userId } = authState || { user: null, userId: null };

  const [bannerMovies, setBannerMovies] = useState<BannerMovie[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<GridMovie[]>([]);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
  const [sections, setSections] = useState<MovieSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [genres, setGenres] = useState<GenreFromApi[]>([]); // State để lưu trữ danh sách thể loại từ API
  const [showGenreModal, setShowGenreModal] = useState(false); // State để điều khiển hiển thị modal

  useEffect(() => {
    if (authState) loadHomeData();
    fetchGenres(); // Tải danh sách thể loại khi component mount
  }, [userId, authState]);

  const fetchGenres = async () => {
    try {
      const res = await fetch('https://backend-app-lou3.onrender.com/api/genres/home-categories');
      const json = await res.json();
      console.log('Dữ liệu API thể loại:', json); // Dùng để debug
      if (json.status === 'success' && json.data && Array.isArray(json.data.categories)) {
        setGenres(json.data.categories);
      } else {
        console.warn('Dữ liệu thể loại không đúng định dạng:', json);
        Alert.alert('Lỗi', 'Không thể tải danh sách thể loại.');
      }
    } catch (error) {
      console.error('Lỗi khi tải thể loại:', error);
      Alert.alert('Lỗi', 'Kết nối thất bại. Không thể tải thể loại.');
    }
  };

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
      console.error('Lỗi khi tải dữ liệu trang chủ:', e);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu trang chủ.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHomeData();
    fetchGenres(); // Thêm fetchGenres vào refresh để cập nhật nếu có thay đổi
  };

  const renderBanner = () => {
    if (!bannerMovies.length) return null;
    const current = bannerMovies[currentBannerIndex];
    return (
      <View style={styles.bannerContainer}>
        <Image source={{ uri: current.poster }} style={styles.bannerImage} resizeMode="cover" />
        <View style={styles.bannerOverlay} />
        {/* Banner Content nằm trên banner, phía dưới cùng */}
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

  // Hàm render từng item thể loại trong Modal
  const renderGenreItem = ({ item }: { item: GenreFromApi }) => (
    <TouchableOpacity
      style={styles.genreItemInModal}
      onPress={() => {
        setShowGenreModal(false); // Đóng modal
        console.log(`Đã chọn thể loại: ${item.title} (ID: ${item.id})`);
        // TẠI ĐÂY, bạn có thể thêm logic để hiển thị phim theo thể loại,
        // ví dụ: router.push(`/theloai/${item.id}`) hoặc cập nhật state để lọc phim trên màn hình hiện tại.
      }}
    >
      <ImageBackground source={{ uri: item.poster }} style={styles.genreImageBg} imageStyle={{ borderRadius: 8 }}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.genreGradientOverlay}
        >
          <Text style={styles.genreText}>{item.title}</Text>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );

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
      {/* FIXED HEADER Ở TRÊN CÙNG */}
      <View style={styles.fixedHeader}>
        <View style={styles.headerBar}>
          {/* NÚT MENU (3 GẠCH NGANG) - Mở modal thể loại */}
          <TouchableOpacity onPress={() => setShowGenreModal(true)} style={styles.menuButtonHeader}>
           
          </TouchableOpacity>
          {/* LOGO ở giữa */}
          <Text style={styles.logoText}>TECH5 PLAY</Text>
          {/* ICON SEARCH VÀ USER */}
          <View style={styles.headerIcons}>
            <Ionicons name="search" size={24} color="#fff" style={styles.iconSpacing} />
            <Ionicons name="person-circle" size={28} color="#fff" />
          </View>
        </View>
        {/* NÚT "Thể loại" DƯỚI LOGO TRÊN MÀN HÌNH CHÍNH */}
        <TouchableOpacity style={styles.genreButtonBelowLogo} onPress={() => setShowGenreModal(true)}>
          <Text style={styles.genreButtonTextBelowLogo}>Thể loại</Text>
          <Ionicons name="chevron-down" size={16} color="#fff" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        {/* Đảm bảo khoảng trống cho header cố định */}
        {/* Điều chỉnh chiều cao này để phù hợp với chiều cao tổng của fixedHeader */}
        <View style={{ height: Platform.OS === 'ios' ? 100 : 80 }} /> 
        
        {renderBanner()}
        {renderMovieGrid(recommendedMovies, 'Phim dành cho bạn')}
        {renderContinueWatching()}
        {sections.map((section, index) => (
          <React.Fragment key={index}>
            {renderMovieGrid(section.movies, section.title)}
          </React.Fragment>
        ))}
        {/* Đệm cuối cùng cho ScrollView */}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* MODAL HIỂN THỊ DANH MỤC THỂ LOẠI NGAY TRONG HOMESCREEN */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showGenreModal}
        onRequestClose={() => setShowGenreModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              {/* Nút đóng modal */}
              <View style={{ width: 24 }} /> {/* View trống để cân bằng vị trí tiêu đề */}
              <Text style={styles.modalTitle}>Thể loại</Text>
              <TouchableOpacity onPress={() => setShowGenreModal(false)} style={styles.closeModalButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={genres}
              keyExtractor={(item: any) => item.id} // Dùng item.id (từ API)
              renderItem={renderGenreItem}
              numColumns={2} // Hiển thị 2 cột như ảnh bạn gửi
              contentContainerStyle={styles.genreListInModal}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  loadingText: { color: '#fff', marginTop: 16, fontSize: 16 },
  scrollView: { flex: 1 },

  // --- STYLES CHO HEADER CỐ ĐỊNH ---
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'ios' ? 40 : 10,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  menuButtonHeader: {
    padding: 5,
  },
  logoText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconSpacing: { marginRight: 16 },

  // NÚT "Thể loại" DƯỚI LOGO TRÊN MÀN HÌNH CHÍNH
genreButtonBelowLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    // --- Bắt đầu phần cần thay đổi ---
    justifyContent: 'flex-start', // Đẩy nội dung sang trái
    paddingLeft: 20, // Thêm padding bên trái để căn lề với các icon header
    // --- Kết thúc phần cần thay đổi ---
    marginTop: 10,
  },
  genreButtonTextBelowLogo: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // --- KẾT THÚC STYLES CHO HEADER CỐ ĐỊNH ---

  bannerContainer: { height: 400, position: 'relative' },
  bannerImage: { width: '100%', height: '100%' },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.4)' },

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

  // STYLES CHO MODAL THỂ LOẠI
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end', // Để modal trượt từ dưới lên
  },
  modalContent: {
    backgroundColor: '#1a1a1a', // Nền đen đậm hơn
    width: '100%',
    height: '80%', // Chiếm 80% chiều cao màn hình
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1, // Để tiêu đề nằm giữa
    textAlign: 'center',
  },
  closeModalButton: {
    padding: 5,
  },
  genreListInModal: {
    paddingBottom: 20, // Để có khoảng trống dưới cùng
    // paddingHorizontal: 10, // Giảm padding ở đây để phù hợp với itemWidth
    justifyContent: 'space-between', // Canh lề các cột
  },
  genreItemInModal: {
    width: (width - 40 - 20) / 2, // 2 cột, trừ padding ngang của modalContent (40) và khoảng cách giữa 2 cột (20)
    marginVertical: 10, // Khoảng cách dọc giữa các item
    marginHorizontal: 5, // Khoảng cách ngang giữa các item
    borderRadius: 8,
    overflow: 'hidden',
    height: (width - 40 - 20) / 2 * (120 / 170), // Tỷ lệ ảnh trong ảnh mẫu, giả sử ảnh có tỷ lệ 170x120
    backgroundColor: '#333', // Màu nền khi ảnh chưa load
  },
  genreImageBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    resizeMode: 'cover', // Đảm bảo ảnh bao phủ toàn bộ vùng
  },
  genreGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 10,
    // Thêm gradient từ trên xuống dưới
    backgroundColor: 'rgba(0,0,0,0.3)', // Nền tối nhẹ
  },
  genreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
});