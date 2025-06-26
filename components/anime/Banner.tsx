import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, ActivityIndicator, Dimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { animeService } from '../../services/animeService';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const BANNER_HEIGHT = height * 0.45;

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
        setCurrentIndex((prev) => {
          const next = (prev + 1) % banner.length;
          try {
            flatListRef.current?.scrollToIndex({ index: next, animated: true });
          } catch {}
          return next;
        });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banner.length]);

  if (loading) return <ActivityIndicator style={{ marginVertical: 40 }} size="large" color="#E50914" />;
  if (!banner.length) return <Text style={{ color: '#fff', textAlign: 'center', marginVertical: 40 }}>Không có dữ liệu banner</Text>;

  const renderItem = ({ item }: { item: BannerMovie }) => (
    <View style={{ width, height: BANNER_HEIGHT }}>
      <Image source={{ uri: item.poster }} style={styles.bannerImage} resizeMode="cover" />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.85)']}
        style={styles.bannerOverlay}
        locations={[0, 0.6, 1]}
      />
      <View style={styles.bannerContent}>
        <Text style={styles.bannerTitle} numberOfLines={2}>{item.title}</Text>
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.bannerButtons}>
          <TouchableOpacity 
            style={styles.playButton}
            onPress={() => router.push(`/movie/${item.movieId}`)}
          >
            <Ionicons name="play" size={16} color="#fff" />
            <Text style={styles.playButtonText}>Xem ngay</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={() => router.push(`/movie/${item.movieId}`)}
          >
            <Ionicons name="information-circle-outline" size={16} color="#fff" />
            <Text style={styles.moreButtonText}>Chi tiết</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.bannerContainer}>
      <FlatList
        ref={flatListRef}
        data={banner}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.movieId}
        renderItem={renderItem}
        onScroll={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          if (idx !== currentIndex) setCurrentIndex(idx);
        }}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(idx);
        }}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />
      <View style={styles.bannerIndicators}>
        {banner.map((_, idx) => (
          <View key={idx} style={[styles.indicator, idx === currentIndex && styles.activeIndicator]} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    height: BANNER_HEIGHT,
    width: '100%',
    position: 'relative',
    marginBottom: 16,
    left: 0,
    right: 0,
    paddingHorizontal: 0,
    backgroundColor: '#000',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  bannerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    borderRadius: 0,
  },
  bannerContent: {
    position: 'absolute',
    bottom: 36,
    left: 24,
    right: 24,
    alignItems: 'center',
    zIndex: 2,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 18,
    opacity: 0.9,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bannerButtons: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    marginTop: 8,
  },
  playButton: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 120,
    justifyContent: 'center',
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  moreButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 120,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  moreButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  bannerIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 5,
  },
  activeIndicator: {
    backgroundColor: '#E50914',
    width: 14,
    height: 14,
  },
});

export default AnimeBanner; 