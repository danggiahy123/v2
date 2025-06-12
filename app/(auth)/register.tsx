import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearError, clearMessage, completeRegistration } from '../../store/slices/authSlice';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error, message } = useAppSelector((state) => state.auth);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    if (error) {
      Alert.alert('Lỗi', error);
      dispatch(clearError());
    }
  }, [error]);

  useEffect(() => {
    if (message) {
      Alert.alert('Thông báo', message);
      dispatch(clearMessage());
    }
  }, [message]);

  const handleCompleteRegistration = async () => {
    if (!fullName.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập họ và tên');
    if (!email.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập email');
    if (!validateEmail(email)) return Alert.alert('Lỗi', 'Email không hợp lệ');

    try {
      const result = await dispatch(completeRegistration({
        full_name: fullName.trim(),
        email: email.trim(),
        gender,
      }));

      if (completeRegistration.fulfilled.match(result)) {
        Alert.alert('Chào mừng!', 'Đăng ký thành công!', [
          { text: 'OK', onPress: () => router.replace('/(tabs)' as any) },
        ]);
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://i.pinimg.com/564x/e9/9d/fb/e99dfb62a2c167e7062fb9efcd3cf2f3.jpg' }}
      style={styles.background}
      blurRadius={6}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={styles.title}>Hoàn tất đăng ký</Text>
            <Text style={styles.subtitle}>
              Vui lòng nhập thông tin để hoàn tất quá trình đăng ký
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Họ và tên *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nguyễn Văn A"
                placeholderTextColor="#888"
                value={fullName}
                onChangeText={setFullName}
                editable={!loading}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="example@gmail.com"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Giới tính</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
                  onPress={() => setGender('male')}
                  disabled={loading}
                >
                  <Text style={[styles.genderButtonText, gender === 'male' && styles.genderButtonTextActive]}>
                    Nam
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
                  onPress={() => setGender('female')}
                  disabled={loading}
                >
                  <Text style={[styles.genderButtonText, gender === 'female' && styles.genderButtonTextActive]}>
                    Nữ
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleCompleteRegistration}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Hoàn tất đăng ký</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.note}>
              Bằng việc đăng ký, bạn đồng ý với điều khoản sử dụng và chính sách bảo mật của chúng tôi
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  content: {
    gap: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#ccc',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#1e1e1e',
    color: '#fff',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
  },
  genderButtonActive: {
    borderColor: '#D32F2F',
    backgroundColor: '#D32F2F',
  },
  genderButtonText: {
    fontSize: 16,
    color: '#aaa',
    fontWeight: '500',
  },
  genderButtonTextActive: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#D32F2F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
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
  note: {
    fontSize: 12,
    textAlign: 'center',
    color: '#bbb',
    lineHeight: 18,
    marginTop: 8,
  },
});
