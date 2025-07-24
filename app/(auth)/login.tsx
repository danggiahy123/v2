/**
 * LOGIN SCREEN - Màn hình đăng nhập/đăng ký
 * MÔ TẢ: Screen đầu tiên của auth flow, sử dụng OTP-based authentication
 * CHỨC NĂNG:
 * - Nhập số điện thoại để nhận OTP
 * - Validation số điện thoại (format Việt Nam)
 * - Checkbox đồng ý điều khoản
 * - Social login placeholders (Google, Facebook)
 * - Error handling và notifications
 * - Navigation đến OTP screen
 * FLOW: Login -> OTP -> Register (nếu user mới) -> Home
 */
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  Alert, 
  Image, 
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView, 
  Platform, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity,
  TouchableWithoutFeedback,
  View, 
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearError, clearMessage, sendOTP } from '../../store/slices/authSlice';
import { Notification } from '../../components/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';

export default function BannerLogin() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  // REDUX STATE - Lấy auth state từ store
  const { loading, error, message } = useAppSelector((state) => state.auth);
  
  // LOCAL STATE - Quản lý form và UI
  const [phone, setPhone] = useState('');                    // Số điện thoại nhập vào
  const [isAgreed, setIsAgreed] = useState(false);          // Checkbox đồng ý điều khoản
  
  // NOTIFICATION STATE - Quản lý thông báo
  const [notification, setNotification] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });


  /**
   * EFFECT HOOKS - Xử lý side effects
   */
  
  // Hiển thị error notification khi có lỗi từ Redux
  useEffect(() => {
    if (error) {
      setNotification({
        visible: true,
        message: error,
        type: 'error',
      });
      dispatch(clearError()); // Clear error sau khi hiển thị
    }
  }, [error, dispatch]);

  // Hiển thị success notification khi có message từ Redux
  useEffect(() => {
    if (message) {
      setNotification({
        visible: true,
        message: message,
        type: 'success',
      });
      dispatch(clearMessage()); // Clear message sau khi hiển thị
    }
  }, [message, dispatch]);

  /**
   * VALIDATION FUNCTIONS
   */
  
  // Validate số điện thoại theo format Việt Nam (0xxxxxxxxx hoặc +84xxxxxxxxx)
  const validatePhoneNumber = (phoneNumber: string) => {
    const phoneRegex = /^(0|\+84)[0-9]{9}$/;
    return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
  };

  /**
   * MAIN HANDLER - Xử lý đăng nhập chính
   * FLOW: Validate input -> Send OTP -> Navigate to OTP screen
   */
  const onContinue = async () => {
    // VALIDATION 1: Kiểm tra số điện thoại có được nhập không
    if (phone.trim() === '') {
      setNotification({
        visible: true,
        message: 'Vui lòng nhập số điện thoại',
        type: 'error',
      });
      return;
    }

    // VALIDATION 2: Kiểm tra format số điện thoại
    if (!validatePhoneNumber(phone)) {
      setNotification({
        visible: true,
        message: 'Số điện thoại không hợp lệ',
        type: 'error',
      });
      return;
    }

    // VALIDATION 3: Kiểm tra đã đồng ý điều khoản chưa
    if (!isAgreed) {
      setNotification({
        visible: true,
        message: 'Bạn cần đồng ý với điều kiện và điều khoản sử dụng',
        type: 'error',
      });
      return;
    }

    // Clear previous errors/messages
    dispatch(clearError());
    dispatch(clearMessage());

    try {
      // GỬI OTP - Gọi Redux action sendOTP
      const result = await dispatch(sendOTP(phone));

      if (sendOTP.fulfilled.match(result)) {
        // OTP gửi thành công - hiển thị thông báo và chuyển screen
        setNotification({
          visible: true,
          message: 'Mã OTP đã được gửi!',
          type: 'success',
        });
        
        // Navigate đến OTP screen với phone number
        router.push({
          pathname: '/(auth)/otp',
          params: { phone },
        });
      } else if (sendOTP.rejected.match(result)) {
        // OTP gửi thất bại
        setNotification({
          visible: true,
          message: 'Không thể gửi mã OTP',
          type: 'error',
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      setNotification({
        visible: true,
        message: 'Có lỗi xảy ra, vui lòng thử lại',
        type: 'error',
      });
    }
  };

  /**
   * SOCIAL LOGIN HANDLERS - Placeholder cho tương lai
   */
  
  // Google login - chưa implement, chỉ hiển thị thông báo
  const onLoginGoogle = () => {
    Alert.alert('Thông báo', 'Tính năng đăng nhập bằng Google sẽ sớm được cập nhật');
  };

  // Facebook login - chưa implement, chỉ hiển thị thông báo
  const onLoginFacebook = () => {
    Alert.alert('Thông báo', 'Tính năng đăng nhập bằng Facebook sẽ sớm được cập nhật');
  };

  return (
   <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.bannerContainer}>
        <ImageBackground
          source={{
            uri: 'https://cloude.orderhanghanquoc.com/2025/05/23/image-109.jpg',
          }}
          style={styles.imageBackground}
        >
          <BlurView intensity={20} tint="dark" style={styles.blurOverlay} />
          <LinearGradient
            colors={['rgba(0,0,0,0.92)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.92)']}
            style={styles.gradientOverlay}
          />
          <View style={styles.bannerContent}>
            <Text style={styles.title}></Text>
          </View>
        </ImageBackground>
        {/* Hiệu ứng sóng (wave) */}
        <Svg height={36} width="100%" viewBox="0 0 360 36" style={styles.waveSvg}>
          <Path d="M0 0 Q90 36 180 18 T360 18 V36 H0 Z" fill="#18181c" />
        </Svg>
      </View>

      <View style={styles.formWrapper}>
        <View style={styles.formCard}>
          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={22} color="#D32F2F" style={{ marginLeft: 10 }} />
            <TextInput
              style={styles.input}
              placeholder="Nhập số điện thoại"
              placeholderTextColor="#888"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              editable={!loading}
              maxLength={15}
              selectionColor="#D32F2F"
            />
          </View>
          <TouchableOpacity onPress={() => setIsAgreed(!isAgreed)} style={styles.checkboxContainer} disabled={loading} activeOpacity={0.7}>
            <View style={[styles.checkbox, isAgreed && styles.checkboxChecked]}>
              {isAgreed && <MaterialCommunityIcons name="check-bold" size={16} color="#fff" />}
            </View>
            <Text style={styles.agreeText}>
              Tôi đồng ý 
              <Text 
                style={styles.linkText} 
                onPress={() => router.push('/settings/terms')}
              >
                Điều khoản sử dụng
              </Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, (!isAgreed || loading) && styles.buttonDisabled]}
            onPress={onContinue}
            disabled={!isAgreed || loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#D32F2F', '#B71C1C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Tiếp tục</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.socialSection}>
            <Text style={styles.socialLabel}>Hoặc đăng nhập bằng</Text>
            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity style={styles.socialButton} onPress={onLoginGoogle} disabled={loading} activeOpacity={0.8}>
                <Image
                  source={{ uri: 'https://img.icons8.com/?size=512&id=17949&format=png' }}
                  style={styles.socialIcon}
                />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialButton, styles.facebookButton]} onPress={onLoginFacebook} disabled={loading} activeOpacity={0.8}>
                <Image
                  source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_(2019).png' }}
                  style={styles.socialIcon}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <Notification
        visible={notification.visible}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ ...notification, visible: false })}
        autoClose={true}
        duration={3000}
      />
    </KeyboardAvoidingView>
  </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  bannerContainer: {
    height: '50%',
    borderBottomLeftRadius: 44,
    borderBottomRightRadius: 44,
    overflow: 'hidden',
    marginBottom: 0,
    position: 'relative',
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  bannerContent: {
    zIndex: 3,
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 12,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  waveSvg: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    zIndex: 4,
  },
  formWrapper: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: -36,
    paddingHorizontal: 0,
  },
  formCard: {
    width: '92%',
    backgroundColor: 'rgba(24,24,28,0.92)',
    borderRadius: 32,
    padding: 32,
    marginTop: 60,
    marginBottom: 18,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(35,35,42,0.96)',
    borderRadius: 18,
    marginBottom: 22,
    borderWidth: 2,
    borderColor: '#23232a',
    height: 56,
    width: '100%',
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
  },
  input: {
    flex: 1,
    height: 56,
    backgroundColor: 'transparent',
    borderRadius: 18,
    paddingHorizontal: 16,
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    alignSelf: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D32F2F',
    borderRadius: 6,
    marginRight: 10,
    backgroundColor: '#23232a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 2,
  },
  checkboxChecked: {
    backgroundColor: '#D32F2F',
    borderColor: '#D32F2F',
  },
  agreeText: {
    color: '#bbb',
    fontSize: 13,
    fontWeight: '400',
    flexWrap: 'wrap',
  },
  linkText: {
    textDecorationLine: 'underline',
    color: '#D32F2F',
    fontWeight: '700',
  },
  button: {
    height: 56,
    width: '100%',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  buttonGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 21,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  socialSection: {
    alignItems: 'center',
    marginTop: 10,
  },
  socialLabel: {
    color: '#bbb',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 2,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    marginHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  socialIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
});
