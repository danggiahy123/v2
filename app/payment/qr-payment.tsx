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
  SafeAreaView,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { rentalService } from '../../services/rentalService';
import { usePaymentStatus } from '../../hooks/usePaymentStatus';
import { CreateRentalResponse } from '../../types/rental';
import Notification from '../../components/ui/Notification';

export default function QRPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [orderData, setOrderData] = useState<CreateRentalResponse['data'] | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [movieId, setMovieId] = useState<string>('');
  const checkingStartedRef = useRef(false);
  const initializedRef = useRef(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'sync'>('sync');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);

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
        }
      };

      confirmPayment();
      setShowSuccessModal(true);
    }
  }, [status, movieId, router, orderData, userId]);

  // Handle payment failed
  useEffect(() => {
    if (status === 'failed' && !isCancelled) {
      setNotificationType('error');
      setNotificationMessage('Thanh toán thất bại');
      setShowNotification(true);
      setShowFailedModal(true);
    }
  }, [status, orderData, userId, resetStatus, router, isCancelled]);

  const handleCancel = useCallback(() => {
    setShowCancelModal(true);
  }, []);

  const handleConfirmCancel = () => {
    setIsCancelled(true);
    setNotificationType('sync');
    setNotificationMessage('Đã hủy thanh toán');
    setShowNotification(true);
    stopChecking();
    setShowCancelModal(false);
    
    setTimeout(() => {
      router.back();
    }, 1000); // Delay 1s để người dùng thấy thông báo hủy
  };

  const handleRetryPayment = () => {
    setShowFailedModal(false);
    if (orderData && userId) {
      resetStatus();
      checkingStartedRef.current = false;
      startChecking(orderData.orderCode, userId);
      checkingStartedRef.current = true;
    }
  };

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

  const handleWatchNow = () => {
    setShowSuccessModal(false);
    // Pass rental success flag to ensure movie screen knows about the successful payment
    router.replace(`/movie/${movieId}?autoPlay=true&rentalSuccess=true&fromPayment=true`);
  };

  const handleGoHome = () => {
    setShowSuccessModal(false);
    router.replace('/');
  };

  if (!orderData) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Thanh toán thuê phim</Text>
            <View style={styles.placeholder} />
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

        <Notification
          visible={showNotification}
          message={notificationMessage}
          type={notificationType}
          onClose={() => setShowNotification(false)}
          autoClose={notificationType !== 'sync'}
          duration={3000}
          progress={notificationType === 'sync' ? countdown : undefined}
        />

        {/* Cancel Modal */}
        {showCancelModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Xác nhận hủy thanh toán</Text>
              
              <Text style={styles.modalMessage}>
                Bạn có chắc muốn hủy thanh toán này? Đơn hàng sẽ bị hủy và không thể khôi phục.
              </Text>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleConfirmCancel}
              >
                <Text style={[styles.modalButtonText, styles.modalConfirmText]}>Xác nhận hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={[styles.modalButtonText, styles.modalCancelText]}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
              </View>
              
              <Text style={styles.modalTitle}>Thanh toán thành công!</Text>
              
              <Text style={styles.modalMessage}>
                Bạn đã thuê phim thành công. Có thể xem ngay bây giờ.
              </Text>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalWatchButton]}
                onPress={handleWatchNow}
              >
                <Text style={[styles.modalButtonText, styles.modalConfirmText]}>
                  <Ionicons name="play" size={16} /> Xem ngay
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalHomeButton]}
                onPress={handleGoHome}
              >
                <Text style={[styles.modalButtonText, styles.modalCancelText]}>
                  <Ionicons name="home" size={16} /> Về trang chủ
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Failed Modal */}
        {showFailedModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.failedIconContainer}>
                <Ionicons name="alert-circle" size={60} color="#FF6B6B" />
              </View>
              
              <Text style={styles.modalTitle}>Thanh toán thất bại</Text>
              
              <Text style={styles.modalMessage}>
                Không thể xác nhận thanh toán. Vui lòng thử lại.
              </Text>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalRetryButton]}
                onPress={handleRetryPayment}
              >
                <Text style={[styles.modalButtonText, styles.modalConfirmText]}>
                  <Ionicons name="refresh" size={16} /> Thử lại
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => router.back()}
              >
                <Text style={[styles.modalButtonText, styles.modalCancelText]}>
                  Quay lại
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#000',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 24,
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
    backgroundColor: '#D11030',
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalConfirmButton: {
    backgroundColor: '#D11030',
  },
  modalCancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmText: {
    color: '#fff',
  },
  modalCancelText: {
    color: '#888',
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  failedIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalWatchButton: {
    backgroundColor: '#D11030',
  },
  modalRetryButton: {
    backgroundColor: '#FF6B6B',
  },
  modalHomeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333',
  },
}); 