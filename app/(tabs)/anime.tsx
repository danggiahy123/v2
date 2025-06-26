import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  Animated,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TabHeader, SearchModal } from '../../components/ui';
import { animeService } from '../../services/animeService';
import { Banner, GenreSelector } from '../../components/anime';
import { useRouter } from 'expo-router';

type Anime = {
  _id: string;
  title: string;
  poster: string;
  producer?: string;
  movieType?: string;
};

export default function AnimeScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);
  const [searchVisible, setSearchVisible] = useState(false);
  const [genreSelectorVisible, setGenreSelectorVisible] = useState(false);
  const [trending, setTrending] = useState<Anime[]>([]);
  const [series, setSeries] = useState<Anime[]>([]);
  const [movies, setMovies] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
      }
    }
  );

  const fetchAnimeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await animeService.getAllAnime();
      const data = response.data || {};
      setTrending(data.trending || []);
      setSeries(data.series || []);
      setMovies(data.movies || []);
    } catch (err) {
      console.error('Error fetching anime data:', err);
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimeData();
  }, []);

  const renderMovieItem = ({ item }: { item: Anime }) => (
    <TouchableOpacity 
      style={styles.movieItem}
      onPress={() => router.push(`/movie/${item._id}`)}
    >
      <Image source={{ uri: item.poster }} style={styles.poster} resizeMode="cover" />
    </TouchableOpacity>
  );

  const renderSection = (title: string, data: Anime[], category: string) => {
    if (!data || data.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <FlatList
          data={data}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item._id}
          renderItem={renderMovieItem}
          contentContainerStyle={styles.movieList}
        />
      </View>
    );
  };

  const renderTrendingSection = (data: Anime[]) => {
    if (!data || data.length === 0) return null;

    return (
      <View style={styles.trendingSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Hoạt hình đang thịnh hành</Text>
        </View>
        <FlatList
          data={data.slice(0, 10)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trendingList}
          renderItem={({ item, index }) => (
            <TouchableOpacity 
              style={styles.trendingItem}
              onPress={() => router.push(`/movie/${item._id}`)}
            >
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
          keyExtractor={(item) => item._id}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <TabHeader
          title="Hoạt hình"
          onSearchPress={() => setSearchVisible(true)}
          onNotificationPress={() => {}}
          onGenrePress={() => setGenreSelectorVisible(true)}
          showGenreButton
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
          title="Hoạt hình"
          onSearchPress={() => setSearchVisible(true)}
          onNotificationPress={() => {}}
          onGenrePress={() => setGenreSelectorVisible(true)}
          showGenreButton
          opacity={headerOpacity}
        />
        <View style={styles.error}>
          <Ionicons name="alert-circle" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAnimeData}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
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
      >
        <View style={styles.content}>
          <Banner />
          {renderTrendingSection(trending)}
          {renderSection('Hoạt hình phim bộ', series, 'series')}
          {renderSection('Hoạt hình chiếu rạp', movies, 'movies')}
        </View>
      </Animated.ScrollView>

      <TabHeader 
        title="Hoạt hình"
        onSearchPress={() => setSearchVisible(true)}
        onNotificationPress={() => {}}
        onGenrePress={() => setGenreSelectorVisible(true)}
        showGenreButton
        opacity={headerOpacity}
      />

      <SearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        category="anime"
      />

      <GenreSelector
        visible={genreSelectorVisible}
        onClose={() => setGenreSelectorVisible(false)}
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
    flex: 1,
    paddingTop: 120,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
   
  },
  seeAllText: {
    color: '#B0B0B0',
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textDecorationColor: 'transparent',
  },
  movieList: {
    paddingHorizontal: 16,
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
    backgroundColor: '#D32F2F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
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
  },
  trendingGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
    justifyContent: 'flex-end',
  },
  trendingTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 