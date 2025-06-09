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

export default function BannerLogin() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, message } = useAppSelector((state) => state.auth);
  
  const [phone, setPhone] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);

  // Show error if exists
  useEffect(() => {
    if (error) {
      Alert.alert('Lỗi', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const validatePhoneNumber = (phoneNumber: string) => {
    // Validate Vietnamese phone number
    const phoneRegex = /^(0|\+84)[0-9]{9}$/;
    return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
  };

  const onContinue = async () => {
    if (phone.trim() === '') {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
      return;
    }
    
    if (!validatePhoneNumber(phone)) {
      Alert.alert('Lỗi', 'Số điện thoại không hợp lệ');
      return;
    }
    
    if (!isAgreed) {
      Alert.alert('Thông báo', 'Bạn cần đồng ý với điều kiện và điều khoản sử dụng');
      return;
    }

    // Clear any previous errors/messages
    dispatch(clearError());
    dispatch(clearMessage());

    try {
      const result = await dispatch(sendOTP(phone));
      
      if (sendOTP.fulfilled.match(result)) {
        // Success - navigate to OTP screen
        console.log('✅ OTP sent successfully, navigating to OTP screen');
        router.push({
          pathname: '/(auth)/otp',
          params: { phone },
        });
      } else if (sendOTP.rejected.match(result)) {
        Alert.alert('Lỗi', result.payload as string || 'Không thể gửi mã OTP');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  const onLoginGoogle = () => {
    Alert.alert('Thông báo', 'Tính năng đăng nhập bằng Google sẽ sớm được cập nhật');
  };

  const onLoginFacebook = () => {
    Alert.alert('Thông báo', 'Tính năng đăng nhập bằng Facebook sẽ sớm được cập nhật');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Nửa trên ảnh nền */}
      <ImageBackground
        source={{
          uri:
            'https://simg.zalopay.com.vn/zlp-website/assets/nhung_bo_phim_hoat_hinh_gan_lien_voi_tuoi_tho_thumb_9d51c1a8ca.jpg',
        }}
        style={styles.imageBackground}
        imageStyle={{ resizeMode: 'cover' }}
      >
        <View style={styles.overlay} />
        <View style={styles.topContent}>
          <Text style={styles.title}>Đăng nhập / Đăng ký</Text>
        </View>
      </ImageBackground>

      {/* Nửa dưới nền đen */}
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

        {/* Checkbox đồng ý điều khoản */}
        <View style={styles.agreeContainer}>
          <TouchableOpacity
            onPress={() => setIsAgreed(!isAgreed)}
            style={styles.checkboxContainer}
            disabled={loading}
          >
            <View style={[styles.checkbox, isAgreed && styles.checkboxChecked]} />
            <Text style={styles.agreeText}>
              Tôi đã đọc và đồng ý với{' '}
              <Text style={styles.linkText}>Điều kiện và điều khoản sử dụng của Tech5 Play</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.button, 
            (!isAgreed || loading) && styles.buttonDisabled
          ]}
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
          <TouchableOpacity 
            style={styles.socialButton} 
            onPress={onLoginGoogle}
            disabled={loading}
          >
            <Image
              source={{
                uri: 'https://img.icons8.com/?size=512&id=17949&format=png',
              }}
              style={styles.socialIcon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, styles.facebookButton]}
            onPress={onLoginFacebook}
            disabled={loading}
          >
            <Image
              source={{
                uri: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_(2019).png',
              }}
              style={styles.socialIcon}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  