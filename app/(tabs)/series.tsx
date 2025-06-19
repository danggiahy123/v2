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

    import TabHeader from '../../components/ui/TabHeader';
    import SearchModal from '../../components/ui/SearchModal';
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
            seriesService.getTrendingSeries(),
            seriesService.getVietnameseSeries(),
            seriesService.getAnimeSeries(),
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

      const renderMovieItem = ({ item }: { item: Movie }) => (
        <TouchableOpacity style={styles.movieItem}>
          <Image source={{ uri: item.poster }} style={styles.poster} />
        </TouchableOpacity>
      );

      const renderSection = (title: string, data: Movie[]) => {
        if (!data || data.length === 0) return null;

        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
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
              {renderSection('Phim bộ dành cho bạn', recommended)}
              {renderSection('Phim bộ đang thịnh hành', trending)}
              {renderSection('Phim bộ Việt Nam', vietnamese)}
              {renderSection('Anime / Hoạt hình', anime)}
            </View>
          </Animated.ScrollView>

          <SearchModal
            visible={searchVisible}
            onClose={() => setSearchVisible(false)}
            category="series"
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
    });
