import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

type Movie = {
  _id: string;
  title: string;
  poster: string;
  rating: number;
  year: number;
};

type Genre = {
  _id: string;
  genre_name: string;
  description: string;
};

export default function SeriesGenreScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genre, setGenre] = useState<Genre | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    console.log("Genre ID:", id);
    fetchGenreDetails();
    fetchMovies();
  }, [id]);

  const fetchGenreDetails = async () => {
    try {
      const response = await fetch('https://backend-app-lou3.onrender.com/api/genres');
      const data = await response.json();
      
      if (data.status === 'success' && data.data && data.data.genres) {
        const genre = data.data.genres.find((g: any) => g._id === id);
        if (genre) {
          setGenre(genre);
          console.log("Genre data loaded:", genre);
        } else {
          console.error("Genre not found with id:", id);
        }
      } else {
        console.error("Failed to get genres data:", data);
      }
    } catch (error) {
      console.error('Error fetching genre details:', error);
    }
  };

  const fetchMovies = async (pageNum = 1) => {
    if (pageNum === 1) setLoading(true);
    try {
      const response = await fetch(
        `https://backend-app-lou3.onrender.com/api/movies?genre=${id}&page=${pageNum}&limit=20&type=series`
      );
      const data = await response.json();
      if (data.status === 'success') {
        if (pageNum === 1) {
          setMovies(data.data.movies);
        } else {
          setMovies(prev => [...prev, ...data.data.movies]);
        }
        setHasMore(data.data.movies.length === 20);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      setPage(prev => prev + 1);
      fetchMovies(page + 1);
    }
  };

  const renderMovie = ({ item }: { item: Movie }) => (
    <TouchableOpacity
      style={styles.movieItem}
      onPress={() => router.push(`/movie/${item._id}`)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.poster }} style={styles.poster} />
      <Text style={styles.movieTitle} numberOfLines={2}>
        {item.title}
      </Text>
      {item.rating > 0 && (
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={12} color="#FFD700" />
          <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#fff" />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{genre?.genre_name || 'Thể loại'}</Text>
      </View>

      {movies.length > 0 ? (
        <FlatList
          data={movies}
          renderItem={renderMovie}
          keyExtractor={(item) => item._id}
          numColumns={3}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Không tìm thấy phim nào trong thể loại này</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#111',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  listContent: {
    padding: 8,
  },
  movieItem: {
    flex: 1/3,
    padding: 8,
  },
  poster: {
    width: '100%',
    aspectRatio: 2/3,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
  },
  movieTitle: {
    color: '#fff',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  rating: {
    color: '#FFD700',
    fontSize: 12,
    marginLeft: 4,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
}); 