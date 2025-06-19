import React, { useEffect, useRef, useState } from 'react';
import { View, Image, FlatList, ActivityIndicator, Dimensions, StyleSheet } from 'react-native';
import { seriesService } from '../../services/seriesService';

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

  const onEndReached = () => {
    if (!isLoadingMore && banner?.movies?.length) {
      setCurrentPage(prev => prev + 1);
      loadBannerData(currentPage + 1);
    }
  };

  if (loading) return <ActivityIndicator style={{ marginVertical: 20 }} size="large" color="#E50914" />;
  if (!banner || !banner.movies?.length) return null;

  const renderItem = ({ item, index }: { item: BannerMovie; index: number }) => (
    <View style={styles.itemContainer}>
      <Image 
        source={{ uri: item.poster }} 
        style={styles.bannerImage} 
        resizeMode="cover"
      />
    </View>
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
        getItemLayout={(data, index) => ({
          length: BANNER_WIDTH + ITEM_SPACING,
          offset: (BANNER_WIDTH + ITEM_SPACING) * index,
          index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    height: BANNER_HEIGHT,
    width: '100%',
    marginTop: 8,
    marginBottom: 16,
  },
  listContainer: {
    paddingHorizontal: SCREEN_PADDING,
    gap: ITEM_SPACING,
  },
  itemContainer: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  }
});

export default Banner;