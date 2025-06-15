import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { movieService } from '../services/movieService';
import type { GridMovie } from '../types/movie';

const { width } = Dimensions.get('window');
const ITEMS_PER_PAGE = 20;

interface MovieListProps {
  category: string;
  title: string;
  onClose?: () => void;
}

export default function MovieList({ category, title, onClose }: MovieListProps) {
  const [movies, setMovies] = useState<GridMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    loadMovies();
  }, [category]);

  const loadMovies = async (isLoadingMore = false) => {
    if (!isLoadingMore) setLoading(true);
    try {
      let response;
      console.log('Loading movies for category:', category);
      switch (category) {
        case 'trending':
          response = await movieService.getTrending(ITEMS_PER_PAGE);
          break;
        case 'toprated':
          response = await movieService.getTopRated(ITEMS_PER_PAGE);
          break;
        case 'sports':
          response = await movieService.getSports({ limit: ITEMS_PER_PAGE, status: 'released' });
          break;
        case 'anime':
          response = await movieService.getAnime(ITEMS_PER_PAGE);
          break;
        case 'vietnamese':
          response = await movieService.getVietnamese(ITEMS_PER_PAGE);
          break;
        case 'comingsoon':
          response = await movieService.getComingSoon({ limit: ITEMS_PER_PAGE, days: 30 });
          break;
        case 'recommended':
          response = await movieService.getNewReleases({ limit: ITEMS_PER_PAGE, days: 30 });
          break;
        default:
          response = await movieService.getNewReleases({ limit: ITEMS_PER_PAGE, days: 30 });
      }

      console.log('API Response:', response);
      if (response.status === 'success' && response.data) {
        let newMovies: GridMovie[] = [];
        
        if (category === 'recommended' && 'recommended' in response.data) {
          newMovies = response.data.recommended.movies;
        } else if ('movies' in response.data) {
          newMovies = response.data.movies;
        }
        
        console.log('New movies loaded:', newMovies.length);
        if (isLoadingMore) {
          setMovies(prev => [...prev, ...newMovies]);
        } else {
          setMovies(newMovies);
        }
        setHasMore(newMovies.length === ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error('Error loading movies:', error);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!hasMore || isLoadingMore || loading) return;
    setIsLoadingMore(true);
    setPage(prev => prev + 1);
    loadMovies(true);
  };

  const renderMovie = ({ item }: { item: GridMovie }) => (
    <TouchableOpacity style={styles.movieItem} activeOpacity={0.7}>
      <Image source={{ uri: item.poster }} style={styles.moviePoster} resizeMode="cover" />
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.movieType}>{item.movieType}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#999" />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      </View>

      <FlatList
        data={movies}
        renderItem={renderMovie}
        keyExtractor={(item, index) => `${category}-${item.movieId}-${index}`}
        numColumns={2}
        contentContainerStyle={styles.movieGrid}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: StatusBar.currentHeight || 0,
    paddingBottom: 8,
    paddingHorizontal: 12,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
    flex: 1,
  },
  backButton: {
    padding: 8,
  },
  movieGrid: {
    padding: 8,
  },
  movieItem: {
    width: (width - 32) / 2,
    margin: 4,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
  },
  moviePoster: {
    width: '100%',
    aspectRatio: 2/3,
    backgroundColor: '#333',
  },
  movieInfo: {
    padding: 8,
  },
  movieTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  movieType: {
    fontSize: 12,
    color: '#999',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
}); 