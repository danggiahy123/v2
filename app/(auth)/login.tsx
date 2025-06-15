import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  Alert, 
  Image, 
  ImageBackground, 
  KeyboardAvoidingView, 
  Platform, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearError, clearMessage, sendOTP } from '../../store/slices/authSlice';
import Notification from '../../components/ui/Notification';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';

export default function BannerLogin() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, message } = useAppSelector((state) => state.auth);
  const [phone, setPhone] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);

  const [notification, setNotification] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });


  useEffect(() => {
    if (error) {
      setNotification({
        visible: true,
        message: error,
        type: 'error',
      });
      dispatch(clearError());
    }
  }, [error, dispatch]);


  useEffect(() => {
    if (message) {
      setNotification({
        visible: true,
        message: message,
        type: 'success',
      });
      dispatch(clearMessage());
    }
  }, [message, dispatch]);

  const validatePhoneNumber = (phoneNumber: string) => {
    const phoneRegex = /^(0|\+84)[0-9]{9}$/;
    return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
  };

  const onContinue = async () => {
    if (phone.trim() === '') {
      setNotification({
        visible: true,
        message: 'Vui lòng nhập số điện thoại',
        type: 'error',
      });
      return;
    }

    if (!validatePhoneNumber(phone)) {
      setNotification({
        visible: true,
        message: 'Số điện thoại không hợp lệ',
        type: 'error',
      });
      return;
    }

    if (!isAgreed) {
      setNotification({
        visible: true,
        message: 'Bạn cần đồng ý với điều kiện và điều khoản sử dụng',
        type: 'error',
      });
      return;
    }


    dispatch(clearError());
    dispatch(clearMessage());

    try {
      const result = await dispatch(sendOTP(phone));

      if (sendOTP.fulfilled.match(result)) {
   
        setNotification({
          visible: true,
          message: 'Mã OTP đã được gửi!',
          type: 'success',
        });
        router.push({
          pathname: '/(auth)/otp',
          params: { phone },
        });
      } else if (sendOTP.rejected.match(result)) {
        setNotification({
          visible: true,
          message: 'Không thể gửi mã OTP',
          type: 'error',
        });
      }
    } catch (error) {
      setNotification({
        visible: true,
        message: 'Có lỗi xảy ra, vui lòng thử lại',
        type: 'error',
      });
    }
  };

  const onLoginGoogle = () => {
    Alert.alert('Thông báo', 'Tính năng đăng nhập bằng Google sẽ sớm được cập nhật');
  };

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
