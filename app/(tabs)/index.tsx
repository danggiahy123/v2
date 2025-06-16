
import { Ionicons } from '@expo/vector-icons';
<<<<<<< Updated upstream
import React, { useEffect, useState } from 'react';
=======
import { useRouter } from 'expo-router'; // Vẫn giữ useRouter nếu bạn có các route khác
import React, { useEffect, useState, useCallback } from 'react'; // Thêm useCallback
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======
  Modal,
  ImageBackground,
  Platform,
  Alert, 
>>>>>>> Stashed changes
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { movieService } from '../../services/movieService';
import { useAppSelector } from '../../store/hooks';
<<<<<<< Updated upstream
import { BannerMovie, ContinueWatchingItem, GridMovie } from '../../types/movie';
=======
import { BannerMovie, ContinueWatchingItem, GridMovie } from '../../types/movie'; 
>>>>>>> Stashed changes

const { width } = Dimensions.get('window');
const POSTER_WIDTH = (width - 60) / 3;

interface MovieSection {
  title: string;
  movies: GridMovie[];
}

<<<<<<< Updated upstream
export default function HomeScreen() {
=======
interface GenreFromApi {
    _id: string; 
    genre_name: string; 
    description: string;
    poster: string; 
    movie_count: number;
    has_children: boolean;
    children_count: number;
    sort_order: number;
    is_active: boolean;
    is_parent: boolean;
}

export default function HomeScreen() {
  const router = useRouter(); 
>>>>>>> Stashed changes
  const authState = useAppSelector((state) => state.auth);
  const { user, userId } = authState || { user: null, userId: null };

  const [bannerMovies, setBannerMovies] = useState<BannerMovie[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<GridMovie[]>([]);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
  const [sections, setSections] = useState<MovieSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
<<<<<<< Updated upstream

  useEffect(() => {
    if (authState) loadHomeData();
  }, [userId, authState]);

  const loadHomeData = async () => {
=======
  const [genres, setGenres] = useState<GenreFromApi[]>([]); 
  const [showGenreModal, setShowGenreModal] = useState(false); 

  // THÊM STATE MỚI ĐỂ LƯU THỂ LOẠI ĐÃ CHỌN
  const [selectedGenre, setSelectedGenre] = useState<GenreFromApi | null>(null);
  // State để lưu phim theo thể loại đã chọn (chỉ ví dụ, bạn có thể tích hợp vào sections)
  const [moviesBySelectedGenre, setMoviesBySelectedGenre] = useState<GridMovie[]>([]);

  useEffect(() => {
    if (authState) loadHomeData();
    fetchGenres(); 
  }, [userId, authState]);

  // Sử dụng useCallback để hàm không bị tạo lại mỗi khi re-render
  const fetchGenres = useCallback(async () => {
    try {
      const res = await fetch('https://backend-app-lou3.onrender.com/api/genres?type=parent');
      const json = await res.json();
      
      console.log('Dữ liệu API thể loại nhận được:', json); 

      if (json.status === 'success' && json.data && Array.isArray(json.data.genres)) {
        setGenres(json.data.genres);
      } else {
        console.warn('Dữ liệu thể loại không đúng định dạng hoặc không có data.genres:', json);
        Alert.alert('Lỗi', 'Không thể tải danh sách thể loại: Cấu trúc dữ liệu không phù hợp.');
      }
    } catch (error) {
      console.error('Lỗi khi tải thể loại:', error);
      Alert.alert('Lỗi', 'Kết nối thất bại. Không thể tải thể loại.');
    }
  }, []); // [] vì hàm này không phụ thuộc vào props hay state bên ngoài

  // Hàm tải phim theo thể loại (ví dụ)
  const fetchMoviesByGenre = useCallback(async (genreId: string) => {
    setLoading(true);
>>>>>>> Stashed changes
    try {
      // GIẢ ĐỊNH CÓ MỘT API ĐỂ LẤY PHIM THEO THỂ LOẠI
      // Ví dụ: https://backend-app-lou3.onrender.com/api/movies?genre_id=${genreId}
      // Bạn cần thay đổi URL này cho phù hợp với API của bạn
      const res = await fetch(`https://backend-app-lou3.onrender.com/api/movies?genre_id=${genreId}`); 
      const json = await res.json();

      console.log(`Phim theo thể loại ${genreId}:`, json);

      if (json.status === 'success' && Array.isArray(json.data.movies)) { // Giả định API trả về { data: { movies: [...] } }
        setMoviesBySelectedGenre(json.data.movies);
      } else {
        console.warn('Không thể tải phim theo thể loại:', json);
        setMoviesBySelectedGenre([]); // Đặt rỗng nếu có lỗi
      }
    } catch (error) {
      console.error('Lỗi khi tải phim theo thể loại:', error);
      setMoviesBySelectedGenre([]);
      Alert.alert('Lỗi', 'Không thể tải phim theo thể loại này.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHomeData = useCallback(async () => {
    setLoading(true);
    try {
      // Load dữ liệu trang chủ mặc định
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
  }, [userId]); // userId là dependency

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setSelectedGenre(null); // Khi refresh, đặt lại về trạng thái không có thể loại nào được chọn
    setMoviesBySelectedGenre([]); // Xóa phim theo thể loại cũ
    loadHomeData();
<<<<<<< Updated upstream
  };
=======
    fetchGenres(); 
  }, [loadHomeData, fetchGenres]);
>>>>>>> Stashed changes

  const renderBanner = () => {
    if (!bannerMovies.length) return null;
    const current = bannerMovies[currentBannerIndex];
    return (
      <View style={styles.bannerContainer}>
        <Image source={{ uri: current.poster }} style={styles.bannerImage} resizeMode="cover" />
        <View style={styles.bannerOverlay} />
<<<<<<< Updated upstream
        <View style={styles.headerBar}>
          <Text style={styles.logoText}>TECH5 PLAY</Text>
          <View style={styles.headerIcons}>
            <Ionicons name="search" size={24} color="#fff" style={styles.iconSpacing} />
            <Ionicons name="person-circle" size={28} color="#fff" />
          </View>
        </View>
=======
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
=======
  const renderGenreItem = ({ item }: { item: GenreFromApi }) => (
    <TouchableOpacity
      style={styles.genreItemInModal}
      onPress={() => {
        setShowGenreModal(false); 
        setSelectedGenre(item); // Cập nhật thể loại đã chọn
        fetchMoviesByGenre(item._id); // Tải phim theo thể loại này
        // Cuộn lên đầu trang hoặc đến phần hiển thị phim thể loại
        // Ví dụ: scrollViewRef.current?.scrollTo({ y: 0, animated: true }); (nếu bạn có ref cho ScrollView)
      }}
    >
      {item.poster ? (
        <ImageBackground source={{ uri: item.poster }} style={styles.genreImageBg} imageStyle={{ borderRadius: 8 }}>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.genreGradientOverlay}
          >
            <Text style={styles.genreText}>{item.genre_name}</Text> 
          </LinearGradient>
        </ImageBackground>
      ) : (
        <View style={[styles.genreImageBg, { backgroundColor: '#333', justifyContent: 'flex-end', alignItems: 'flex-start' }]}>
            <Text style={[styles.genreText, { padding: 10 }]}>{item.genre_name}</Text> 
        </View>
      )}
    </TouchableOpacity>
  );

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======
      <View style={styles.fixedHeader}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => setShowGenreModal(true)} style={styles.menuButtonHeader}>
             <Ionicons name="menu" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.logoText}>TECH5 PLAY</Text>
          <View style={styles.headerIcons}>
            <Ionicons name="search" size={24} color="#fff" style={styles.iconSpacing} />
            <Ionicons name="person-circle" size={28} color="#fff" />
          </View>
        </View>
        <TouchableOpacity style={styles.genreButtonBelowLogo} onPress={() => setShowGenreModal(true)}>
          <Text style={styles.genreButtonTextBelowLogo}>Thể loại</Text>
          <Ionicons name="chevron-down" size={16} color="#fff" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

>>>>>>> Stashed changes
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
<<<<<<< Updated upstream
        {renderBanner()}
        {renderMovieGrid(recommendedMovies, 'Phim dành cho bạn')}
        {renderContinueWatching()}
        {sections.map((section, index) => (
          <React.Fragment key={index}>
            {renderMovieGrid(section.movies, section.title)}
          </React.Fragment>
        ))}
      </ScrollView>
=======
        <View style={{ height: Platform.OS === 'ios' ? 100 : 80 }} /> 
        
        {/* HIỂN THỊ PHIM THEO THỂ LOẠI ĐÃ CHỌN */}
        {selectedGenre && moviesBySelectedGenre.length > 0 && (
          <View style={styles.selectedGenreSection}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Phim thể loại: {selectedGenre.genre_name}</Text>
                {/* Nút reset hoặc xem tất cả nếu có */}
                <TouchableOpacity onPress={() => setSelectedGenre(null)}>
                    <Text style={styles.seeAllText}>Xem tất cả</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.movieGrid}>
              {moviesBySelectedGenre.map((movie) => (
                <TouchableOpacity key={movie.movieId} style={styles.movieItem}>
                  <Image source={{ uri: movie.poster }} style={styles.moviePoster} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* CHỈ HIỂN THỊ CÁC SECTION MẶC ĐỊNH NẾU KHÔNG CÓ THỂ LOẠI NÀO ĐƯỢC CHỌN */}
        {!selectedGenre && (
            <>
                {renderBanner()}
                {renderMovieGrid(recommendedMovies, 'Phim dành cho bạn')}
                {renderContinueWatching()}
                {sections.map((section, index) => (
                    <React.Fragment key={index}>
                        {renderMovieGrid(section.movies, section.title)}
                    </React.Fragment>
                ))}
            </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showGenreModal}
        onRequestClose={() => setShowGenreModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ width: 24 }} />
              <Text style={styles.modalTitle}>Thể loại</Text>
              <TouchableOpacity onPress={() => setShowGenreModal(false)} style={styles.closeModalButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={genres}
              keyExtractor={(item: any) => item._id} 
              renderItem={renderGenreItem}
              numColumns={2} 
              contentContainerStyle={styles.genreListInModal}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
>>>>>>> Stashed changes
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  loadingText: { color: '#fff', marginTop: 16, fontSize: 16 },
  scrollView: { flex: 1 },

<<<<<<< Updated upstream
  bannerContainer: { height: 400, position: 'relative' },
  bannerImage: { width: '100%', height: '100%' },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.4)' },

=======
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
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
=======
genreButtonBelowLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', 
    paddingLeft: 20, 
    marginTop: 10,
  },
  genreButtonTextBelowLogo: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  bannerContainer: { height: 400, position: 'relative' },
  bannerImage: { width: '100%', height: '100%' },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.4)' },

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
});
=======

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end', 
  },
  modalContent: {
    backgroundColor: '#1a1a1a', 
    width: '100%',
    height: '80%', 
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
    flex: 1, 
    textAlign: 'center',
  },
  closeModalButton: {
    padding: 5,
  },
  genreListInModal: {
    paddingBottom: 20, 
    justifyContent: 'space-between', 
  },
  genreItemInModal: {
    width: (width - 40 - 20) / 2, 
    marginVertical: 10, 
    marginHorizontal: 5, 
    borderRadius: 8,
    overflow: 'hidden',
    height: (width - 40 - 20) / 2 * (120 / 170), 
    backgroundColor: '#333', 
  },
  genreImageBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    resizeMode: 'cover', 
  },
  genreGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.3)', 
  },
  genreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  // Style cho phần hiển thị phim theo thể loại đã chọn
  selectedGenreSection: {
    paddingHorizontal: 20,
    marginTop: 32,
  }
});
>>>>>>> Stashed changes
