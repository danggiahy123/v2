  import { useRouter } from 'expo-router';
  import React, { useEffect, useState } from 'react';
  import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
  } from 'react-native';
  import { LinearGradient } from 'expo-linear-gradient';
  import { Feather } from '@expo/vector-icons';
  import { useAppDispatch, useAppSelector } from '../../store/hooks';
  import { clearError, clearMessage, sendOTP } from '../../store/slices/authSlice';

  export default function BannerLogin() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { loading, error } = useAppSelector((state) => state.auth);

    const [phone, setPhone] = useState('');
    const [isAgreed, setIsAgreed] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

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

      dispatch(clearError());
      dispatch(clearMessage());

      try {
        const result = await dispatch(sendOTP(phone));
        if (sendOTP.fulfilled.match(result)) {
          console.log('✅ OTP sent successfully, navigating to OTP screen');
          router.push({
            pathname: '/(auth)/otp',
            params: { phone },
          });
        } else if (sendOTP.rejected.match(result)) {
          Alert.alert('Lỗi', (result.payload as string) || 'Không thể gửi mã OTP');
        }
      } catch (err) {
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
        <Image
          source={{ uri: 'https://i.pinimg.com/564x/e9/9d/fb/e99dfb62a2c167e7062fb9efcd3cf2f3.jpg' }}
          style={styles.backgroundImage}
          blurRadius={3}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)', '#000']}
          style={styles.gradientOverlay}
        />
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            <Text style={styles.title}>Chào mừng trở lại</Text>
            <Text style={styles.subtitle}>Đăng nhập để tiếp tục với Tech5 Play</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, isFocused && styles.inputFocused]}
                placeholder="Nhập số điện thoại"
                placeholderTextColor="#777"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                editable={!loading}
                maxLength={15}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
            </View>

            <TouchableOpacity
              onPress={() => setIsAgreed(!isAgreed)}
              style={styles.checkboxRow}
              disabled={loading}
            >
              <View style={[styles.checkboxBase, isAgreed && styles.checkboxChecked]}>
                {isAgreed && <Feather name="check" size={16} color="white" />}
              </View>
              <Text style={styles.agreeText}>
                Tôi đã đọc và đồng ý với{' '}
                <Text style={styles.linkText}>Điều kiện & Điều khoản</Text> của Tech5 Play.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onContinue} disabled={!isAgreed || loading}>
              <LinearGradient
                colors={!isAgreed || loading ? ['#555', '#333'] : ['#E53935', '#C62828']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.button}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Tiếp tục</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.separatorContainer}>
              <View style={styles.line} />
              <Text style={styles.separatorText}>Hoặc đăng nhập với</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity style={styles.socialButton} onPress={onLoginGoogle} disabled={loading}>
                <Image
                  source={{ uri: 'https://img.icons8.com/color/96/google-logo.png' }}
                  style={styles.socialIcon}
                />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton} onPress={onLoginFacebook} disabled={loading}>
                <Image
                  source={{ uri: 'https://img.icons8.com/fluency/96/facebook-new.png' }}
                  style={styles.socialIcon}
                />
                <Text style={styles.socialButtonText}>Facebook</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    backgroundImage: {
      ...StyleSheet.absoluteFillObject,
      width: '100%',
      height: '100%',
    },
    gradientOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    content: {
      paddingHorizontal: 24,
      paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    title: {
      fontSize: 34,
      fontWeight: '800',
      color: '#fff',
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: '#A0A0A0',
      textAlign: 'center',
      marginBottom: 40,
    },
    inputContainer: {
      marginBottom: 20,
    },
    input: {
      height: 55,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 12,
      paddingHorizontal: 20,
      fontSize: 16,
      color: '#fff',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    inputFocused: {
      borderColor: '#E53935',
      backgroundColor: 'rgba(229, 57, 53, 0.1)',
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 25,
    },
    checkboxBase: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: '#E53935',
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: {
      backgroundColor: '#E53935',
    },
    agreeText: {
      color: '#A0A0A0',
      fontSize: 14,
      flex: 1,
      lineHeight: 20,
    },
    linkText: {
      color: '#fff',
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
    button: {
      height: 55,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 30,
      shadowColor: '#E53935',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
    },
    buttonText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 18,
    },
    separatorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    line: {
      flex: 1,
      height: 1,
      backgroundColor: '#333',
    },
    separatorText: {
      color: '#777',
      marginHorizontal: 10,
      fontSize: 12,
    },
    socialButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    socialButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 50,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      marginHorizontal: 5,
    },
    socialIcon: {
      width: 24,
      height: 24,
      marginRight: 10,
    },
    socialButtonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 14,
    },
  });