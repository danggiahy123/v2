import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { seriesService } from '../../services/seriesService';
import { EpisodeCard } from '../movie/EpisodeCard';

interface SeriesDetailProps {
  seriesId: string;
  onClose: () => void;
}

export default function SeriesDetail({ seriesId, onClose }: SeriesDetailProps) {
  const [series, setSeries] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSeriesDetail();
  }, [seriesId]);

  const fetchSeriesDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await seriesService.getSeriesById(seriesId);
      setSeries(response.data);
    } catch (err) {
      console.error('Error fetching series detail:', err);
      setError('Không thể tải thông tin phim');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </View>
    );
  }

  if (error || !series) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.error}>
          <Ionicons name="alert-circle" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>{error || 'Không tìm thấy thông tin phim'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSeriesDetail}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Poster và thông tin cơ bản */}
        <View style={styles.hero}>
          <Image source={{ uri: series.poster_path }} style={styles.poster} />
          <View style={styles.heroInfo}>
            <Text style={styles.title}>{series.movie_title}</Text>
            <Text style={styles.description} numberOfLines={3}>
              {series.description}
            </Text>
            <View style={styles.meta}>
              <Text style={styles.metaText}>Tập: {series.total_episodes}</Text>
              <Text style={styles.metaText}>Lượt xem: {series.view_count}</Text>
              <Text style={styles.metaText}>Yêu thích: {series.favorite_count}</Text>
            </View>
          </View>
        </View>

        {/* Thể loại */}
        {series.genres && series.genres.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thể loại</Text>
            <View style={styles.genres}>
              {series.genres.map((genre: any, index: number) => (
                <View key={index} style={styles.genreTag}>
                  <Text style={styles.genreText}>{genre.genre_name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Danh sách tập */}
        {series.episodes && series.episodes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Danh sách tập</Text>
            <View style={styles.episodes}>
              {series.episodes.map((episode: any, index: number) => (
                <EpisodeCard
                  key={episode._id}
                  episode={episode}
                  moviePoster={series.poster_path}
                  movieTitle={series.movie_title}
                  onPress={() => {
                    // TODO: Implement episode press handler
                    console.log('Episode pressed:', episode);
                  }}
                  disabled={false}
                  isLocked={false}
                  showUpdateStatus={false}
                />
              ))}
            </View>
          </View>
        )}

        {/* Thông tin chi tiết */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>
          <View style={styles.details}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Quốc gia:</Text>
              <Text style={styles.detailValue}>{series.country || 'Chưa cập nhật'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Trạng thái:</Text>
              <Text style={styles.detailValue}>{series.release_status || 'Chưa cập nhật'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Giá:</Text>
              <Text style={styles.detailValue}>
                {series.is_free ? 'Miễn phí' : `${series.price} VNĐ`}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'flex-end',
    padding: 16,
    paddingTop: 50,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  hero: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#111',
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginRight: 16,
  },
  heroInfo: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 12,
  },
  meta: {
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  genres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreTag: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  genreText: {
    fontSize: 12,
    color: '#fff',
  },
  episodes: {
    gap: 8,
  },
  episodeItem: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  episodeNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  episodeNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  episodeInfo: {
    flex: 1,
  },
  episodeTitle: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  episodeDuration: {
    fontSize: 12,
    color: '#999',
  },
  details: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  detailLabel: {
    fontSize: 14,
    color: '#999',
  },
  detailValue: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
    textAlign: 'right',
  },
}); 