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
import { TabHeader, SearchModal, ViewAllModal } from '../../components/ui';
import { animeService } from '../../services/animeService';
import { genreService } from '../../services/genreService';
import { Banner, GenreSelector } from '../../components/anime';
import { useRouter } from 'expo-router';

type Anime = {
  _id: string;
  title: string;
  poster: string;
  producer?: string;
  movieType?: string;
};

// Dữ liệu phim mẫu cho Hoạt hình - Hành động
const ACTION_ANIME_MOVIES = [
  {
    _id: "683e7342602b36157f1c7bab",
    title: "The Million Dollar Conan",
    description: "Thám tử Conan bước vào một vụ án liên quan đến một triệu đô la bị đánh cắp, nơi mạng sống và sự thật bị đe dọa. #phim hoạt hình #trinh thám #anime",
    poster: "https://imagedelivery.net/qr1FX-TzU11V5mCFgmBaYg/26c05a29-e04c-41a1-45c0-9f44e3454900/public",
    producer: "TMS Entertainment",
    price: 120000,
  },
  {
    _id: "683e7290602b36157f1c7b94",
    title: "Kung Fu Panda 4",
    description: "Po trở lại trong hành trình mới, đối đầu với mối đe dọa bí ẩn và truyền lại tinh thần chiến binh rồng cho thế hệ kế tiếp. #phim hoạt hình #hành động",
    poster: "https://imagedelivery.net/qr1FX-TzU11V5mCFgmBaYg/36c75476-f15b-48f3-8490-40b4e104a300/public",
    producer: "DreamWorks Animation",
    price: 120000,
  },
  {
    _id: "683e6f83602b36157f1c7b5f",
    title: "Doraemon: Nobita và Trận Chiến Ở Hành Tinh Mini",
    description: "Phim hoạt hình Nhật Bản nổi tiếng - Doraemon và nhóm bạn tham gia hành trình giải cứu một hành tinh nhỏ bé đang bị đe dọa. Phim hoạt hình dành cho mọi lứa tuổi.",
    poster: "https://imagedelivery.net/qr1FX-TzU11V5mCFgmBaYg/082f3cf9-5d56-48b8-b4db-f1f768b85200/public",
    producer: "Toho Animation",
    price: 0,
  },
  {
    _id: "683d94d3602b36157f1c7af3",
    title: "Spider-Man: Across the Spider-Verse",
    description: "Miles Morales du hành qua đa vũ trụ và đối mặt với đội quân Spider-People, nơi cậu phải định nghĩa lại điều gì tạo nên một người hùng.",
    poster: "https://imagedelivery.net/qr1FX-TzU11V5mCFgmBaYg/43c32d74-da85-45ad-4eb2-26763d7c5500/public",
    producer: "Sony Pictures Animation, Marvel Entertainment",
    price: 100000,
  },
];

const FUNNY_ANIME_MOVIES = [
  {
    _id: "683e737c602b36157f1c7bb9",
    title: "Wallace & Gromit: Vengeance Most Fowl",
    description: "Wallace và chú chó Gromit đối mặt với một kẻ thù cũ trong cuộc phiêu lưu hoạt hình hấp dẫn và hài hước. #phim hoạt hình #phiêu lưu #hài hước",
    poster: "https://imagedelivery.net/qr1FX-TzU11V5mCFgmBaYg/ab1d5203-6d4b-471f-0556-490cb4ddfb00/public",
    producer: "Aardman Animations & Netflix",
    price: 0,
  },
  {
    _id: "683e7317602b36157f1c7ba4",
    title: "The Casagrandes Movie",
    description: "Gia đình Casagrandes bắt đầu một cuộc phiêu lưu đầy bất ngờ khi kỳ nghỉ hè trở thành một nhiệm vụ giải cứu! #phim hoạt hình #gia đình",
    poster: "https://imagedelivery.net/qr1FX-TzU11V5mCFgmBaYg/f69bb589-2ac3-4844-89e1-1364fbb9ca00/public",
    producer: "Nickelodeon Animation Studio",
    price: 0,
  },
  {
    _id: "683e7274602b36157f1c7b8d",
    title: "The Garfield Movie",
    description: "Chú mèo lười Garfield quay trở lại màn ảnh rộng trong cuộc phiêu lưu hài hước cùng người cha thất lạc và người bạn trung thành Odie. #phim hoạt hình #hài",
    poster: "https://imagedelivery.net/qr1FX-TzU11V5mCFgmBaYg/dd967b15-16a4-4f63-9987-c09a560bd100/public",
    producer: "Sony Pictures Animation",
    price: 0,
  },
  {
    _id: "683e6fdc602b36157f1c7b66",
    title: "Despicable Me",
    description: "Phim hoạt hình hài hước nổi tiếng kể về Gru - một tên ác nhân cùng đội quân Minions dễ thương thực hiện những âm mưu kỳ quặc. Phim hoạt hình vui nhộn dành cho mọi lứa tuổi.",
    poster: "https://imagedelivery.net/qr1FX-TzU11V5mCFgmBaYg/73423c86-adbe-434f-4555-3d027cbee800/public",
    producer: "Illumination Entertainment",
    price: 0,
  },
];

const HORROR_ANIME_MOVIES = [
  {
    _id: "683e735f602b36157f1c7bb2",
    title: "The Wild Robot",
    description: "Sau một vụ đắm tàu, một robot mang tên Roz sống sót trên đảo hoang và học cách sinh tồn giữa thiên nhiên hoang dã. #phim hoạt hình #phiêu lưu #gia đình",
    poster: "https://imagedelivery.net/qr1FX-TzU11V5mCFgmBaYg/33ebf60d-70a5-4a33-a6ee-2de4f19d6700/public",
    producer: "DreamWorks Animation",
    price: 0,
  },
  {
    _id: "683d94d3602b36157f1c7af3",
    title: "Spider-Man: Across the Spider-Verse",
    description: "Miles Morales du hành qua đa vũ trụ và đối mặt với đội quân Spider-People, nơi cậu phải định nghĩa lại điều gì tạo nên một người hùng.",
    poster: "https://imagedelivery.net/qr1FX-TzU11V5mCFgmBaYg/43c32d74-da85-45ad-4eb2-26763d7c5500/public",
    producer: "Sony Pictures Animation, Marvel Entertainment",
    price: 100000,
  },
];

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
  const [viewAllModalVisible, setViewAllModalVisible] = useState(false);
  const [viewAllCustomMovies, setViewAllCustomMovies] = useState<any[] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTitle, setSelectedTitle] = useState('');
  const [genreLoading, setGenreLoading] = useState(false);

  // Anime genres data
  const ANIME_GENRES = [
    { genre_name: 'Hành động', _id: '6847d080101e640d01a0c387', movie_count: 4 },
    { genre_name: 'Tình cảm', _id: '6847d080101e640d01a0c38a', movie_count: 0 },
    { genre_name: 'Hài hước', _id: '6847d080101e640d01a0c38d', movie_count: 4 },
    { genre_name: 'Kinh dị', _id: '6847d080101e640d01a0c390', movie_count: 2 },
  ];

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

  const handleGenreSelect = async (genre: any) => {
    try {
      setGenreLoading(true);
      setSelectedCategory(genre._id);
      setSelectedTitle(genre.genre_name);
      
      // Gọi API để lấy phim theo thể loại
      const response = await genreService.getMoviesByGenre(genre._id, 1, 50, true);
      const movies = response.data.movies.map((movie: any) => ({
        _id: movie._id,
        title: movie.movie_title,
        poster: movie.poster_path,
        producer: movie.producer,
        price: movie.price,
        description: movie.description
      }));
      
      setViewAllCustomMovies(movies);
      setViewAllModalVisible(true);
    } catch (error) {
      console.error('Error fetching genre movies:', error);
      setViewAllCustomMovies([]);
      setViewAllModalVisible(true);
    } finally {
      setGenreLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <TabHeader
          title="Hoạt hình"
          onSearchPress={() => setSearchVisible(true)}
          onNotificationPress={() => {}}
          showGenreSelector
          genres={ANIME_GENRES}
          onGenreSelect={handleGenreSelect}
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
          showGenreSelector
          genres={ANIME_GENRES}
          onGenreSelect={handleGenreSelect}
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
        showGenreSelector
        genres={ANIME_GENRES}
        onGenreSelect={handleGenreSelect}
        opacity={headerOpacity}
      />

      <SearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        category="anime"
      />

      <ViewAllModal
        visible={viewAllModalVisible}
        onClose={() => setViewAllModalVisible(false)}
        category={selectedCategory}
        title={selectedTitle}
        customMovies={viewAllCustomMovies || undefined}
      />

      {genreLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Đang tải phim...</Text>
        </View>
      )}
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
    paddingLeft: 20,
    paddingTop: 15,
  },
  trendingItem: {
    width: 160,
    height: 240,
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
    backgroundColor: '#D32F2F',
    borderRadius: 22.5,
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
    fontSize: 22,
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
}); 