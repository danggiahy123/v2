import React, { useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { animeService } from '../../services/animeService';

interface AnimeDetailProps {
  animeId: string;
}

const AnimeDetail: React.FC<AnimeDetailProps> = ({ animeId }) => {
  const [anime, setAnime] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    animeService.getAnimeDetail(animeId).then(res => {
      setAnime(res.data);
      setLoading(false);
    });
  }, [animeId]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (!anime) return <Text style={{ color: '#fff', textAlign: 'center', marginTop: 40 }}>Không tìm thấy anime</Text>;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: anime.poster }} style={styles.poster} resizeMode="cover" />
      <Text style={styles.title}>{anime.title}</Text>
      <Text style={styles.genres}>{anime.genres?.map((g: any) => g.name || g).join(', ')}</Text>
      <Text style={styles.desc}>{anime.description}</Text>
      <Text style={styles.info}>Số tập: {anime.total_episodes || 1}</Text>
      <Text style={styles.info}>Giá: {anime.price_display || (anime.price === 0 ? 'Miễn phí' : anime.price + ' VNĐ')}</Text>
      <Text style={styles.info}>Trạng thái: {anime.release_status}</Text>
      {anime.episodes && anime.episodes.length > 0 && (
        <View style={{ marginTop: 18 }}>
          <Text style={styles.sectionTitle}>Danh sách tập</Text>
          {anime.episodes.map((ep: any) => (
            <View key={ep.number} style={styles.episodeItem}>
              <Text style={styles.episodeTitle}>Tập {ep.number}: {ep.title}</Text>
              {ep.duration && <Text style={styles.episodeInfo}>Thời lượng: {ep.duration} phút</Text>}
              {ep.is_locked ? <Text style={styles.episodeLocked}>Khoá</Text> : <Text style={styles.episodeUnlocked}>Xem ngay</Text>}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  poster: {
    width: '100%',
    height: 320,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#222',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  genres: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 8,
  },
  desc: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  info: {
    color: '#fff',
    fontSize: 15,
    marginBottom: 4,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  episodeItem: {
    backgroundColor: '#181818',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  episodeTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  episodeInfo: {
    color: '#aaa',
    fontSize: 13,
  },
  episodeLocked: {
    color: '#E50914',
    fontSize: 13,
    fontWeight: 'bold',
  },
  episodeUnlocked: {
    color: '#4caf50',
    fontSize: 13,
    fontWeight: 'bold',
  },
});

export default AnimeDetail; 