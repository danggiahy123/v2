import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, ActivityIndicator, Dimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { animeService } from '../../services/animeService';

const { width, height } = Dimensions.get('window');
const BANNER_HEIGHT = height * 0.45;

const AnimeBanner = () => {
  const [banner, setBanner] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    animeService.getTrendingAnime({ type: 'series', limit: 5 }).then(res => {
      setBanner(res.data || []);
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

  const renderItem = ({ item }: any) => (
    <View style={{ width, height: BANNER_HEIGHT }}>
      <Image source={{ uri: item.poster }} style={styles.bannerImage} resizeMode="cover" />
      <View style={styles.bannerOverlay} />
      <View style={styles.bannerContent}>
        <Text style={styles.bannerTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.bannerButtons}>
          <TouchableOpacity style={styles.playButton}>
            <Ionicons name="play" size={16} color="#fff" />
            <Text style={styles.playButtonText}>Xem ngay</Text>
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
        keyExtractor={(item, idx) => item._id || `banner-${idx}`}
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
        {banner.map((_: any, idx: number) => (
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
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
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
    marginBottom: 18,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
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