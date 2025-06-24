import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { rentalService } from '../../services/rentalService';
import { RentalOptionsModalProps } from '../../types/rental';

export const RentalOptionsModal: React.FC<RentalOptionsModalProps> = ({
  visible,
  onClose,
  movie,
  userId,
  onRentalSuccess,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedType, setSelectedType] = useState<'48h' | '30d' | null>(null);
  const router = useRouter();

  const rentalOptions = useMemo(() => {
    if (movie.is_free) return [];
    return rentalService.getRentalOptions(movie.price, movie.is_free);
  }, [movie.price, movie.is_free]);

  const handleRentMovie = async (rentalType: '48h' | '30d') => {
    if (!userId) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để thuê phim');
      return;
    }

    setIsCreating(true);
    setSelectedType(rentalType);

    try {
      const response = await rentalService.createRentalOrder({
        userId,
        movieId: movie._id,
        rentalType,
      });

      if (response.success) {
        onClose();
        
        // Navigate to QR Payment screen
        router.push({
          pathname: '/payment/qr-payment' as any,
          params: {
            orderData: JSON.stringify(response.data),
            userId,
            movieId: movie._id,
          },
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsCreating(false);
      setSelectedType(null);
    }
  };

  if (movie.is_free) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.container}>
            <Text style={styles.title}>Phim miễn phí</Text>
            <Text style={styles.subtitle}>Phim này có thể xem miễn phí</Text>
            
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Chọn gói thuê phim</Text>
              <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
                <Text style={styles.closeIconText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Movie Info */}
            <View style={styles.movieInfo}>
              {movie.poster && (
                <Image source={{ uri: movie.poster }} style={styles.moviePoster} />
              )}
              <View style={styles.movieDetails}>
                <Text style={styles.movieTitle}>{movie.title}</Text>
                <Text style={styles.originalPrice}>
                  Giá gốc: {rentalService.formatPrice(movie.price)}
                </Text>
              </View>
            </View>

            {/* Rental Options */}
            <View style={styles.optionsContainer}>
              {rentalOptions.map((option) => (
                <TouchableOpacity
                  key={option.type}
                  style={[
                    styles.optionCard,
                    selectedType === option.type && styles.optionCardSelected,
                  ]}
                  onPress={() => handleRentMovie(option.type)}
                  disabled={isCreating}
                >
                  <View style={styles.optionHeader}>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>-{option.discount}%</Text>
                    </View>
                  </View>

                  <Text style={styles.optionPrice}>
                    {rentalService.formatPrice(option.price)}
                  </Text>

                  <Text style={styles.optionDescription}>
                    {option.description} • {option.duration}
                  </Text>

                  <View style={styles.optionFeatures}>
                    <Text style={styles.featureText}>✓ Xem không giới hạn trong {option.duration}</Text>
                    <Text style={styles.featureText}>✓ Chất lượng Full HD</Text>
                    <Text style={styles.featureText}>✓ Hỗ trợ nhiều thiết bị</Text>
                  </View>

                  {isCreating && selectedType === option.type && (
                    <View style={styles.loadingOverlay}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.loadingText}>Đang tạo order...</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Terms */}
            <View style={styles.terms}>
              <Text style={styles.termsText}>
                • Thời gian thuê bắt đầu từ khi thanh toán thành công
              </Text>
              <Text style={styles.termsText}>
                • Có thể hủy trong vòng 24h đầu sau khi thuê
              </Text>
              <Text style={styles.termsText}>
                • Không thể gia hạn sau khi hết thời gian thuê
              </Text>
            </View>

            {/* Close Button */}
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
              disabled={isCreating}
            >
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
  closeIcon: {
    padding: 5,
  },
  closeIconText: {
    fontSize: 20,
    color: '#888',
  },
  movieInfo: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
  },
  moviePoster: {
    width: 60,
    height: 90,
    borderRadius: 8,
    marginRight: 15,
  },
  movieDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  originalPrice: {
    fontSize: 14,
    color: '#888',
  },
  optionsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  optionCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: '#007AFF',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  discountBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  optionPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  optionDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
  },
  optionFeatures: {
    marginTop: 5,
  },
  featureText: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 2,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
  },
  loadingText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 14,
  },
  terms: {
    padding: 20,
    paddingTop: 0,
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  closeButton: {
    backgroundColor: '#333',
    margin: 20,
    marginTop: 10,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 