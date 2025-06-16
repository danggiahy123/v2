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
} from 'react-native';

import TabHeader from '../../components/ui/TabHeader';

type Movie = {
  movieId: string;
  title: string;
  poster: string;
  producer: string;
};

type SectionData = {
  title: string;
  type: string;
  movies: Movie[];
};

export default function SeriesScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);

  const [banner, setBanner] = useState<Movie[]>([]);
  const [recommended, setRecommended] = useState<Movie[]>([]);
  const [trending, setTrending] = useState<Movie[]>([]);
  const [vietnamese, setVietnamese] = useState<Movie[]>([]);
  const [anime, setAnime] = useState<Movie[]>([]);
  const [korean, setKorean] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

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
    const fetchData = async () => {
      try {
        const [
          bannerRes,
          trendingRes,
          vietnameseRes,
          animeRes,
          koreanRes,
        ] = await Promise.all([
          fetch('/api/series/banner-series'),
          fetch('/api/series/trending'),
          fetch('/api/series/vietnamese'),
          fetch('/api/series/anime'),
          fetch('/api/series/korean'),
        ]);

        const bannerJson = await bannerRes.json();
        const trendingJson = await trendingRes.json();
        const vietnameseJson = await vietnameseRes.json();
        const animeJson = await animeRes.json();
        const koreanJson = await koreanRes.json();

        setBanner(bannerJson.data.banner.movies || []);
        setRecommended(bannerJson.data.recommended.movies || []);
        setTrending(trendingJson.data.movies || []);
        setVietnamese(vietnameseJson.data.movies || []);
        setAnime(animeJson.data.movies || []);
        setKorean(koreanJson.data.movies || []);
      } catch (error) {
        console.error('Error fetching series data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderMovieItem = ({ item }: { item: Movie }) => (
    <View style={styles.movieItem}>
      <Image source={{ uri: item.poster }} style={styles.poster} />
      <Text style={styles.title}>{item.title}</Text>
    </View>
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
          horizontal={false}
          numColumns={3}
          scrollEnabled={false}
        />
      </View>
    );
  };

  const renderBanner = () => {
    if (!banner || banner.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Phim bộ mới ra mắt</Text>
        <FlatList
          data={banner}
          renderItem={({ item }) => (
            <Image source={{ uri: item.poster }} style={styles.bannerImage} />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.movieId}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <Animated.ScrollView
          style={styles.scrollView}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View style={styles.content}>
            {renderBanner()}
            {renderSection('Phim bộ dành cho bạn', recommended)}
            {renderSection('Phim bộ đang thịnh hành', trending)}
            {renderSection('Phim bộ Việt Nam', vietnamese)}
            {renderSection('Anime / Hoạt hình', anime)}
            {renderSection('Phim bộ Hàn Quốc', korean)}
          </View>
        </Animated.ScrollView>
      )}

      <TabHeader
        title="Phim bộ"
        onSearchPress={() => {}}
        onNotificationPress={() => {}}
        opacity={headerOpacity}
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
    paddingTop: 100,
    paddingHorizontal: 12,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  movieItem: {
    width: '31%',
    margin: '1%',
    alignItems: 'center',
  },
  poster: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
    resizeMode: 'cover',
  },
  title: {
    fontSize: 13,
    color: '#fff',
    textAlign: 'center',
  },
  bannerImage: {
    width: 250,
    height: 150,
    borderRadius: 12,
    marginRight: 12,
    resizeMode: 'cover',
  },
});
