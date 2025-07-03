import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearError, clearMessage, completeRegistration } from '../../store/slices/authSlice';
import { Notification } from '../../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, message } = useAppSelector((state) => state.auth);

  const [notification, setNotification] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error',
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  useEffect(() => {
    if (error) {
      setNotification({ visible: true, message: error, type: 'error' });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (message) {
      setNotification({ visible: true, message: message, type: 'success' });
      dispatch(clearMessage());
    }
  }, [message, dispatch]);

  const handleCompleteRegistration = async () => {
    if (!fullName.trim()) {
      setNotification({ visible: true, message: 'Vui lòng nhập họ và tên', type: 'error' });
      return;
    }

    if (!email.trim()) {
      setNotification({ visible: true, message: 'Vui lòng nhập email', type: 'error' });
      return;
    }

    if (!validateEmail(email)) {
      setNotification({ visible: true, message: 'Email không hợp lệ', type: 'error' });
      return;
    }

    try {
      const result = await dispatch(completeRegistration({
        full_name: fullName.trim(),
        email: email.trim(),
        gender: gender,
      }));

      if (completeRegistration.fulfilled.match(result)) {
        setNotification({
          visible: true,
          message: 'Đăng ký thành công. Chào mừng bạn đến với ứng dụng!',
          type: 'success',
        });
        router.replace('/(tabs)' as any);
      }
    } catch (error) {
      console.error('Complete registration error:', error);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        {/* Header with gradient */}
        <LinearGradient
          colors={['#000', 'transparent']}
          style={styles.headerGradient}
          pointerEvents="none"
        />
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={30} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đăng ký tài khoản</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.welcomeSection}>
              <View style={styles.iconContainer}>
                <Ionicons name="person-add" size={40} color="#D32F2F" />
              </View>
              <Text style={styles.title}>Hoàn tất đăng ký</Text>
              <Text style={styles.subtitle}>
                Vui lòng nhập thông tin để hoàn tất quá trình đăng ký
              </Text>
            </View>

            <View style={styles.formSection}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Họ và tên</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nguyễn Văn A"
                    placeholderTextColor="#666"
                    value={fullName}
                    onChangeText={setFullName}
                    editable={!loading}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="example@gmail.com"
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Giới tính</Text>
                <View style={styles.genderContainer}>
                  <TouchableOpacity
                    style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
                    onPress={() => setGender('male')}
                    disabled={loading}
                  >
                    <Ionicons 
                      name="male" 
                      size={24} 
                      color={gender === 'male' ? '#fff' : '#888'} 
                      style={styles.genderIcon}
                    />
                    <Text style={[styles.genderButtonText, gender === 'male' && styles.genderButtonTextActive]}>
                      Nam
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
                    onPress={() => setGender('female')}
                    disabled={loading}
                  >
                    <Ionicons 
                      name="female" 
                      size={24} 
                      color={gender === 'female' ? '#fff' : '#888'} 
                      style={styles.genderIcon}
                    />
                    <Text style={[styles.genderButtonText, gender === 'female' && styles.genderButtonTextActive]}>
                      Nữ
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.actionSection}>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleCompleteRegistration}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Hoàn tất đăng ký</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.note}>
                Bằng việc đăng ký, bạn đồng ý với{' '}
                <Text style={styles.linkText} onPress={() => router.push('/settings/terms')}>
                  điều khoản sử dụng
                </Text>
                {' '}và{' '}
                <Text style={styles.linkText} onPress={() => router.push('/settings/privacy')}>
                  chính sách bảo mật
                </Text>
                {' '}của chúng tôi
              </Text>
            </View>
          </View>
        </ScrollView>

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
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 60,
    zIndex: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 8,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D32F2F15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
    marginBottom: 8,
    lineHeight: 22,
  },
  formSection: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#fff',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 12,
    backgroundColor: '#222',
    overflow: 'hidden',
  },
  inputIcon: {
    padding: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    paddingVertical: 16,
    paddingRight: 16,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 12,
    backgroundColor: '#222',
  },
  genderButtonActive: {
    borderColor: '#D32F2F',
    backgroundColor: '#D32F2F',
  },
  genderIcon: {
    marginRight: 8,
  },
  genderButtonText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
  },
  genderButtonTextActive: {
    color: '#fff',
  },
  actionSection: {
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D32F2F',
    borderRadius: 12,
    padding: 16,
    width: '100%',
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
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  note: {
    fontSize: 13,
    textAlign: 'center',
    color: '#888',
    lineHeight: 18,
    paddingHorizontal: 32,
  },
  linkText: {
    color: '#D32F2F',
    textDecorationLine: 'underline',
  },
});
