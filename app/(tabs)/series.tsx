    import { Ionicons } from '@expo/vector-icons';
    import React, { useEffect, useRef, useState } from 'react';
    import {
      ScrollView,
      StatusBar,
      StyleSheet,
      Text,
      View,
      Animated,
      FlatList,
      Image,
      ActivityIndicator,
      TouchableOpacity,
    } from 'react-native';
    import { LinearGradient } from 'expo-linear-gradient';

    import { TabHeader, SearchModal, ViewAllModal } from '../../components/ui';
    import { seriesService } from '../../services/seriesService';
    import Banner from '../../components/series/Banner';

    type Movie = {
      movieId: string;
      title: string;
      poster: string;
      producer: string;
      movieType: string;
    };

    export default function SeriesScreen() {
      const scrollY = useRef(new Animated.Value(0)).current;
      const headerOpacity = useRef(new Animated.Value(1)).current;
      const lastScrollY = useRef(0);
      const [searchVisible, setSearchVisible] = useState(false);
      const [viewAllModalVisible, setViewAllModalVisible] = useState(false);
      const [selectedCategory, setSelectedCategory] = useState('');
      const [selectedTitle, setSelectedTitle] = useState('');

      // State cho data
      const [recommended, setRecommended] = useState<Movie[]>([]);
      const [trending, setTrending] = useState<Movie[]>([]);
      const [vietnamese, setVietnamese] = useState<Movie[]>([]);
      const [anime, setAnime] = useState<Movie[]>([]);
      const [loading, setLoading] = useState(true);
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
        fetchSeriesData();
      }, []);

      const fetchSeriesData = async () => {
        try {
          setLoading(true);
          setError(null);

          // Fetch các phần còn lại, bỏ banner (đã có component Banner riêng)
          const [trendingRes, vietnameseRes, animeRes] = await Promise.all([
            seriesService.getTrendingSeries({ limit: 10 }),
            seriesService.getVietnameseSeries({ limit: 10 }),
            seriesService.getAnimeSeries({ limit: 10 }),
          ]);

          // Lấy đúng trường dữ liệu từ backend mới
          const extractMovies = (res: any) => (res.data?.movies || res.data || []);
          const convertToMovie = (series: any) => ({
            movieId: series.movieId || series._id,
            title: series.title || series.movie_title,
            poster: series.poster || series.poster_path,
            producer: series.producer || '',
            movieType: series.movieType || series.movie_type || '',
          });

          setTrending(extractMovies(trendingRes).map(convertToMovie));
          setVietnamese(extractMovies(vietnameseRes).map(convertToMovie));
          setAnime(extractMovies(animeRes).map(convertToMovie));
          setRecommended(extractMovies(trendingRes).map(convertToMovie));

        } catch (err) {
          console.error('Error fetching series data:', err);
          setError('Có lỗi xảy ra khi tải dữ liệu');
        } finally {
          setLoading(false);
        }
      };

      const handleViewAll = (category: string, title: string) => {
        setSelectedCategory(category);
        setSelectedTitle(title);
        setViewAllModalVisible(true);
      };

      const renderMovieItem = ({ item }: { item: Movie }) => (
        <TouchableOpacity style={styles.movieItem}>
          <Image source={{ uri: item.poster }} style={styles.poster} />
        </TouchableOpacity>
      );

      const renderSection = (title: string, data: Movie[], category: string) => {
        if (!data || data.length === 0) return null;

        return (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{title}</Text>
              <TouchableOpacity onPress={() => handleViewAll(category, title)}>
                <Text style={styles.seeAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={data}
              renderItem={renderMovieItem}
              keyExtractor={(item) => item.movieId}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.movieList}
            />
          </View>
        );
      };

      if (loading) {
        return (
          <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <TabHeader
              title="Phim bộ"
              onSearchPress={() => setSearchVisible(true)}
              onNotificationPress={() => {}}
              opacity={headerOpacity}
            />
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
          </View>
        );
      }

      if (error) {
        return (
          <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <TabHeader
              title="Phim bộ"
              onSearchPress={() => setSearchVisible(true)}
              onNotificationPress={() => {}}
              opacity={headerOpacity}
            />
            <View style={styles.error}>
              <Ionicons name="alert-circle" size={48} color="#ff6b6b" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchSeriesData}>
                <Text style={styles.retryButtonText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }

      return (
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <TabHeader
            title="Phim bộ"
            onSearchPress={() => setSearchVisible(true)}
            onNotificationPress={() => {}}
            opacity={headerOpacity}
          />

          <Animated.ScrollView
            style={styles.scrollView}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <Banner />
              <View style={styles.trendingSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Top Phim Bộ Xu Hướng</Text>
                  <TouchableOpacity onPress={() => handleViewAll('trending', 'Top Phim Bộ Xu Hướng')}>
                    <Text style={styles.seeAllText}>Xem tất cả</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={trending.slice(0, 10)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.trendingList}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity style={styles.trendingItem}>
                      <View style={styles.rankContainer}>
                        <Text style={styles.rankNumber}>{index + 1}</Text>
                      </View>
                      <Image source={{ uri: item.poster }} style={styles.trendingPoster} />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.9)']}
                        style={styles.trendingGradient}
                      >
                        <Text style={styles.trendingTitle} numberOfLines={2}>{item.title}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item.movieId}
                />
              </View>
              {renderSection('Phim bộ dành cho bạn', recommended, 'recommended')}
              {renderSection('Phim bộ Việt Nam', vietnamese, 'vietnamese')}
              {renderSection('Phim bộ Anime', anime, 'anime')}
            </View>
          </Animated.ScrollView>

          <SearchModal
            visible={searchVisible}
            onClose={() => setSearchVisible(false)}
            category="series"
          />

          <ViewAllModal
            visible={viewAllModalVisible}
            onClose={() => setViewAllModalVisible(false)}
            category={selectedCategory}
            title={selectedTitle}
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
      section: {
        marginBottom: 24,
      },
      sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 12,
        paddingHorizontal: 16,
      },
      movieList: {
        paddingLeft: 15,
      },
      movieItem: {
        marginRight: 20,
      },
      poster: {
        width: 120,
        height: 180,
        borderRadius: 8,
        backgroundColor: '#1a1a1a',
      },
      loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      loadingText: {
        color: '#fff',
        marginTop: 16,
      },
      error: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      },
      errorText: {
        color: '#ff6b6b',
        fontSize: 16,
        marginTop: 16,
        textAlign: 'center',
      },
      retryButton: {
        backgroundColor: '#E50914',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 16,
      },
      retryButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
      },
      trendingSection: {
        marginBottom: 24,
        paddingTop: 16,
      },
      trendingList: {
        paddingLeft: 15,
        paddingTop: 8,
      },
      trendingItem: {
        width: 160,
        height: 240,
        marginRight: 16,
        position: 'relative',
      },
      rankContainer: {
        position: 'absolute',
        top: -10,
        left: -10,
        zIndex: 2,
        width: 40,
        height: 40,
        backgroundColor: '#D32F2F',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
       
      },
      rankNumber: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
      },
      trendingPoster: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
        backgroundColor: '#1a1a1a',
     
      },
      trendingGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
        padding: 12,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        justifyContent: 'flex-end',
      },
      trendingTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
      sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 16,
      },
      seeAllText: {
        color: '#B0B0B0',
        fontSize: 15,
        fontWeight: '600',
        textDecorationLine: 'underline',
        textDecorationColor: 'transparent',
      },
    });
