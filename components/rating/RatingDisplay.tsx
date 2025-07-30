import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StarRating from './StarRating';

interface RatingStats {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface RatingItem {
  _id: string;
  user: {
    _id: string;
    full_name?: string;
    email: string;
    avatar?: string; // Added avatar field
  };
  star_rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

interface RatingDisplayProps {
  movieStats: RatingStats;
  ratings: RatingItem[];
  onRatePress: () => void;
  onLoadMore?: () => void;
  loading?: boolean;
  hasMore?: boolean;
  currentUserRating?: {
    _id: string;
    star_rating: number;
    comment: string;
  } | null;
  canRate?: boolean;
  rateDisabledReason?: string;
}

const RatingDisplay: React.FC<RatingDisplayProps> = ({
  movieStats,
  ratings,
  onRatePress,
  onLoadMore,
  loading = false,
  hasMore = false,
  currentUserRating,
  canRate = true,
  rateDisabledReason = '',
}) => {

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} tuần trước`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} tháng trước`;
    return `${Math.ceil(diffDays / 365)} năm trước`;
  };

  // Thêm hàm formatTimeAgo
  function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
  }

  const getStarPercentage = (starCount: number): number => {
    if (safeMovieStats.totalRatings === 0) return 0;
    return (safeDistribution[starCount as keyof typeof safeDistribution] / safeMovieStats.totalRatings) * 100;
  };

  const renderRatingItem = ({ item }: { item: RatingItem }) => {
    // Lấy tên hiển thị: ưu tiên full_name, cuối cùng là phần trước @ của email
    const displayName = item.user.full_name || (item.user.email ? item.user.email.split('@')[0] : 'Ẩn danh');
    // Xác định thời gian hiển thị: nếu updatedAt khác createdAt thì là đã chỉnh sửa
    const created = new Date(item.createdAt);
    const updated = new Date(item.updatedAt);
    let timeLabel = '';
    if (updated.getTime() !== created.getTime()) {
      timeLabel = ` ${formatTimeAgo(item.updatedAt)}`;
    } else {
      timeLabel = formatTimeAgo(item.createdAt);
    }
    return (
      <View style={styles.ratingItem}>
        <View style={styles.ratingHeader}>
          <View style={styles.userInfo}>
            {/* Avatar user */}
            {item.user.avatar ? (
              <Image source={{ uri: item.user.avatar }} style={styles.userAvatarImg} />
            ) : (
              <View style={styles.userAvatar}>
                <Text style={styles.userInitial}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {displayName}
              </Text>
              <Text style={styles.ratingDate}>
                {timeLabel}
              </Text>
            </View>
          </View>
          <View style={styles.ratingValue}>
            <StarRating
              rating={item.star_rating}
              readonly={true}
              size={16}
              showRating={false}
              showText={false}
              starColor="#FFD700"
            />
          </View>
        </View>
        {item.comment && (
          <Text style={styles.ratingComment}>
            {item.comment}
          </Text>
        )}
      </View>
    );
  };

  const renderStarDistribution = () => (
    <View style={styles.distributionContainer}>
      {[5, 4, 3, 2, 1].map((star) => (
        <View key={star} style={styles.distributionRow}>
          <Text style={styles.starNumber}>{star}</Text>
          <Ionicons name="star" size={14} color="#FFD700" />
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${getStarPercentage(star)}%` }
              ]} 
            />
          </View>
          <Text style={styles.starCount}>
            {safeDistribution[star as keyof typeof safeDistribution]}
          </Text>
        </View>
      ))}
    </View>
  );

  // Đảm bảo ratings luôn là mảng
  const safeRatings = Array.isArray(ratings) ? ratings : [];
  // Đảm bảo movieStats và ratingDistribution luôn hợp lệ
  const safeMovieStats = movieStats || { averageRating: 0, totalRatings: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  const safeDistribution = safeMovieStats.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  return (
    <View style={styles.container}>
      {/* Overall Rating */}
      <View style={styles.overallRating}>
        <View style={styles.ratingScore}>
          <Text style={styles.averageRating}>
            {safeMovieStats.averageRating.toFixed(1)}
          </Text>
          <StarRating
            rating={safeMovieStats.averageRating}
            readonly={true}
            size={20}
            showRating={false}
            showText={false}
          />
          <Text style={styles.totalRatings}>
            {safeMovieStats.totalRatings} đánh giá
          </Text>
        </View>
        <View style={styles.distributionSection}>
          {renderStarDistribution()}
        </View>
      </View>

      {/* Rating Guide - hướng dẫn sử dụng chức năng đánh giá */}
      {(!canRate) && (
        <View style={styles.guideContainer}>
          <Text style={styles.guideText}>
            Để gửi đánh giá, hãy đăng nhập và hoàn thành việc xem phim hoặc thuê phim để mở khóa chức năng đánh giá.
          </Text>
        </View>
      )}

      {/* Rate Button */}
      <TouchableOpacity
        style={[
          styles.rateButton, 
          styles.notRatedButton,
          (loading || !canRate) && styles.disabledButton
        ]}
        onPress={() => {
          if (!canRate && rateDisabledReason) {
            alert(rateDisabledReason);
            return;
          }
          onRatePress();
        }}
        disabled={loading || !canRate}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
                      <Text style={[
              styles.rateButtonText,
              styles.notRatedButtonText
            ]}>
              {currentUserRating ? 'Sửa đánh giá' : 'Đánh giá phim'}
            </Text>
        )}
      </TouchableOpacity>

      {/* Current User Rating */}
      {currentUserRating && (
        <View style={styles.userRatingPreview}>
          <Text style={styles.userRatingTitle}>Đánh giá của bạn</Text>
          <View style={styles.userRatingContent}>
            <StarRating
              rating={currentUserRating.star_rating}
              readonly={true}
              size={16}
              showRating={false}
              showText={false}
            />
            {currentUserRating.comment && (
              <Text style={styles.userRatingComment}>
                "{currentUserRating.comment}"
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Ratings List */}
      <View style={styles.ratingsSection}>
        <Text style={styles.sectionTitle}>
          Đánh giá từ người dùng ({safeRatings.length})
        </Text>
        
        <FlatList
          data={safeRatings}
          renderItem={renderRatingItem}
          keyExtractor={(item) => item._id}
          style={styles.ratingsList}
          showsVerticalScrollIndicator={false}
          onEndReached={hasMore ? onLoadMore : undefined}
          onEndReachedThreshold={0.1}
          scrollEnabled={false} // Disable scroll to avoid nested scroll
        />
        
        {hasMore && (
          <TouchableOpacity style={styles.loadMoreButton} onPress={onLoadMore}>
            <Text style={styles.loadMoreText}>Xem thêm đánh giá</Text>
            <Ionicons name="chevron-down" size={16} color="#FFD700" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
  },
  overallRating: {
    padding: 20,
    backgroundColor: '#111',
    borderRadius: 12,
    margin: 16,
    // borderWidth: 1,
    // borderColor: '#D11030',
  },
  ratingScore: {
    alignItems: 'center',
    marginBottom: 20,
  },
  averageRating: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 8,
  },
  totalRatings: {
    fontSize: 14,
    color: '#fff',
    marginTop: 8,
    fontWeight: 'bold',
  },
  distributionSection: {
    marginTop: 12,
  },
  distributionContainer: {
    gap: 4,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    width: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#222',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffff',
    borderRadius: 4,
  },
  starCount: {
    fontSize: 12,
    color: '#ffff',
    width: 20,
    textAlign: 'right',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  rateButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  userRatingPreview: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,

  },
  userRatingTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 8,
  },
  userRatingContent: {
    gap: 8,
  },
  userRatingComment: {
    fontSize: 14,
    color: '#fff',
    fontStyle: 'italic',
  },
  ratingsSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  ratingsList: {
    maxHeight: 400,
   
  },
  ratingItem: {
    paddingVertical: 16,

  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  ratingDate: {
    fontSize: 12,
    color: '#fff',
    marginTop: 2,
  },
  ratingValue: {
    marginLeft: 12,
  },
  ratingComment: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
    marginLeft: 48,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  loadMoreText: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '500',
  },
  userAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: '#222',
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: '#333',
    borderColor: '#555',
    shadowOpacity: 0.1,
    elevation: 1,
  },
  guideContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  guideText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'left',
    lineHeight: 20,
  },
  ratedButton: {
    backgroundColor: '#FFD700',
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  notRatedButton: {
    backgroundColor: '#D11030',
    borderWidth: 2,
    borderColor: '#D11030',
    shadowColor: '#D11030',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  ratedButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  notRatedButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default RatingDisplay; 