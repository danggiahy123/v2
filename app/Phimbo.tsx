import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Icon = MaterialCommunityIcons;
const { width } = Dimensions.get('window');

// --- CẬP NHẬT: Loại bỏ dữ liệu cứng cho phim và cập nhật MovieItem interface ---

// Định nghĩa kiểu dữ liệu cho phim lấy từ API
interface MovieItem {
  _id: string; // ID của phim
  title: string; // Tên phim
  poster_url: string; // URL của poster phim
  // Thêm các trường khác nếu API của bạn có
}

// Định nghĩa kiểu dữ liệu cho thể loại
interface CategoryItem {
  _id: string; // ID của thể loại con
  genre_name: string; // Tên của thể loại con
  description: string;
  poster: string; // URL poster của thể loại
  movie_count: number;
  has_children: boolean;
  children_count: number;
  sort_order: number;
  is_active: boolean;
  is_parent: boolean;
  children: any[]; // Mảng children, có thể là rỗng
}

// Map để lưu trữ dữ liệu phim theo từng thể loại (ví dụ: { "genreId1": [movie1, movie2], "genreId2": [movie3, movie4] })
interface MoviesByGenreMap {
  [genreId: string]: MovieItem[];
}

const Phimbo: React.FC = () => {
  const router = useRouter();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('Phim Bộ');

  // States để lưu dữ liệu từ API
  const [seriesCategoriesData, setSeriesCategoriesData] = useState<CategoryItem[]>([]);
  // Mới: State để lưu trữ phim theo thể loại
  const [moviesByGenre, setMoviesByGenre] = useState<MoviesByGenreMap>({});

  // Trạng thái tải dữ liệu
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingMovies, setLoadingMovies] = useState(false); // Thêm trạng thái tải phim

  // --- Hàm fetch dữ liệu từ API ---

  // Fetch Thể loại Phim Bộ (sử dụng API cho thể loại con)
  const fetchSeriesCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const response = await fetch('https://backend-app-lou3.onrender.com/api/genres?type=children&parent_id=68418dc73556ab3de6e4c434');
      const json = await response.json();
      console.log('API Thể loại Phim Bộ (con):', json);

      if (json.status === 'success' && json.data && Array.isArray(json.data.genres)) {
        const formattedData: CategoryItem[] = json.data.genres.map((item: any) => ({
          _id: item._id,
          genre_name: item.genre_name,
          description: item.description || '',
          poster: item.poster || '', // Có thể dùng placeholder nếu muốn: 'https://placehold.co/400x300/000/FFF?text=No+Image'
          movie_count: item.movie_count || 0,
          has_children: item.has_children || false,
          children_count: item.children_count || 0,
          sort_order: item.sort_order || 0,
          is_active: item.is_active || false,
          is_parent: item.is_parent || false,
          children: item.children || []
        }));
        setSeriesCategoriesData(formattedData);
      } else {
        console.warn('Dữ liệu thể loại phim bộ không đúng định dạng:', json);
        Alert.alert('Lỗi', 'Không thể tải thể loại phim bộ: Cấu trúc dữ liệu không phù hợp.');
        setSeriesCategoriesData([]);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải thể loại phim bộ:', err);
      Alert.alert('Lỗi', 'Kết nối thất bại. Không thể tải thể loại phim bộ.');
      setSeriesCategoriesData([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Mới: Hàm fetch phim theo thể loại ID
  const fetchMoviesByGenre = useCallback(async (genreId: string) => {
    try {
      // Giả định API endpoint cho phim bộ theo thể loại
      const response = await fetch(`https://backend-app-lou3.onrender.com/api/movies?type=series&genre_id=${genreId}&limit=10`);
      const json = await response.json();
      console.log(`API Phim theo thể loại (${genreId}):`, json);

      if (json.status === 'success' && json.data && Array.isArray(json.data.movies)) {
        const formattedMovies: MovieItem[] = json.data.movies.map((item: any) => ({
          _id: item._id,
          title: item.title,
          poster_url: item.poster_url || 'https://placehold.co/200x280/000/FFF?text=No+Poster', // Fallback nếu không có poster
        }));
        return formattedMovies;
      } else {
        console.warn(`Dữ liệu phim cho thể loại ${genreId} không đúng định dạng hoặc rỗng:`, json);
        return [];
      }
    } catch (err: any) {
      console.error(`Lỗi khi tải phim cho thể loại ${genreId}:`, err);
      return [];
    }
  }, []);

  // --- useEffect để tải dữ liệu khi component mount ---
  useEffect(() => {
    fetchSeriesCategories();
  }, [fetchSeriesCategories]);

  // Mới: useEffect để tải phim cho từng thể loại sau khi categories đã tải xong
  useEffect(() => {
    const loadAllGenreMovies = async () => {
      if (seriesCategoriesData.length > 0) {
        setLoadingMovies(true);
        const newMoviesByGenre: MoviesByGenreMap = {};
        for (const category of seriesCategoriesData) {
          const movies = await fetchMoviesByGenre(category._id);
          newMoviesByGenre[category._id] = movies;
        }
        setMoviesByGenre(newMoviesByGenre);
        setLoadingMovies(false);
      }
    };
    loadAllGenreMovies();
  }, [seriesCategoriesData, fetchMoviesByGenre]); // Chạy lại khi categories thay đổi

  // Hàm xử lý khi chọn một thể loại từ modal
  const handleCategorySelect = (category: CategoryItem) => {
    setSelectedCategoryName(category.genre_name);
    setShowCategoryModal(false);
    console.log('Đã chọn thể loại:', category.genre_name, 'ID:', category._id);
    // TODO: Nếu bạn muốn cuộn đến section của thể loại này, bạn có thể thêm logic cuộn ở đây.
  };

  // Component hiển thị mỗi item phim trong lưới
  const renderMovieGridItem = ({ item }: { item: MovieItem }) => (
    <TouchableOpacity
      style={styles.movieGridItem}
      onPress={() => router.push(`../chitietphimdai?movieId=${item._id}`)} // Truyền movieId nếu cần
    >
      <Image source={{ uri: item.poster_url }} style={styles.movieGridImage} />
    </TouchableOpacity>
  );

  // Component hiển thị mỗi item phim theo chiều ngang
  const renderMovieRowItem = ({ item }: { item: MovieItem }) => (
    <TouchableOpacity
      style={styles.movieRowItem}
      onPress={() => router.push(`../chitietphimdai?movieId=${item._id}`)} // Truyền movieId nếu cần
    >
      <Image source={{ uri: item.poster_url }} style={styles.movieRowImage} />
      <Text style={styles.movieRowTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  // Component chung cho mỗi section phim
  const MovieSection = ({ title, data, numColumns = 0, horizontal = false, isGrid = false }: {
    title: string;
    data: MovieItem[];
    numColumns?: number;
    horizontal?: boolean;
    isGrid?: boolean;
  }) => {
    if (!data || data.length === 0) return null; // Không hiển thị section nếu không có dữ liệu

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {!isGrid && (
            <TouchableOpacity style={styles.sectionSeeAllButton} onPress={() => {
              // TODO: Điều hướng đến trang "Xem tất cả" cho thể loại này (nếu có)
              console.log(`Xem tất cả phim của thể loại: ${title}`);
            }}>
              <Text style={styles.sectionSeeAllText}>Xem tất cả</Text>
              <Icon name="chevron-right" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        {horizontal ? (
          <FlatList
            data={data}
            renderItem={renderMovieRowItem}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContent}
          />
        ) : (
          <FlatList
            data={data}
            renderItem={renderMovieGridItem}
            keyExtractor={(item) => item._id}
            numColumns={numColumns}
            scrollEnabled={false}
            columnWrapperStyle={numColumns > 1 ? styles.row : null}
            contentContainerStyle={isGrid ? styles.allSeriesGrid : null}
          />
        )}
      </View>
    );
  };

  if (loadingCategories || loadingMovies) { // Kiểm tra cả tải thể loại và tải phim
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Đang tải dữ liệu phim bộ...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollViewContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Thanh chọn thể loại trong header */}
          <TouchableOpacity
            style={styles.categoryPickerHeader}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={styles.categoryPickerHeaderText}>{selectedCategoryName}</Text>
            <Icon name="chevron-down" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Tiêu đề "Phim Bộ" - Giữ vị trí trung tâm */}
          <Text style={styles.headerTitle}>Phim Bộ</Text>

          <TouchableOpacity style={styles.headerButton} onPress={() => router.push('../timkiem')}>
            <Icon name="magnify" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Các Section phim sử dụng dữ liệu từ API */}
        {/* Thay thế "Phim Bộ Mới Nhất" và "Tất Cả Phim Bộ" bằng các section từ API thể loại */}
        {seriesCategoriesData.map((category) => (
          <React.Fragment key={category._id}>
            {/* Hiển thị section phim cho từng thể loại, sử dụng dữ liệu từ moviesByGenre */}
            <MovieSection
              title={category.genre_name}
              data={moviesByGenre[category._id] || []} // Lấy phim của thể loại này, nếu không có thì là mảng rỗng
              horizontal={true}
            />
            <View style={styles.divider} />
          </React.Fragment>
        ))}

        {/* Đệm cuối trang */}
        <View style={{ height: 60 }} />

      </ScrollView>

      {/* Modal chọn thể loại */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showCategoryModal}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setShowCategoryModal(false)}
        >
          <View style={styles.categoryModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thể loại</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={seriesCategoriesData} // Lấy dữ liệu thể loại từ API
              keyExtractor={(item) => item._id} // Sử dụng _id
              numColumns={2}
              columnWrapperStyle={styles.categoryModalRow}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryModalItem}
                  onPress={() => handleCategorySelect(item)} // Truyền toàn bộ item
                >
                  {item.poster ? ( // Kiểm tra nếu poster có giá trị
                    <Image source={{ uri: item.poster }} style={styles.categoryModalImage} />
                  ) : (
                    // Fallback nếu không có poster, hiển thị View với tên thể loại
                    <View style={[styles.categoryModalImage, { backgroundColor: '#444', justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ color: '#fff', fontSize: 16 }}>{item.genre_name}</Text>
                    </View>
                  )}
                  <View style={styles.categoryModalTextOverlay}>
                    <Text style={styles.categoryModalText}>{item.genre_name}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNavBar}>
        <Link href="../index" asChild>
          <TouchableOpacity style={styles.navBarItem}>
            <Icon name="home" size={24} color="#888" />
            <Text style={styles.navBarText}>Trang chủ</Text>
          </TouchableOpacity>
        </Link>
        <Link href="../Phimbo" asChild>
          <TouchableOpacity style={styles.navBarItem}>
            <Icon name="movie-play-outline" size={24} color="#E50914" />
            <Text style={styles.navBarTextActive}>Phim bộ</Text>
          </TouchableOpacity>
        </Link>
        <Link href="../hoathinh" asChild>
          <TouchableOpacity style={styles.navBarItem}>
            <Icon name="television-play" size={24} color="#888" />
            <Text style={styles.navBarText}>Hoạt hình</Text>
          </TouchableOpacity>
        </Link>
        <TouchableOpacity style={styles.navBarItem}>
          <Icon name="dots-horizontal" size={24} color="#888" />
          <Text style={styles.navBarText}>Mở rộng</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  categoryPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryPickerHeaderText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 5,
  },
  section: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionSeeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionSeeAllText: {
    color: '#fff',
    fontSize: 14,
    marginRight: 5,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  movieGridItem: {
    width: (width - 30 - 20) / 3,
    height: ((width - 30 - 20) / 3) * 1.4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#222',
    marginBottom: 10,
  },
  movieGridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  allSeriesGrid: {
    paddingHorizontal: 0,
    marginBottom: 10,
  },
  horizontalListContent: {
    paddingRight: 15,
  },
  movieRowItem: {
    width: width * 0.3,
    marginRight: 10,
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  movieRowImage: {
    width: '100%',
    height: width * 0.3 * 1.4,
    borderRadius: 8,
    resizeMode: 'cover',
    marginBottom: 5,
  },
  movieRowTitle: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'left',
    width: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginHorizontal: 15,
    marginVertical: 10,
  },
  bottomNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
    height: 60,
    paddingBottom: 5,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  navBarItem: {
    alignItems: 'center',
    padding: 5,
  },
  navBarText: {
    color: '#888',
    fontSize: 10,
    marginTop: 2,
  },
  navBarTextActive: {
    color: '#E50914',
    fontSize: 10,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryModalContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
    padding: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 10,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  categoryModalRow: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryModalItem: {
    width: (width * 0.9 - 30) / 2,
    height: ((width * 0.9 - 30) / 2) * 0.7,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#222',
    marginBottom: 10,
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryModalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
  },
  categoryModalTextOverlay: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryModalText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Phimbo;