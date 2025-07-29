import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAppSelector } from '../store/hooks';
import { movieService } from '../services/movieService';
import { useAuthGuard } from '../hooks';
import { LoginRequiredModal } from '../components/ui';
import { GridMovie } from '../types/movie';
import { shouldShowPaidBadge } from '../utils/moviePriceHelper';

const { width } = Dimensions.get('window');

interface RecommendationItem extends GridMovie {
  reason?: string;
}

export default function RecommendationsScreen() {
  const router = useRouter();
  const { userId } = useAppSelector((state) => state.auth);
  const { isLoggedIn, showLoginModal, hideLoginModal, loginModalVisible, currentFeatureName } = useAuthGuard();

  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reason, setReason] = useState<string>('');
  const [preferences, setPreferences] = useState<{
    topGenres: string[];
    topMovieTypes: string[];
    topProducers: string[];
  } | null>(null);

  useEffect(() => {
    if (userId && isLoggedIn) {
      loadRecommendations();
    }
  }, [userId, isLoggedIn]);

  const loadRecommendations = async (isRefresh = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      if (!isRefresh) {
        setLoading(true);
      }

      console.log('🎯 [Recommendations] Loading recommendations for userId:', userId);
      const response = await movieService.getRecommendations(userId, 20);

      if (response?.status === 'success' && response.data) {
        setRecommendations(response.data.recommendations);
        setReason(response.data.reason);
        setPreferences(response.data.preferences || null);
        
        console.log('✅ [Recommendations] Loaded:', {
          count: response.data.recommendations.length,
          reason: response.data.reason,
          preferences: response.data.preferences
        });
      }
    } catch (error: any) {
      console.error('❌ [Recommendations] Error:', error);
      Alert.alert(
        'Lỗi',
        'Không thể tải danh sách đề xuất. Vui lòng thử lại.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRecommendations(true);
  };

  const renderRecommendationItem = ({ item, index }: { item: RecommendationItem; index: number }) => (
    <TouchableOpacity 
      style={styles.recommendationItem}
      onPress={() => router.push(`/movie/${item.movieId}`)}
      activeOpacity={0.8}
    >
      <View style={styles.recommendationContainer}>
        <Image source={{ uri: item.poster }} style={styles.recommendationPoster} resizeMode="cover" />
        
        {/* Paid Badge */}
        {shouldShowPaidBadge(item) && (
          <View style={styles.paidBadge}>
            <Ionicons name="card" size={10} color="#fff" />
            <Text style={styles.paidText}>Trả phí</Text>
          </View>
        )}

        {/* Recommendation Badge */}
        <View style={styles.recommendationBadge}>
          <Text style={styles.recommendationBadgeText}>Đề xuất</Text>
        </View>

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.recommendationGradient}
        >
          <Text style={styles.recommendationTitle} numberOfLines={2}>
            {item.title}
          </Text>
          
          {/* Show reason for recommendation */}
          {/* {item.reason && (
            <Text style={styles.recommendationReason} numberOfLines={1}>
              {item.reason}
            </Text>
          )} */}

          {/* Movie info */}
          <View style={styles.movieInfo}>
            {/* <Text style={styles.movieType}>{item.movieType}</Text> */}
            {item.producer && (
              <Text style={styles.producer}>{item.producer}</Text>
            )}
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );

//   const renderHeader = () => (
//     <View style={styles.header}>
//       <Text style={styles.headerTitle}>🎯 Đề xuất cho bạn</Text>
//       <Text style={styles.headerSubtitle}>{reason}</Text>
      
//       {preferences && (
//         <View style={styles.preferencesContainer}>
//           <Text style={styles.preferencesTitle}>Dựa trên sở thích của bạn:</Text>
          
          {/* {preferences.topGenres && preferences.topGenres.length > 0 && (
            <View style={styles.preferenceItem}>
              <Ionicons name="film" size={14} color="#E50914" />
              <Text style={styles.preferenceText}>
                Thể loại: {preferences.topGenres.slice(0, 3).join(', ')}
              </Text>
            </View>
          )} */}
          
          {/* {preferences.topMovieTypes && preferences.topMovieTypes.length > 0 && (
            <View style={styles.preferenceItem}>
              <Ionicons name="tv" size={14} color="#E50914" />
              <Text style={styles.preferenceText}>
                Loại phim: {preferences.topMovieTypes.join(', ')}
              </Text>
            </View>
          )} */}
          
//           {preferences.topProducers && preferences.topProducers.length > 0 && (
//             <View style={styles.preferenceItem}>
//               <Ionicons name="business" size={14} color="#E50914" />
//               <Text style={styles.preferenceText}>
//                 Nhà sản xuất: {preferences.topProducers.slice(0, 2).join(', ')}
//               </Text>
//             </View>
//           )}
//         </View>
//       )}
//     </View>
//   );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="star-outline" size={64} color="#666" />
      <Text style={styles.emptyTitle}>Chưa có đề xuất</Text>
      <Text style={styles.emptySubtitle}>
        Hãy xem một số phim để chúng tôi có thể đề xuất phim phù hợp với bạn
      </Text>
    </View>
  );

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.loginRequiredContainer}>
          <Ionicons name="person-circle-outline" size={64} color="#666" />
          <Text style={styles.loginRequiredTitle}>Cần đăng nhập</Text>
          <Text style={styles.loginRequiredSubtitle}>
            Đăng nhập để xem đề xuất phim dựa trên lịch sử xem của bạn
          </Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => showLoginModal('recommendations')}>
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
        
        <LoginRequiredModal
          visible={loginModalVisible}
          onClose={hideLoginModal}
          featureName={currentFeatureName || 'recommendations'}
        />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Đang tải đề xuất...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.navigationHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.navigationTitle}>Đề xuất</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={recommendations}
        renderItem={renderRecommendationItem}
        keyExtractor={(item, index) => `recommendation-${item.movieId}-${index}`}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContainer}
                // ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  navigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#000',
  },
  backButton: {
    padding: 8,
  },
  navigationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  loginRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#000',
  },
  loginRequiredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  loginRequiredSubtitle: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 16,
  },
  preferencesContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 12,
  },
  preferencesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  preferenceText: {
    fontSize: 12,
    color: '#ccc',
    marginLeft: 8,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  recommendationItem: {
    width: (width - 48) / 2,
    marginBottom: 16,
  },
  recommendationContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  recommendationPoster: {
    width: '100%',
    height: 240,
    borderRadius: 12,
  },
  paidBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  paidText: {
    fontSize: 8,
    color: '#fff',
    marginLeft: 2,
    fontWeight: '500',
  },
  recommendationBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,215,0,0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendationBadgeText: {
    fontSize: 10,
    color: '#000',
    marginLeft: 2,
    fontWeight: 'bold',
  },
  recommendationGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  recommendationReason: {
    fontSize: 10,
    color: '#FFD700',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  movieInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  movieType: {
    fontSize: 10,
    color: '#ccc',
  },
  producer: {
    fontSize: 10,
    color: '#ccc',
    flex: 1,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 