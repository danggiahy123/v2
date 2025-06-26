import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ContinueWatchingCard, { ContinueWatchingItem } from './ContinueWatchingCard';

const { width: screenWidth } = Dimensions.get('window');

interface ContinueWatchingSectionProps {
  data: ContinueWatchingItem[];
  onViewAll: () => void;
  onItemPress: (movieId: string, hasRentalAccess?: boolean) => void;
  loading?: boolean;
  error?: string | null;
}

export const ContinueWatchingSection: React.FC<ContinueWatchingSectionProps> = ({
  data,
  onViewAll,
  onItemPress,
  loading = false,
  error = null,
}) => {
  // Don't render if no data and not loading
  if (!loading && (!data || data.length === 0)) {
    return null;
  }

  // Error state
  if (error) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tiếp tục xem</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={24} color="#666" />
          <Text style={styles.errorText}>Không thể tải danh sách phim</Text>
        </View>
      </View>
    );
  }

  // Loading state
  if (loading) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tiếp tục xem</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E50914" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  const getCardWidth = (): number => {
    if (screenWidth < 768) {
      // Mobile: Show 1.3 cards (partial next card visible)
      return screenWidth * 0.75;
    } else if (screenWidth < 1024) {
      // Tablet: Show 2.2 cards
      return screenWidth * 0.42;
    } else {
      // Desktop: Fixed width
      return 320;
    }
  };

  const renderContinueWatchingItem = ({ item, index }: { item: ContinueWatchingItem; index: number }) => (
    <ContinueWatchingCard
      item={item}
      onPress={() => onItemPress(item.movieId, item.hasRentalAccess)}
      width={getCardWidth()}
      style={index === 0 ? { marginLeft: 16 } : {}}
    />
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="play-circle-outline" size={48} color="#666" />
      <Text style={styles.emptyTitle}>Chưa có phim nào</Text>
      <Text style={styles.emptySubtitle}>
        Bắt đầu xem phim để thấy chúng ở đây
      </Text>
    </View>
  );

  return (
    <View style={styles.section}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.sectionTitle}>Tiếp tục xem</Text>
        </View>

        {data.length > 0 && (
          <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
            <Ionicons name="chevron-forward" size={16} color="#E50914" />
          </TouchableOpacity>
        )}
      </View>

      {/* Continue Watching List */}
      <FlatList
        data={data}
        horizontal
        keyExtractor={(item) => {
          // If item has episodeId, use it to create unique key
          if (item.episodeId) {
            return `${item.movieId}_${item.episodeId}`;
          }
          // Fallback to movieId if no episodeId
          return item.movieId;
        }}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        renderItem={renderContinueWatchingItem}
        ListEmptyComponent={renderEmptyComponent}
        snapToInterval={getCardWidth() + 12} // Card width + margin
        snapToAlignment="start"
        decelerationRate="fast"
        removeClippedSubviews={true}
        initialNumToRender={3}
        maxToRenderPerBatch={5}
        windowSize={10}
        getItemLayout={(data, index) => ({
          length: getCardWidth() + 12,
          offset: (getCardWidth() + 12) * index + (index === 0 ? 16 : 0),
          index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8,
  },
  countBadge: {
    backgroundColor: 'rgba(229, 9, 20, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  countText: {
    color: '#E50914',
    fontSize: 11,
    fontWeight: '600',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeAllText: {
    color: '#E50914',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  listContainer: {
    paddingRight: 16,
  },
  loadingContainer: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 16,
    borderRadius: 8,
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 8,
    fontSize: 14,
  },
  errorContainer: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#666',
    marginTop: 8,
    fontSize: 14,
  },
  emptyContainer: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 16,
    borderRadius: 8,
    width: screenWidth - 32,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtitle: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default ContinueWatchingSection; 