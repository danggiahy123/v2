import { useLocalSearchParams } from 'expo-router';
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
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type Anime = {
  _id: string;
  title: string;
  poster: string;
};

export default function AnimeGenreScreen() {
  const { id } = useLocalSearchParams();
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [genreInfo, setGenreInfo] = useState<{ genre_name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchGenreInfo();
    // TODO: Implement API call to fetch anime by genre
    // For now using empty array since API is not available
    setAnimeList([]);
    setLoading(false);
  }, [id]);
  //link api của phim hoạt hình chia ra theo thể loại khi nào BE làm xong thì chỉ cần thay link api đó vào đây 
  const fetchGenreInfo = async () => {
    try {
      const response = await fetch('https://backend-app-lou3.onrender.com/api/genres?type=children&parent_id=6847d080101e640d01a0c37f');
      const data = await response.json();
      if (data.status === 'success' && data.data.genres) {
        const genre = data.data.genres.find((g: any) => g._id === id);
        if (genre) {
          setGenreInfo(genre);
        }
      }
    } catch (error) {
      console.error('Error fetching genre info:', error);
    }
  };

  const renderAnimeItem = ({ item }: { item: Anime }) => (
    <TouchableOpacity
      style={styles.animeItem}
      onPress={() => router.push(`/movie/${item._id}`)}
    >
      <Image source={{ uri: item.poster }} style={styles.poster} />
      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>{genreInfo?.genre_name || 'Thể loại'}</Text>
      </View>

      {animeList.length > 0 ? (
        <FlatList
          data={animeList}
          renderItem={renderAnimeItem}
          keyExtractor={(item) => item._id}
          numColumns={3}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Chưa có nội dung cho thể loại này</Text>
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
  animeItem: {
    flex: 1/3,
    padding: 8,
  },
  poster: {
    width: '100%',
    aspectRatio: 2/3,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
  },
  title: {
    color: '#fff',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
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