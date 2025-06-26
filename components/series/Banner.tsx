import React, { useEffect, useRef, useState } from 'react';
import { View, Image, FlatList, ActivityIndicator, Dimensions, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { seriesService } from '../../services/seriesService';
import { LinearGradient } from 'expo-linear-gradient';
// Ionicons will be used for future interactive elements
// import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const SCREEN_PADDING = 16;
const BANNER_WIDTH = width - (SCREEN_PADDING * 2);
const BANNER_HEIGHT = Math.round(BANNER_WIDTH * 0.6); // Tỉ lệ 5:3 giống FPT Play
const ITEM_SPACING = 12;
const ITEMS_PER_PAGE = 5;

interface BannerMovie {
  movieId: string;
  title: string;
  poster: string;
  description: string;
  releaseYear?: number;
  movieType: string;
  producer: string;
  genres: string[];
}

interface BannerData {
  title: string;
  type: string;
  movies: BannerMovie[];
}

const Banner = () => {
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const loadBannerData = async (page: number = 1) => {
    if (page === 1) setLoading(true);
    else setIsLoadingMore(true);

    try {
      const res = await seriesService.getBannerSeries({
        bannerLimit: ITEMS_PER_PAGE,
        limit: ITEMS_PER_PAGE * page
      });
      
      if (page === 1) {
        setBanner(res.data?.banner || null);
      } else if (res.data?.banner?.movies) {
        setBanner(prev => prev ? {
          ...prev,
          movies: [...prev.movies, ...res.data.banner.movies.filter((newMovie: BannerMovie) => 
            !prev.movies.some(existingMovie => existingMovie.movieId === newMovie.movieId)
          )]
        } : res.data.banner);
      }
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    loadBannerData();
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (banner?.movies && banner.movies.length > 1) {
      const interval = setInterval(() => {
        const nextIndex = (currentIndex + 1) % banner.movies.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true
        });
        setCurrentIndex(nextIndex);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentIndex, banner?.movies]);

  const onEndReached = () => {
    if (!isLoadingMore && banner?.movies?.length) {
      setCurrentPage(prev => prev + 1);
      loadBannerData(currentPage + 1);
    }
  };

  if (loading) return <ActivityIndicator style={{ marginVertical: 20 }} size="large" color="#E50914" />;
  if (!banner || !banner.movies?.length) return null;

  const renderItem = ({ item, index }: { item: BannerMovie; index: number }) => (
    <TouchableOpacity 
      style={styles.itemContainer}
      onPress={() => router.push(`/movie/${item.movieId}`)}
    >
      <Image 
        source={{ uri: item.poster }} 
        style={styles.bannerImage} 
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.85)']}
        style={styles.gradient}
        locations={[0, 0.6, 1]}
      >
        <View style={styles.contentContainer}>
          {item.title && (
            <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
              {item.title}
            </Text>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.bannerContainer}>
      <FlatList
        ref={flatListRef}
        data={banner.movies}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `banner-${item.movieId}-${index}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        snapToInterval={BANNER_WIDTH + ITEM_SPACING}
        decelerationRate={0.8}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isLoadingMore ? <ActivityIndicator color="#E50914" /> : null}
        snapToAlignment="center"
        initialScrollIndex={0}
        onScroll={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / (BANNER_WIDTH + ITEM_SPACING));
          if (newIndex !== currentIndex) setCurrentIndex(newIndex);
        }}
        getItemLayout={(data, index) => ({
          length: BANNER_WIDTH + ITEM_SPACING,
          offset: (BANNER_WIDTH + ITEM_SPACING) * index,
          index,
        })}
      />
      <View style={styles.paginationContainer}>
        {banner.movies.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentIndex && styles.paginationDotActive
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    height: BANNER_HEIGHT + 40, // Extra space for pagination dots
    width: '100%',
    marginTop: 20,
    marginBottom: 16,
  },
  listContainer: {
    paddingHorizontal: SCREEN_PADDING,
    gap: ITEM_SPACING,
  },
  itemContainer: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  contentContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    includeFontPadding: false,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: '#E50914',
  },
});

export default Banner;