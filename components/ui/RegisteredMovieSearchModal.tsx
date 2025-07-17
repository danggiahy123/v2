import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { useRouter } from 'expo-router';
import registeredMovieService from '../../services/registeredMovieService';
import { rentalService } from '../../services/rentalService';
import { RegisteredMovie } from '../../types/movie';
import { RentalInfo } from '../../types/rental';

interface RegisteredMovieSearchModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

// Enhanced interface để include rental info
interface EnhancedRegisteredMovie extends RegisteredMovie {
  rentalInfo?: RentalInfo;
  rentalStatus?: 'active' | 'expired' | 'cancelled'|'pending' | 'paid';
  rentalType?: '48h' | '30d';
  remainingTime?: string;
}

const RegisteredMovieSearchModal: React.FC<RegisteredMovieSearchModalProps> = ({
  visible,
  onClose,
  userId
}) => {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState<EnhancedRegisteredMovie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<EnhancedRegisteredMovie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allRentals, setAllRentals] = useState<RentalInfo[]>([]);

  // Lấy danh sách rental history một lần
  const loadRentalHistory = useCallback(async () => {
    if (!userId) return;
    
    try {
      const response = await rentalService.getRentalHistory(userId, {
        limit: 100, // Lấy nhiều để có đầy đủ data
      });
      setAllRentals(response.data.rentals);
    } catch (error) {
      console.error('❌ [RegisteredMovieSearch] Error loading rental history:', error);
    }
  }, [userId]);

  // Load rental history khi modal mở
  useEffect(() => {
    if (visible && userId) {
      loadRentalHistory();
      // Reset search state khi mở modal
      setSearchQuery('');
      setMovies([]);
      setFilteredMovies([]);
      setIsLoading(false);
    }
  }, [visible, userId, loadRentalHistory]);

  // Load tất cả phim đã đăng ký khi mở modal
  const loadAllRegisteredMovies = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      console.log('🔍 [RegisteredMovieSearch] Loading all registered movies');
      
      const response = await registeredMovieService.searchRegisteredMovies({
        userId,
        q: '' // Không có query để lấy tất cả
      });

      if (response.status === 'success') {
        // Debug: Log tất cả movies từ API
        console.log('🔍 [RegisteredMovieSearch] Raw API response:', response.data);
        console.log('🔍 [RegisteredMovieSearch] Raw movies count:', response.data.length);
        
        // Log chi tiết từng movie để kiểm tra duplicate
        response.data.forEach((movie, index) => {
          console.log(`🔍 [RegisteredMovieSearch] Movie ${index}:`, {
            id: movie._id,
            title: movie.movie_title,
            type: movie.movie_type
          });
        });
        
        // Loại bỏ duplicate movies dựa trên movie._id
        const uniqueMovies = response.data.filter((movie, index, self) => {
          const firstIndex = self.findIndex(m => m._id === movie._id);
          const isDuplicate = index !== firstIndex;
          
          if (isDuplicate) {
            console.log('🚫 [RegisteredMovieSearch] Removing duplicate:', {
              id: movie._id,
              title: movie.movie_title,
              originalIndex: firstIndex,
              duplicateIndex: index
            });
          }
          
          return index === firstIndex;
        });
        
        console.log('🔍 [RegisteredMovieSearch] Original movies:', response.data.length);
        console.log('🔍 [RegisteredMovieSearch] Unique movies:', uniqueMovies.length);
        
        // Enhance movies với rental info
        const enhancedMovies: EnhancedRegisteredMovie[] = uniqueMovies.map(movie => {
          // Tìm rental info từ rental history
          const rental = allRentals.find(r => r.movieId._id === movie._id);
          
          let remainingTime = '';
          if (rental && rental.status === 'active') {
            const endTime = new Date(rental.endTime);
            const now = new Date();
            const diffMs = endTime.getTime() - now.getTime();
            
            if (diffMs > 0) {
              const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              
              if (days > 0) {
                remainingTime = `${days} ngày ${hours} giờ`;
              } else {
                remainingTime = `${hours} giờ`;
              }
            }
          }

          return {
            ...movie,
            rentalInfo: rental,
            rentalStatus: rental?.status,
            rentalType: rental?.rentalType,
            remainingTime
          };
        });

        // Đảm bảo không có duplicate trong final result
        const finalMovies = enhancedMovies.filter((movie, index, self) => 
          index === self.findIndex(m => m._id === movie._id)
        );
        
        // Loại bỏ những phim đã hủy
        const activeMovies = finalMovies.filter(movie => 
          movie.rentalStatus !== 'cancelled'
        );
        
        console.log('✅ [RegisteredMovieSearch] Final unique movies:', finalMovies.length);
        console.log('✅ [RegisteredMovieSearch] Active movies (excluding cancelled):', activeMovies.length);
        
        setMovies(activeMovies);
        setFilteredMovies(activeMovies); // Ban đầu hiển thị tất cả
      }
    } catch (error) {
      console.error('❌ [RegisteredMovieSearch] Error loading all movies:', error);
      setMovies([]);
      setFilteredMovies([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, allRentals]);

  // Load tất cả phim khi rental history đã sẵn sàng
  useEffect(() => {
    if (visible && userId && allRentals.length > 0) {
      loadAllRegisteredMovies();
    }
  }, [visible, userId, allRentals, loadAllRegisteredMovies]);

  // Filter movies dựa trên search query
  useEffect(() => {
    console.log('🔍 [RegisteredMovieSearch] Filtering movies:', {
      searchQuery,
      totalMovies: movies.length,
      queryLength: searchQuery.length
    });
    
    if (!searchQuery.trim()) {
      setFilteredMovies(movies); // Hiển thị tất cả khi không có query
      console.log('🔍 [RegisteredMovieSearch] Showing all movies:', movies.length);
    } else {
      const filtered = movies.filter(movie => 
        movie.movie_title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMovies(filtered);
      console.log('🔍 [RegisteredMovieSearch] Filtered movies:', {
        query: searchQuery,
        total: movies.length,
        filtered: filtered.length,
        results: filtered.map(m => m.movie_title)
      });
    }
  }, [searchQuery, movies]);

  const handleMoviePress = (movie: EnhancedRegisteredMovie) => {
    onClose();
    router.push(`/movie/${movie._id}`);
  };

  const getStatusColor = (status: string | undefined): string => {
    if (!status) return '#64748b';
    if (status === 'active') return '#22c55e';
    if (status === 'expired') return '#64748b'; 
    if (status === 'cancelled') return '#ef4444';
    return '#64748b';
  };

  const getStatusText = (status: string | undefined): string => {
    if (!status) return 'Không rõ';
    if (status === 'active') return 'Đang thuê';
    if (status === 'expired') return 'Hết hạn';
    if (status === 'cancelled') return 'Đã hủy';
    return 'Không rõ';
  };

  const formatRentalType = (type: string | undefined): string => {
    if (!type) return '';
    if (type === '48h') return '48 giờ';
    if (type === '30d') return '30 ngày';
    return '';
  };

  const getStatusChipStyles = (status: string | undefined) => {
    if (!status || status === 'expired') {
      return [styles.statusChip, styles.chip_expired];
    }
    if (status === 'active') {
      return [styles.statusChip, styles.chip_active];
    }
    if (status === 'cancelled') {
      return [styles.statusChip, styles.chip_cancelled];
    }
    return [styles.statusChip, styles.chip_expired];
  };

  const formatPrice = (price?: number) => {
    if (!price) return '';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const renderMovie = ({ item }: { item: EnhancedRegisteredMovie }) => (
    <TouchableOpacity style={styles.movieItem} onPress={() => handleMoviePress(item)}>
      <View style={styles.posterContainer}>
        <Image source={{ uri: item.poster_path }} style={styles.poster} />
        {/* Status indicator dot */}
        <View 
          style={[
            styles.statusIndicator, 
            { backgroundColor: getStatusColor(item.rentalStatus) }
          ]} 
        />
      </View>
      
      <View style={styles.movieInfo}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.movie_title}
          </Text>
          {/* Status chip */}
          <View style={getStatusChipStyles(item.rentalStatus)}>
            <Text style={[
              styles.statusLabel,
              { color: getStatusColor(item.rentalStatus) }
            ]}>
              {getStatusText(item.rentalStatus)}
            </Text>
          </View>
        </View>
        
        <Text style={[styles.movieType, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
          {item.movie_type}
        </Text>
        
        {/* Rental details */}
        {item.rentalType && (
          <View style={styles.statusTimeRow}>
            <Text style={[styles.rentalDetails, { color: '#22c55e' }]}>
              {formatRentalType(item.rentalType)} • {formatPrice(item.rentalInfo?.paymentId.amount)}
            </Text>
            {item.remainingTime && item.rentalStatus === 'active' && (
              <Text style={[styles.remainingTime, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
                Còn {item.remainingTime}
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (isLoading) return null;
    
    if (!searchQuery.trim() && movies.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="film-outline" size={64} color="#666" />
          <Text style={styles.emptyTitle}>Chưa có phim đăng ký</Text>
          <Text style={styles.emptySubtitle}>
            Bạn chưa thuê phim nào. Hãy thuê phim để xem ở đây
          </Text>
        </View>
      );
    }

    if (searchQuery.trim() && filteredMovies.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={64} color="#666" />
          <Text style={styles.emptyTitle}>Không tìm thấy phim</Text>
          <Text style={styles.emptySubtitle}>
            Không có phim nào khớp với từ khóa "{searchQuery}"
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="search-outline" size={64} color="#666" />
        <Text style={styles.emptyTitle}>Tìm kiếm phim đăng ký</Text>
        <Text style={styles.emptySubtitle}>
          Nhập tên phim để tìm kiếm trong danh sách đã thuê
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
      >
        <LinearGradient
          colors={['#000', '#000', 'rgba(0,0,0,0.8)']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm phim đã thuê..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                returnKeyType="search"
                onSubmitEditing={() => {}} // Dismiss keyboard on submit
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#D11030" />
              <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
            </View>
          ) : filteredMovies.length > 0 ? (
            <FlatList
              data={filteredMovies}
              renderItem={renderMovie}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            renderEmptyState()
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Màu đen hoàn toàn
  },
  header: {
    paddingTop: 80, // Hạ thanh search xuống nữa
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
   
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 50,
    paddingHorizontal: 16,
    height: 44,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  movieItem: {
    backgroundColor: '#111', // Màu đen đậm hơn cho card
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  posterContainer: {
    marginRight: 16,
    position: 'relative',
  },
  poster: {
    width: 80,
    height: 120,
    borderRadius: 12,
  },
  statusIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#111', // Đồng bộ với màu card
  },
  movieInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff', // Màu trắng cho tên phim
    lineHeight: 24,
    flex: 1,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 12,
  },
  chip_active: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  chip_expired: {
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
  },
  chip_cancelled: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  movieType: {
    fontSize: 14,
    marginBottom: 8,
  },
  statusTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rentalDetails: {
    fontSize: 14,
    fontWeight: '500',
  },
  remainingTime: {
    fontSize: 12,
    marginLeft: 10,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default RegisteredMovieSearchModal;