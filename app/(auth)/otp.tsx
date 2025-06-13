import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearError, clearMessage, sendOTP, verifyOTP } from '../../store/slices/authSlice';
import Notification from '../../components/ui/Notification'; // Import Notification component

export default function OTPScreen() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { phone, loading, error, message } = useAppSelector(state => state.auth);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const [notification, setNotification] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    if (!phone) {
      router.replace('/(auth)/login' as any);
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phone, router]);

  // Show error if exists
  useEffect(() => {
    if (error) {
      setNotification({ visible: true, message: error, type: 'error' });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Show message if exists (e.g., OTP sent successfully)
  useEffect(() => {
    if (message) {
      setNotification({ visible: true, message: message, type: 'success' });
      dispatch(clearMessage());
    }
  }, [message, dispatch]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setNotification({ visible: true, message: 'Vui lòng nhập đầy đủ mã OTP', type: 'error' });
      return;
    }

    if (!phone) {
      setNotification({ visible: true, message: 'Không tìm thấy số điện thoại', type: 'error' });
      return;
    }

    try {
      const result = await dispatch(verifyOTP({ phone, otp: otpString }));

      if (verifyOTP.fulfilled.match(result)) {
        if (result.payload.data.needsRegistration) {
          // User mới - chuyển đến màn hình nhập thông tin
          router.push('/(auth)/register' as any);
        } else {
          // User đã đăng ký - đăng nhập thành công
          setNotification({
            visible: true,
            message: 'Đăng nhập thành công! Chào mừng bạn trở lại.',
            type: 'success',
          });
          router.replace('/(tabs)' as any);
        }
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      setNotification({ visible: true, message: 'Có lỗi xảy ra, vui lòng thử lại', type: 'error' });
    }
  };

  const handleResendOTP = async () => {
    if (!phone) return;

    try {
      const result = await dispatch(sendOTP(phone));
      
      if (sendOTP.fulfilled.match(result)) {
        setCountdown(300);
        setOtp(['', '', '', '', '', '']);
        setNotification({ visible: true, message: 'Đã gửi lại mã OTP', type: 'success' });
      }
    } catch (error) {
      setNotification({ visible: true, message: 'Không thể gửi lại mã OTP', type: 'error' });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Xác thực OTP</Text>
          <Text style={styles.subtitle}>
            Nhập mã 6 số đã được gửi đến {phone}
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => { inputRefs.current[index] = ref; }}
                style={[styles.otpInput, digit && styles.otpInputFilled]}
                value={digit}
                onChangeText={value => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                editable={!loading}
                textAlign="center"
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerifyOTP}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Xác thực</Text>}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.timerText}>
              Mã OTP sẽ hết hạn sau: {formatTime(countdown)}
            </Text>
            {countdown === 0 ? (
              <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
                <Text style={[styles.resendText, loading && styles.resendDisabled]}>Gửi lại mã OTP</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.resendDisabled}>Có thể gửi lại sau {formatTime(countdown)}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Thay đổi số điện thoại</Text>
          </TouchableOpacity>
        </View>

        <Notification
          visible={notification.visible}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, visible: false })}
          autoClose={true}
          duration={3000}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#888',
    marginBottom: 40,
    lineHeight: 22,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    backgroundColor: '#222',
    color: '#fff',
  },
  otpInputFilled: {
    borderColor: '#D32F2F',
    backgroundColor: '#333',
  },
  button: {
    backgroundColor: '#D32F2F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#888',
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  resendText: {
    fontSize: 16,
    color: '#D32F2F',
    fontWeight: '500',
  },
  resendDisabled: {
    fontSize: 14,
    color: '#666',
  },
  backButton: {
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#888',
  },
});
