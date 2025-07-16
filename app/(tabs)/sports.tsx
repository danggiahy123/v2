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
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { sportsService } from '../../services/sportsService';
import { GridMovie } from '../../types/movie';
import { useRouter } from 'expo-router';
import { TabHeader, SearchModal, ViewAllModal } from '../../components/ui';
import { shouldShowPaidBadge, enrichMoviesWithPriceInfo } from '../../utils/moviePriceHelper';

const { width } = Dimensions.get('window');

export default function SportsScreen() {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);

  const [allSports, setAllSports] = useState<GridMovie[]>([]);
  const [nbaMovies, setNbaMovies] = useState<GridMovie[]>([]);
  const [footballMovies, setFootballMovies] = useState<GridMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [viewAllModalVisible, setViewAllModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTitle, setSelectedTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

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
      },
    }
  );

  useEffect(() => {
    loadSportsData();
  }, []);

  const loadSportsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Gọi song song tất cả API để tối ưu hiệu suất
      const [allSportsRes, nbaRes, footballRes] = await Promise.allSettled([
        sportsService.getAllSports(),
        sportsService.getNBAMovies(),
        sportsService.getFootballMovies(),
      ]);

      // Xử lý dữ liệu tất cả thể thao
      if (allSportsRes.status === 'fulfilled' && allSportsRes.value.status === 'success') {
        try {
          const enhancedAllSports = await enrichMoviesWithPriceInfo(allSportsRes.value.data || [], 3);
          setAllSports(enhancedAllSports);
        } catch (enhanceError) {
          console.warn('⚠️ Failed to enhance all sports with price info:', enhanceError);
          setAllSports(allSportsRes.value.data || []);
        }
      }

      // Xử lý dữ liệu NBA
      if (nbaRes.status === 'fulfilled' && nbaRes.value.status === 'success') {
        try {
          const enhancedNBA = await enrichMoviesWithPriceInfo(nbaRes.value.data || [], 3);
          setNbaMovies(enhancedNBA);
        } catch (enhanceError) {
          console.warn('⚠️ Failed to enhance NBA with price info:', enhanceError);
          setNbaMovies(nbaRes.value.data || []);
        }
      }

      // Xử lý dữ liệu bóng đá
      if (footballRes.status === 'fulfilled' && footballRes.value.status === 'success') {
        try {
          const enhancedFootball = await enrichMoviesWithPriceInfo(footballRes.value.data || [], 3);
          setFootballMovies(enhancedFootball);
        } catch (enhanceError) {
          console.warn('⚠️ Failed to enhance football with price info:', enhanceError);
          setFootballMovies(footballRes.value.data || []);
        }
      }

      console.log('🏃‍♂️ [Sports] Loaded data:', {
        allSports: allSportsRes.status === 'fulfilled' ? allSportsRes.value.data?.length : 0,
        nba: nbaRes.status === 'fulfilled' ? nbaRes.value.data?.length : 0,
        football: footballRes.status === 'fulfilled' ? footballRes.value.data?.length : 0,
      });

    } catch (error) {
      console.error('Error loading sports data:', error);
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSportsData();
    setRefreshing(false);
  };

  const handleMoviePress = (movie: GridMovie) => {
    const movieId = (movie as any)._id || movie.movieId;
    router.push(`/movie/${movieId}`);
  };

  const handleViewAll = (category: string, title: string, movies: GridMovie[]) => {
    setSelectedCategory(category);
    setSelectedTitle(title);
    setViewAllModalVisible(true);
  };

  const getCategoryMovies = (category: string): GridMovie[] => {
    switch (category) {
      case 'trending':
        return allSports;
      case 'sports-trending':
        return allSports;
      case 'all-sports':
        return allSports;
      case 'nba':
        return nbaMovies;
      case 'football':
        return footballMovies;
      default:
        return [];
    }
  };

  const renderMovieItem = ({ item }: { item: GridMovie }) => (
    <TouchableOpacity 
      style={styles.movieItem}
      onPress={() => handleMoviePress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.posterContainer}>
                 <Image source={{ uri: (item as any).poster_path || item.poster }} style={styles.poster} resizeMode="cover" />
        
        {/* Badge "Trả phí" cho sports trả phí */}
        {shouldShowPaidBadge(item) && (
          <View style={styles.paidBadge}>
            <Ionicons name="card" size={8} color="#fff" />
            <Text style={styles.paidBadgeText}>Trả phí</Text>
          </View>
        )}

        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.movieOverlay}
        />
        
        {/* Movie info */}
        <View style={styles.movieInfo}>
                     <Text style={styles.movieTitle} numberOfLines={2}>
             {(item as any).movie_title || item.title}
           </Text>
          {item.producer && (
            <Text style={styles.movieProducer} numberOfLines={1}>
              {item.producer}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTrendingSection = (data: GridMovie[]) => {
    if (!data || data.length === 0) return null;

    return (
      <View style={styles.trendingSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <LinearGradient
              colors={['#FF6B35', '#FF8C00']}
              style={styles.sectionIconContainer}
            >
              <Ionicons name="trophy" size={18} color="#FFF" />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Thể Thao Nổi Bật</Text>
      
          </View>
          
          <TouchableOpacity 
            style={[styles.viewAllButton, { borderColor: '#FF6B35' }]}
            onPress={() => handleViewAll('sports-trending', 'Thể Thao Nổi Bật', data)}
          >
            <Text style={[styles.viewAllText, { color: '#FF6B35' }]}>Xem tất cả</Text>
            <Ionicons name="chevron-forward" size={16} color="#FF6B35" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={data.slice(0, 10)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trendingList}
          renderItem={({ item, index }) => (
            <TouchableOpacity 
              style={styles.trendingItem}
              onPress={() => handleMoviePress(item)}
            >
              <View style={styles.rankContainer}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              <View style={styles.trendingPosterContainer}>
                <Image source={{ uri: (item as any).poster_path || item.poster }} style={styles.trendingPoster} />
                
                {/* Badge "Trả phí" cho trending sports */}
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
                  <Text style={styles.trendingTitle} numberOfLines={2}>
                    {(item as any).movie_title || item.title}
                  </Text>
                </LinearGradient>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => (item as any)._id || item.movieId}
        />
      </View>
    );
  };

    const renderSportsSection = (title: string, data: GridMovie[], category: string, icon: string, color: string) => {
    if (!data || data.length === 0) return null;

    return (
      <View style={styles.sportsSection}>
        {/* Modern Section Header */}
        <View style={styles.sportsSectionHeader}>
          <LinearGradient
            colors={[color, `${color}80`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sportsHeaderGradient}
          >
            <View style={styles.sportsHeaderContent}>
              <View style={styles.sportsHeaderLeft}>
                <View style={styles.sportsIconWrapper}>
                  <Ionicons name={icon as any} size={24} color="#FFF" />
                </View>
                <View style={styles.sportsTitleContainer}>
                  <Text style={styles.sportsSectionTitle}>{title}</Text>
                  <Text style={styles.sportsCount}>{data.length} trận đấu</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.sportsViewAllButton}
                onPress={() => handleViewAll(category, title, data)}
              >
                <Text style={styles.sportsViewAllText}>Tất cả</Text>
                <Ionicons name="chevron-forward" size={14} color="#FFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Movies List */}
        <FlatList
          data={data.slice(0, 8)}
          renderItem={({ item }) => renderEnhancedMovieItem(item, color)}
          keyExtractor={(item) => (item as any)._id || item.movieId}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sportsMoviesList}
        />
      </View>
    );
  };

  const renderEnhancedMovieItem = (item: GridMovie, accentColor: string) => (
    <TouchableOpacity 
      style={styles.enhancedMovieItem}
      onPress={() => handleMoviePress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.enhancedPosterContainer}>
        <Image 
          source={{ uri: (item as any).poster_path || item.poster }} 
          style={styles.enhancedPoster} 
          resizeMode="cover" 
        />
        
        {/* Badge "Trả phí" */}
        {shouldShowPaidBadge(item) && (
          <View style={styles.enhancedPaidBadge}>
            <Ionicons name="card" size={8} color="#fff" />
            <Text style={styles.enhancedPaidText}>Trả phí</Text>
          </View>
        )}

        {/* Accent Border */}
        <View style={[styles.accentBorder, { backgroundColor: accentColor }]} />

        {/* Movie Info Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.enhancedMovieOverlay}
        >
          <View style={styles.enhancedMovieInfo}>
            <Text style={styles.enhancedMovieTitle} numberOfLines={2}>
              {(item as any).movie_title || item.title}
            </Text>
            {item.producer && (
              <Text style={styles.enhancedMovieProducer} numberOfLines={1}>
                {item.producer}
              </Text>
            )}
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );



  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <TabHeader
          title="Thể thao"
          onSearchPress={() => setSearchVisible(true)}
          onNotificationPress={() => router.push('/notifications')}
          opacity={headerOpacity}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D32F2F" />
          <Text style={styles.loadingText}>Đang tải nội dung thể thao...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <TabHeader
          title="Thể thao"
          onSearchPress={() => setSearchVisible(true)}
          onNotificationPress={() => router.push('/notifications')}
          opacity={headerOpacity}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color="#D32F2F" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadSportsData}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <Animated.ScrollView
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#D32F2F']}
            tintColor="#D32F2F"
          />
        }
      >
        <View style={styles.content}>
          {/* Clean Sports Header */}
          <View style={styles.cleanSportsHeader}>
            {/* Simple Gradient Background */}
            <LinearGradient
              colors={['#FF6B35', '#FF8C00', '#FFB84D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.simpleGradient}
            />
            
            {/* Main Content */}
            <View style={styles.simpleContent}>
              {/* Left Section */}
              <View style={styles.leftContent}>
                <View style={styles.simpleIcon}>
                  <Ionicons name="trophy" size={24} color="#FFF" />
                </View>
                <View style={styles.textContent}>
                  <Text style={styles.cleanTitle}>THỂ THAO</Text>
                  <Text style={styles.cleanSubtitle}>Kênh thể thao hàng đầu</Text>
                </View>
              </View>
              
              {/* Right Section */}
              
            </View>
          </View>
          
          {/* Trending Section */}
          {renderTrendingSection(allSports)}
          
          {/* Sports Sections */}
          {renderSportsSection('🏀 NBA ', nbaMovies, 'nba', 'basketball', '#1E88E5')}
          {renderSportsSection('⚽ Football ', footballMovies, 'football', 'football', '#4CAF50')}
        </View>
      </Animated.ScrollView>

      {/* Animated Header Overlay */}
      <TabHeader
        title="Thể thao"
        onSearchPress={() => setSearchVisible(true)}
        onNotificationPress={() => router.push('/notifications')}
        opacity={headerOpacity}
      />

      {/* Search Modal */}
      <SearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
      />

      {/* View All Modal */}
      <ViewAllModal
        visible={viewAllModalVisible}
        onClose={() => setViewAllModalVisible(false)}
        customMovies={getCategoryMovies(selectedCategory)}
        title={selectedTitle}
        category={selectedCategory}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  countBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  moviesList: {
    paddingHorizontal: 16,
  },
  movieItem: {
    marginRight: 20,
    width: 320, // tăng từ 240
    height: 180, // tăng từ 135
  },
  posterContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
  },
  poster: {
    width: 320, // tăng từ 240
    height: 180, // tăng từ 135
    borderRadius: 8,
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
  paidBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  movieOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%', // giảm từ 50% còn 40% cho hợp với ảnh ngang
  },
  movieInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
  },
  movieTitle: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    lineHeight: 14,
  },
  movieProducer: {
    color: '#CCC',
    fontSize: 10,
  },
  // Trending Section Styles
  trendingSection: {
    marginBottom: 24,
    paddingTop: 16,
  },
  trendingList: {
    paddingLeft: 20,
    paddingTop: 15,
  },
  trendingItem: {
    width: 360, // giống NBA
    height: 200, // giống NBA
    marginRight: 16,
    position: 'relative',
  },
  rankContainer: {
    position: 'absolute',
    top: -5,
    left: -5,
    zIndex: 2,
    width: 45,
    height: 45,
    backgroundColor: '#FF6B35',
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  rankNumber: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  trendingPosterContainer: {
    width: 360, // giống NBA
    height: 200, // giống NBA
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  trendingPoster: {
    width: 360, // giống NBA
    height: 200, // giống NBA
    borderRadius: 12,
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
  trendingGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    justifyContent: 'flex-end',
    padding: 12,
  },
  trendingTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
         textShadowOffset: { width: 0, height: 1 },
     textShadowRadius: 3,
   },
      // Enhanced Sports Sections
   sportsSection: {
     marginBottom: 28,
   },
   sportsSectionHeader: {
     marginHorizontal: 16,
     marginBottom: 16,
     borderRadius: 12,
     overflow: 'hidden',
     elevation: 4,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.2,
     shadowRadius: 4,
   },
   sportsHeaderGradient: {
     padding: 16,
   },
   sportsHeaderContent: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
   },
   sportsHeaderLeft: {
     flexDirection: 'row',
     alignItems: 'center',
     flex: 1,
   },
   sportsIconWrapper: {
     width: 48,
     height: 48,
     borderRadius: 24,
     backgroundColor: 'rgba(255, 255, 255, 0.2)',
     justifyContent: 'center',
     alignItems: 'center',
     marginRight: 16,
     borderWidth: 1,
     borderColor: 'rgba(255, 255, 255, 0.3)',
   },
   sportsTitleContainer: {
     flex: 1,
   },
   sportsSectionTitle: {
     fontSize: 18,
     fontWeight: '700',
     color: '#FFF',
     marginBottom: 2,
     textShadowColor: 'rgba(0, 0, 0, 0.3)',
     textShadowOffset: { width: 0, height: 1 },
     textShadowRadius: 2,
   },
   sportsCount: {
     fontSize: 12,
     color: 'rgba(255, 255, 255, 0.8)',
     fontWeight: '600',
   },
   sportsViewAllButton: {
     flexDirection: 'row',
     alignItems: 'center',
     backgroundColor: 'rgba(255, 255, 255, 0.2)',
     borderRadius: 20,
     paddingHorizontal: 12,
     paddingVertical: 6,
     borderWidth: 1,
     borderColor: 'rgba(255, 255, 255, 0.3)',
   },
   sportsViewAllText: {
     color: '#FFF',
     fontSize: 12,
     fontWeight: '600',
     marginRight: 4,
   },
   sportsMoviesList: {
     paddingHorizontal: 16,
   },
   enhancedMovieItem: {
     marginRight: 16,
   },
   enhancedPosterContainer: {
     position: 'relative',
     borderRadius: 12,
     overflow: 'hidden',
     backgroundColor: '#1A1A1A',
     elevation: 6,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 3 },
     shadowOpacity: 0.3,
     shadowRadius: 6,
     width: 360, // tăng từ 270
     height: 200, // tăng từ 150
   },
   enhancedPoster: {
     width: 360, // tăng từ 270
     height: 200, // tăng từ 150
   },
     enhancedPaidBadge: {
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
  enhancedPaidText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 2,
  },
   accentBorder: {
     position: 'absolute',
     bottom: 0,
     left: 0,
     right: 0,
     height: 3,
   },
   enhancedMovieOverlay: {
     position: 'absolute',
     bottom: 0,
     left: 0,
     right: 0,
     height: '50%', // tăng từ 40% lên 50% cho overlay rõ hơn với ảnh ngang
     justifyContent: 'flex-end',
   },
   enhancedMovieInfo: {
     padding: 12,
   },
   enhancedMovieTitle: {
     color: '#FFF',
     fontSize: 14,
     fontWeight: '600',
     marginBottom: 4,
     lineHeight: 16,
     textShadowColor: 'rgba(0, 0, 0, 0.8)',
     textShadowOffset: { width: 0, height: 1 },
     textShadowRadius: 2,
   },
   enhancedMovieProducer: {
     color: 'rgba(255, 255, 255, 0.8)',
     fontSize: 11,
     fontWeight: '500',
   },
  // Clean Sports Header Styles
  cleanSportsHeader: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    position: 'relative',
    height: 80,
  },
  simpleGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  simpleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    height: '100%',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  simpleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  textContent: {
    flex: 1,
  },
  cleanTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cleanSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginTop: 2,
  },
  
}); 