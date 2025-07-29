import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { GridMovie } from '../../types/movie';
import { shouldShowPaidBadge } from '../../utils/moviePriceHelper';

const { width } = Dimensions.get('window');

interface RecommendationItem extends GridMovie {
  reason?: string;
}

interface RecommendationsSectionProps {
  recommendations: RecommendationItem[];
  reason: string;
  preferences?: {
    topGenres: string[];
    topMovieTypes: string[];
    topProducers: string[];
  };
}

export default function RecommendationsSection({ 
  recommendations, 
  reason, 
  preferences 
}: RecommendationsSectionProps) {
  const router = useRouter();

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const renderRecommendationItem = ({ item, index }: { item: RecommendationItem; index: number }) => (
    <TouchableOpacity 
      style={styles.recommendationItem}
      onPress={() => router.push(`/movie/${item.movieId}`)}
      activeOpacity={0.8}
    >
      <View style={styles.recommendationContainer}>
        <Image source={{ uri: item.poster }} style={styles.recommendationPoster} resizeMode="cover" />
        
        {/* Paid Badge */}
        {shouldShowPaidBadge(item) && (
          <View style={styles.paidBadge}>
            <Ionicons name="card" size={8} color="#fff" />
            <Text style={styles.paidText}>Trả phí</Text>
          </View>
        )}

        {/* Recommendation Badge */}
        <View style={styles.recommendationBadge}>
          <Text style={styles.recommendationBadgeText}>Đề xuất</Text>
        </View>

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.recommendationGradient}
        >
          <Text style={styles.recommendationTitle} numberOfLines={2}>
            {item.title}
          </Text>
          
          {/* Show reason for recommendation */}
          {/* {item.reason && (
            <Text style={styles.recommendationReason} numberOfLines={1}>
              {item.reason}
            </Text>
          )} */}
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.sectionTitle}>Phim đề xuất dành cho bạn</Text>
          {/* {preferences && (
            // <Text style={styles.preferencesText}>
            //   Dựa trên: {preferences.topGenres?.slice(0, 2).join(', ')}
            // </Text>
          )} */}
        </View>
        <TouchableOpacity onPress={() => router.push('/recommendations')}>
          <Text style={styles.seeAllText}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={recommendations.slice(0, 20)}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `recommendation-${item.movieId}-${index}`}
        contentContainerStyle={styles.recommendationsList}
        renderItem={renderRecommendationItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  preferencesText: {
    fontSize: 12,
    color: '#ccc',
    fontStyle: 'italic',
  },
  seeAllText: {
    color: '#B0B0B0',
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textDecorationColor: 'transparent',
  },
  recommendationsList: {
    paddingHorizontal: 16,
  },
  recommendationItem: {
    marginRight: 12,
    width: width * 0.4,
  },
  recommendationContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  recommendationPoster: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  paidBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  paidText: {
    fontSize: 8,
    color: '#fff',
    marginLeft: 2,
    fontWeight: '500',
  },
  recommendationBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,215,0,0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendationBadgeText: {
    fontSize: 12,
    color: '#000',
    marginLeft: 2,
    fontWeight: 'bold',
  },
  recommendationGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  recommendationReason: {
    fontSize: 10,
    color: '#FFD700',
    fontStyle: 'italic',
  },
}); 