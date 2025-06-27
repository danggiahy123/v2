import React, { useEffect, useRef, useState } from 'react';
import { View, Image, FlatList, ActivityIndicator, Dimensions, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { animeService } from '../../services/animeService';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const SCREEN_PADDING = 16;
const BANNER_WIDTH = width - (SCREEN_PADDING * 2);
const BANNER_HEIGHT = Math.round(BANNER_WIDTH * 0.6); // Tỉ lệ 5:3 giống series banner
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

const AnimeBanner = () => {
  const [banner, setBanner] = useState<BannerMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    animeService.getBannerAnime({ bannerLimit: 5, showAll: false }).then(res => {
      if (res.status === 'success' && res.data?.banner?.movies) {
        setBanner(res.data.banner.movies);
      }
      setLoading(false);
    }).catch(error => {
      console.error('Error loading banner:', error);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (banner.length > 1) {
      const interval = setInterval(() => {
        const nextIndex = (currentIndex + 1) % banner.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true
        });
        setCurrentIndex(nextIndex);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentIndex, banner]);

  if (loading) return <ActivityIndicator style={{ marginVertical: 20 }} size="large" color="#E50914" />;
  if (!banner.length) return null;

  const renderItem = ({ item }: { item: BannerMovie }) => (
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
        data={banner}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `banner-${item.movieId}-${index}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        snapToInterval={BANNER_WIDTH + ITEM_SPACING}
        decelerationRate={0.8}
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
        {banner.map((_, index) => (
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

export default AnimeBanner; 