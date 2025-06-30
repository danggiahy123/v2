import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { movieService } from '../../services/movieService';
import { GridMovie } from '../../types/movie';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { shouldShowPaidBadge, enrichMoviesWithPriceInfo } from '../../utils/moviePriceHelper';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2; // 2 columns for a cleaner look
const ITEM_MARGIN = 10; // Increased margin for better spacing
const ITEM_WIDTH = (width - (COLUMN_COUNT + 1) * ITEM_MARGIN) / COLUMN_COUNT;

// Backend movie response type
interface BackendMovie {
  _id: string;
  movie_title: string;
  poster_path: string;
  movie_type: string;
  producer: string;
  description?: string;
  production_time?: string;
  genres?: any[];
}

interface SearchResult extends GridMovie {
  description?: string;
  releaseDate?: string;
}

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  category?: 'series' | 'anime';
}

export default function SearchModal({ visible, onClose, category }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreResults, setHasMoreResults] = useState(true);
  const router = useRouter();

  // Thêm debounce search để tránh gọi API quá nhiều khi gõ
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300); // Đợi 300ms sau khi người dùng ngừng gõ

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  const handleSearch = useCallback(async (resetPage = true) => {
    try {
      if (resetPage) {
        setSearchPage(1);
        setSearchResults([]);
        setHasMoreResults(true);
      }

      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      if (resetPage) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const currentPage = resetPage ? 1 : searchPage;



      const response = await movieService.searchMovies({
        tuKhoa: searchQuery,
        page: currentPage,
        limit: 20,
        category: category,
        searchByTitle: true // Chỉ tìm kiếm theo tên phim
      });



      if (response?.status === 'success' && response.data) {
        // Map backend response to frontend expected format
        const backendMovies = response.data.movies || [];
        const mappedResults = (backendMovies as unknown as BackendMovie[]).map(movie => ({
          movieId: movie._id,
          title: movie.movie_title,
          poster: movie.poster_path,
          movieType: movie.movie_type,
          producer: movie.producer,
          description: movie.description,
          releaseDate: movie.production_time,
          year: movie.production_time ? new Date(movie.production_time).getFullYear() : undefined,
          rating: undefined, // Backend doesn't include rating in search
          genres: movie.genres
        }));

        // 💰 Enhance search results với price info để hiển thị badge "Trả phí"
        let enhancedResults = mappedResults;
        try {
          enhancedResults = await enrichMoviesWithPriceInfo(mappedResults, 2); // 2 concurrent để tránh quá tải
        } catch (error) {
          console.warn('⚠️ [SearchModal] Failed to enhance with price info, using original results:', error);
          enhancedResults = mappedResults; // Fallback to original if enhancement fails
        }
        
        if (resetPage) {
          setSearchResults(enhancedResults);
        } else {
          setSearchResults(prev => [...prev, ...enhancedResults]);
        }

        setHasMoreResults(mappedResults.length === 20);
        setSearchPage(currentPage + 1);
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm phim:', error);
      // Log more details for debugging
      console.error('Search error details:', {
        searchQuery,
        category,
        page: searchPage,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [searchQuery, searchPage, category]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMoreResults) {
      handleSearch(false);
    }
  };

  const handleMoviePress = (movieId: string) => {
    onClose();
    router.push(`/movie/${movieId}`);
  };

  const handleBackPress = () => {
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleBackPress}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.contentContainer}>
          {/* Header with Gradient */}
          <LinearGradient
            colors={['#000', 'rgba(0,0,0,0.9)', 'rgba(0,0,0,0.8)']}
            style={styles.headerGradient}
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              
              <View style={styles.searchInputContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder={`Tìm ${category === 'series' ? 'phim bộ' : category === 'anime' ? 'hoạt hình' : 'phim'}...`}
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                  returnKeyType="search"
                  selectionColor="#E50914"
                />
                {searchQuery.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    style={styles.clearButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="search" size={20} color="rgba(255,255,255,0.5)" />
                )}
              </View>
            </View>
          </LinearGradient>

          {/* Search Results */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#E50914" />
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.movieId}
              numColumns={COLUMN_COUNT}
              contentContainerStyle={styles.resultsList}
              columnWrapperStyle={styles.row}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.movieItem}
                  onPress={() => handleMoviePress(item.movieId)}
                  activeOpacity={0.7}
                >
                  <View style={styles.posterContainer}>
                    <Image
                      source={{ uri: item.poster }}
                      style={styles.poster}
                      resizeMode="cover"
                    />
                    
                    {/* Badge "Trả phí" cho phim trả phí */}
                    {shouldShowPaidBadge(item) && (
                      <View style={styles.paidBadge}>
                        <Ionicons name="card" size={10} color="#fff" />
                        <Text style={styles.paidBadgeText}>Trả phí</Text>
                      </View>
                    )}
                    
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.9)']}
                      style={styles.posterGradient}
                    />
                    <View style={styles.movieInfo}>
                      <Text style={styles.movieTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      {item.releaseDate && (
                        <Text style={styles.movieYear}>
                          {new Date(item.releaseDate).getFullYear()}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListEmptyComponent={
                searchQuery.length > 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={64} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.emptyText}>
                      Không tìm thấy kết quả cho &quot;{searchQuery}&quot;
                    </Text>
                    <Text style={styles.emptySubText}>
                      Hãy thử tìm kiếm với từ khóa khác
                    </Text>
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="search" size={64} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.emptyText}>
                      {category === 'series' 
                        ? 'Tìm kiếm phim bộ bạn muốn xem'
                        : category === 'anime'
                        ? 'Tìm kiếm hoạt hình bạn muốn xem'
                        : 'Tìm kiếm phim bạn muốn xem'
                      }
                    </Text>
                  </View>
                )
              }
              ListFooterComponent={
                isLoadingMore ? (
                  <ActivityIndicator 
                    color="#E50914" 
                    style={styles.loadingMore} 
                  />
                ) : null
              }
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  contentContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 40 : 0, // Thêm khoảng cách từ trên cùng màn hình cho Android
  },
  headerGradient: {
    width: '100%',
    paddingTop: 40, // Đẩy thanh tìm kiếm xuống hơn
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16, // Tăng paddingVertical để tạo thêm không gian cho thanh tìm kiếm
  },
  backButton: {
    padding: 4,
    marginRight: 12,
    paddingTop: 15,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 46,
    marginTop: 10, // Thêm marginTop để đẩy thanh tìm kiếm xuống thêm
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  clearButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsList: {
    padding: ITEM_MARGIN,
  },
  row: {
    justifyContent: 'space-between',
  },
  movieItem: {
    width: ITEM_WIDTH,
    marginBottom: ITEM_MARGIN * 2,
  },
  posterContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  poster: {
    width: '100%',
    height: ITEM_WIDTH * 1.5,
  },
  posterGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  movieInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  movieTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  movieYear: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  loadingMore: {
    padding: 16,
  },
  // Badge "Trả phí" styles
  paidBadge: {
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
  paidBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 3,
  },
});
