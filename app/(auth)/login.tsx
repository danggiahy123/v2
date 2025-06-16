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
      <ImageBackground
        source={{
          uri: 'https://simg.zalopay.com.vn/zlp-website/assets/nhung_bo_phim_hoat_hinh_gan_lien_voi_tuoi_tho_thumb_9d51c1a8ca.jpg',
        }}
        style={styles.imageBackground}
        imageStyle={{ resizeMode: 'cover' }}
      >
        <View style={styles.overlay} />
        <View style={styles.topContent}>
          <Text style={styles.title}>Đăng nhập / Đăng ký</Text>
        </View>
      </ImageBackground>

      <View style={styles.bottomContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nhập số điện thoại"
          placeholderTextColor="#888"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          editable={!loading}
          maxLength={15}
        />
        <View style={styles.agreeContainer}>
          <TouchableOpacity onPress={() => setIsAgreed(!isAgreed)} style={styles.checkboxContainer} disabled={loading}>
            <View style={[styles.checkbox, isAgreed && styles.checkboxChecked]} />
            <Text style={styles.agreeText}> Tôi đã đọc và đồng ý với{' '}
              <Text style={styles.linkText}>Điều kiện và điều khoản sử dụng của Tech5 Play</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, (!isAgreed || loading) && styles.buttonDisabled]}
          onPress={onContinue}
          disabled={!isAgreed || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Tiếp tục</Text>
          )}
        </TouchableOpacity>

        <View style={styles.socialButtonsContainer}>
          <TouchableOpacity style={styles.socialButton} onPress={onLoginGoogle} disabled={loading}>
            <Image
              source={{
                uri: 'https://img.icons8.com/?size=512&id=17949&format=png',
              }}
              style={styles.socialIcon}
            />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.socialButton, styles.facebookButton]} onPress={onLoginFacebook} disabled={loading}>
            <Image
              source={{
                uri: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_(2019).png',
              }}
              style={styles.socialIcon}
            />
          </TouchableOpacity>
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
  imageBackground: {
    height: '50%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  topContent: {
    zIndex: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  bottomContainer: {
    flex: 1,
    paddingHorizontal: 30,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  input: {
    height: 50,
    backgroundColor: '#222',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 18,
    color: '#fff',
    marginBottom: 20,
  },
  agreeContainer: {
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#fff',
    marginRight: 10,
    borderRadius: 4,
  },
  checkboxChecked: {
    backgroundColor: '#D32F2F',
  },
  agreeText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
    flexWrap: 'wrap',
  },
  linkText: {
    textDecorationLine: 'underline',
    color: '#D32F2F',
  },
  button: {
    height: 50,
    backgroundColor: '#D32F2F',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 20,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    marginHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  socialIcon: {
    width: 28,
    height: 28,
  },
  buttonDisabled: {
    backgroundColor: '#888',
    shadowOpacity: 0,
  },
});
