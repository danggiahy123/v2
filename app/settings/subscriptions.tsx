import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../store/hooks';
import { rentalService } from '../../services/rentalService';
import { RentalInfo } from '../../types/rental';

export default function SubscriptionsScreen() {
  const router = useRouter();
  const auth = useAppSelector(state => state.auth);
  const userId = auth.userId;

  const [rentals, setRentals] = useState<RentalInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');

  const loadRentalsCallback = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const response = await rentalService.getRentalHistory(userId, {
        status: filter === 'all' ? undefined : filter,
        limit: 50,
      });

      setRentals(response.data.rentals);
    } catch (error) {
      console.error('Error loading rental history:', error);
      Alert.alert('Lỗi', 'Không thể tải lịch sử thuê phim');
    } finally {
      setIsLoading(false);
    }
  }, [userId, filter]);

  useEffect(() => {
    if (userId) {
      loadRentalsCallback();
    }
  }, [userId, loadRentalsCallback]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRentalsCallback();
    setRefreshing(false);
  };

  const handleCancelRental = async (rental: RentalInfo) => {
    if (!userId) return;

    const canCancel = rentalService.canCancelRental(rental);
    if (!canCancel) {
      Alert.alert('Không thể hủy', 'Chỉ có thể hủy rental trong vòng 24h đầu');
      return;
    }

    Alert.alert(
      'Xác nhận hủy rental',
      'Bạn có chắc muốn hủy rental này? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy bỏ', style: 'cancel' },
        {
          text: 'Xác nhận',
          style: 'destructive',
          onPress: async () => {
            try {
              await rentalService.cancelRental(rental._id, { userId });
              Alert.alert('Thành công', 'Đã hủy rental thành công');
              loadRentalsCallback();
            } catch {
              Alert.alert('Lỗi', 'Không thể hủy rental');
            }
          },
        },
      ]
    );
  };

  const renderRentalItem = (rental: RentalInfo) => {
    const timeInfo = rental.status === 'active' && rental.endTime
      ? rentalService.formatRemainingTime(new Date(rental.endTime).getTime() - Date.now())
      : null;

    const canCancel = rental.status === 'active' && rentalService.canCancelRental(rental);

    return (
      <TouchableOpacity
        key={rental._id}
        style={styles.rentalCard}
        onPress={() => router.push(`/movie/${rental.movieId._id}` as any)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {/* Movie Poster */}
          <View style={styles.posterContainer}>
            <Image source={{ uri: rental.movieId.poster }} style={styles.moviePoster} />
            <View style={[styles.statusIndicator, styles[`indicator_${rental.status}`]]} />
          </View>
          
          {/* Movie Info */}
          <View style={styles.movieInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.movieTitle} numberOfLines={2}>
                {rental.movieId.title}
              </Text>
              {canCancel && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => handleCancelRental(rental)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={16} color="#FF4757" />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Status and Time */}
            <View style={styles.statusTimeRow}>
              <View style={[styles.statusChip, styles[`chip_${rental.status}`]]}>
                <Text style={styles.statusLabel}>
                  {rental.status === 'active' ? 'Đang thuê' : 
                   rental.status === 'expired' ? 'Hết hạn' : 'Đã hủy'}
                </Text>
              </View>
              
              {timeInfo && rental.status === 'active' && (
                <Text style={[
                  styles.timeRemaining,
                  timeInfo.isExpiring && styles.timeExpiring
                ]}>
                  {timeInfo.formatted}
                </Text>
              )}
            </View>
            
            {/* Rental Details */}
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={14} color="#6c7b7f" />
                <Text style={styles.detailText}>
                  {rental.rentalType === '48h' ? '48 giờ' : '30 ngày'}
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <Ionicons name="wallet-outline" size={14} color="#6c7b7f" />
                <Text style={styles.priceText}>
                  {rentalService.formatPrice(rental.paymentId.amount)}
                </Text>
              </View>
            </View>
            
            {/* Rental Date */}
            <Text style={styles.rentalDate}>
              {new Date(rental.startTime).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </Text>
          </View>
        </View>
   
      </TouchableOpacity>
    );
  };

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      {[
        { key: 'all', label: 'Tất cả' },
        { key: 'active', label: 'Đang thuê' },
        { key: 'expired', label: 'Hết hạn' },
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.filterTab, filter === tab.key && styles.activeFilterTab]}
          onPress={() => setFilter(tab.key as 'all' | 'active' | 'expired')}
        >
          <Text style={[styles.filterText, filter === tab.key && styles.activeFilterText]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="film-outline" size={64} color="#666" />
      <Text style={styles.emptyTitle}>Chưa có lịch sử thuê phim</Text>
      <Text style={styles.emptySubtitle}>
        Khi bạn thuê phim, lịch sử sẽ hiển thị ở đây
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => router.push('/(tabs)/' as any)}
      >
        <Ionicons name="compass" size={20} color="#fff" />
        <Text style={styles.exploreButtonText}>Khám phá phim</Text>
      </TouchableOpacity>
    </View>
  );

  if (!userId) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Phim đăng ký</Text>
          <View style={styles.headerRight} />
        </View>

      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Phim đăng ký</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Filter Tabs */}
      {renderFilterTabs()}

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#D11030"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#D11030" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : rentals.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.rentalsList}>
            {rentals.map(renderRentalItem)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#000',
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    margin: 15,
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeFilterTab: {
    backgroundColor: '#D11030',
  },
  filterText: {
    fontSize: 14,
    color: '#aaa',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 12,
  },
  rentalsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  rentalCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
  },
  posterContainer: {
    position: 'relative',
    marginRight: 16,
  },
  moviePoster: {
    width: 80,
    height: 120,
    borderRadius: 12,
  },
  statusIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  indicator_active: {
    backgroundColor: '#4CAF50',
  },
  indicator_expired: {
    backgroundColor: '#666',
  },
  indicator_cancelled: {
    backgroundColor: '#FF4757',
  },
  movieInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  movieTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    lineHeight: 24,
  },
  cancelButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 71, 87, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  statusTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 12,
  },
  chip_active: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  chip_expired: {
    backgroundColor: 'rgba(102, 102, 102, 0.2)',
  },
  chip_cancelled: {
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  timeRemaining: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFA726',
  },
  timeExpiring: {
    color: '#FF4757',
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  detailText: {
    fontSize: 14,
    color: '#9e9e9e',
    marginLeft: 6,
    fontWeight: '500',
  },
  priceText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 6,
    fontWeight: '600',
  },
  rentalDate: {
    fontSize: 12,
    color: '#6c7b7f',
    fontWeight: '400',
  },
 
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  exploreButton: {
    backgroundColor: '#D11030',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },


 
});