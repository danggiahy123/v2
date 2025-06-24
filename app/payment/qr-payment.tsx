import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  BackHandler,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { rentalService } from '../../services/rentalService';
import { usePaymentStatus } from '../../hooks/usePaymentStatus';
import { CreateRentalResponse } from '../../types/rental';

export default function QRPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [orderData, setOrderData] = useState<CreateRentalResponse['data'] | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [movieId, setMovieId] = useState<string>('');
  const checkingStartedRef = useRef(false);
  const initializedRef = useRef(false);

  const { status, countdown, isChecking, startChecking, stopChecking, resetStatus } = usePaymentStatus();

  // Memoize parsed params to prevent unnecessary re-renders
  const parsedParams = useMemo(() => {
    if (params.orderData && params.userId && params.movieId) {
      try {
        return {
          orderData: JSON.parse(params.orderData as string),
          userId: params.userId as string,
          movieId: params.movieId as string,
        };
      } catch (error) {
        console.error('Error parsing order data:', error);
        return null;
      }
    }
    return null;
  }, [params.orderData, params.userId, params.movieId]);

  // Initialize data once
  useEffect(() => {
    if (parsedParams && !initializedRef.current) {
      initializedRef.current = true;
      setOrderData(parsedParams.orderData);
      setUserId(parsedParams.userId);
      setMovieId(parsedParams.movieId);
    } else if (!parsedParams && initializedRef.current) {
      Alert.alert('Lỗi', 'Dữ liệu đơn hàng không hợp lệ');
      router.back();
    }
  }, [parsedParams, router]);

  // Start payment checking only once
  useEffect(() => {
    if (orderData && userId && !checkingStartedRef.current) {
      checkingStartedRef.current = true;
      startChecking(orderData.orderCode, userId);
    }
  }, [orderData, userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (checkingStartedRef.current) {
        stopChecking();
      }
    };
  }, [stopChecking]);

  // Handle payment success
  useEffect(() => {
    if (status === 'success') {
      // Khi payment status check thành công, gọi confirm payment để tạo rental
      const confirmPayment = async () => {
        try {
          if (orderData && userId) {
            await rentalService.confirmRentalPayment({ 
              orderCode: orderData.orderCode, 
              userId 
            });
          }
        } catch (error) {
          console.warn('Confirm payment error (but payment was successful):', error);
          // Không hiển thị lỗi vì payment đã thành công
        }
      };

      confirmPayment();

      Alert.alert(
        'Thanh toán thành công!',
        'Bạn đã thuê phim thành công. Có thể xem ngay bây giờ.',
        [
          {
            text: 'Xem ngay',
            onPress: () => {
              // Navigate directly to movie with playVideo flag
              router.replace(`/movie/${movieId}?autoPlay=true`);
            },
          },
          {
            text: 'Về trang chủ',
            onPress: () => {
              router.replace('/');
            },
            style: 'cancel'
          },
        ],
        { cancelable: false }
      );
    }
  }, [status, movieId, router, orderData, userId]);

  // Handle payment failed
  useEffect(() => {
    if (status === 'failed') {
      Alert.alert(
        'Thanh toán thất bại',
        'Không thể xác nhận thanh toán. Vui lòng thử lại.',
        [
          {
            text: 'Thử lại',
            onPress: () => {
              if (orderData && userId) {
                resetStatus();
                checkingStartedRef.current = false;
                startChecking(orderData.orderCode, userId);
                checkingStartedRef.current = true;
              }
            },
          },
          {
            text: 'Quay lại',
            onPress: () => router.back(),
            style: 'cancel',
          },
        ]
      );
    }
  }, [status, orderData, userId, resetStatus, router]);

  const handleCancel = useCallback(() => {
    Alert.alert(
      'Hủy thanh toán',
      'Bạn có chắc muốn hủy thanh toán? Đơn hàng sẽ bị hủy.',
      [
        { text: 'Tiếp tục thanh toán', style: 'cancel' },
        {
          text: 'Hủy thanh toán',
          style: 'destructive',
          onPress: () => {
            stopChecking();
            router.back();
          },
        },
      ]
    );
  }, [stopChecking, router]);

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleCancel();
      return true;
    });

    return () => backHandler.remove();
  }, [handleCancel]);

  const handleOpenPayOS = async () => {
    if (orderData?.checkoutUrl) {
      try {
        await rentalService.openPayOSCheckout(orderData.checkoutUrl);
      } catch {
        Alert.alert('Lỗi', 'Không thể mở trang thanh toán');
      }
    }
  };

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (status) {
      case 'checking':
        return '#FFA500';
      case 'success':
        return '#4CAF50';
      case 'failed':
        return '#FF6B6B';
      default:
        return '#007AFF';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Chờ thanh toán';
      case 'checking':
        return 'Đang kiểm tra...';
      case 'success':
        return 'Thanh toán thành công!';
      case 'failed':
        return 'Thanh toán thất bại';
      default:
        return 'Chờ thanh toán';
    }
  };

  if (!orderData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
          <Text style={styles.backButtonText}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Thanh toán thuê phim</Text>
      </View>

      {/* Payment Info */}
      <View style={styles.paymentInfo}>
        <Text style={styles.movieTitle}>{orderData.movieTitle}</Text>
        <Text style={styles.rentalType}>
          Gói thuê: {orderData.rentalType === '48h' ? 'Thuê 48 giờ' : 'Thuê 30 ngày'}
        </Text>
        <Text style={styles.amount}>
          Số tiền: {rentalService.formatPrice(orderData.amount)}
        </Text>
        <Text style={styles.orderCode}>Mã đơn hàng: {orderData.orderCode}</Text>
      </View>

      {/* Payment Status */}
      <View style={[styles.statusContainer, { backgroundColor: getStatusColor() + '20' }]}>
        <View style={styles.statusRow}>
          {isChecking && (
            <ActivityIndicator size="small" color={getStatusColor()} style={styles.statusIcon} />
          )}
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
        
        {status !== 'success' && (
          <Text style={styles.countdownText}>
            Thời gian còn lại: {formatCountdown(countdown)}
          </Text>
        )}
      </View>

      {/* QR Code Section */}
      <View style={styles.qrSection}>
        <Text style={styles.qrTitle}>Quét mã QR để thanh toán</Text>
        
        <View style={styles.qrContainer}>
          <QRCode
            value={orderData.qrCode}
            size={200}
            backgroundColor="white"
            color="black"
          />
        </View>

        <Text style={styles.qrInstructions}>
          Sử dụng app ngân hàng hoặc ví điện tử để quét mã QR
        </Text>
      </View>

      {/* Payment Info Details */}
      <View style={styles.paymentDetails}>
        <Text style={styles.detailsTitle}>Thông tin chuyển khoản</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Ngân hàng:</Text>
          <Text style={styles.detailValue}>{orderData.paymentInfo.accountName}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Số tài khoản:</Text>
          <Text style={styles.detailValue}>{orderData.paymentInfo.accountNumber}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Số tiền:</Text>
          <Text style={[styles.detailValue, styles.amountHighlight]}>
            {rentalService.formatPrice(orderData.amount)}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.payosButton} 
          onPress={handleOpenPayOS}
          disabled={status === 'success'}
        >
          <Text style={styles.payosButtonText}>Mở PayOS</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={handleCancel}
          disabled={status === 'success'}
        >
          <Text style={styles.cancelButtonText}>Hủy thanh toán</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>Hướng dẫn thanh toán:</Text>
        <Text style={styles.instructionText}>1. Quét mã QR bằng app ngân hàng</Text>
        <Text style={styles.instructionText}>2. Xác nhận thông tin chuyển khoản</Text>
        <Text style={styles.instructionText}>3. Thực hiện thanh toán</Text>
        <Text style={styles.instructionText}>4. Chờ hệ thống xác nhận (tự động)</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    paddingBottom: 40,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  paymentInfo: {
    backgroundColor: '#1a1a1a',
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  movieTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  rentalType: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  orderCode: {
    fontSize: 12,
    color: '#666',
  },
  statusContainer: {
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  statusIcon: {
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  countdownText: {
    fontSize: 14,
    color: '#666',
  },
  qrSection: {
    alignItems: 'center',
    margin: 20,
    marginTop: 0,
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  qrInstructions: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  paymentDetails: {
    backgroundColor: '#1a1a1a',
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
  },
  detailValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  amountHighlight: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    margin: 20,
    marginTop: 0,
    gap: 10,
  },
  payosButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  payosButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  instructions: {
    margin: 20,
    marginTop: 0,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },
}); 