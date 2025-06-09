import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Show error if exists
  useEffect(() => {
    if (error) {
      Alert.alert('Lỗi', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Show message if exists (e.g., registration completed successfully)
  useEffect(() => {
    if (message) {
      Alert.alert('Thông báo', message);
      dispatch(clearMessage());
    }
  }, [message, dispatch]);

  const handleCompleteRegistration = async () => {
    if (!fullName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ và tên');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Lỗi', 'Email không hợp lệ');
      return;
    }

    try {
      const result = await dispatch(completeRegistration({
        full_name: fullName.trim(),
        email: email.trim(),
        gender: gender,
      }));

      if (completeRegistration.fulfilled.match(result)) {
        Alert.alert(
          'Chào mừng!',
          'Đăng ký thành công. Chào mừng bạn đến với ứng dụng!',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(tabs)' as any)
            }
          ]
        );
      }
    } catch (error) {
      console.error('Complete registration error:', error);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
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
                style={[
                  styles.genderButton,
                  gender === 'male' && styles.genderButtonActive
                ]}
                onPress={() => setGender('male')}
                disabled={loading}
              >
                <Text style={[
                  styles.genderButtonText,
                  gender === 'male' && styles.genderButtonTextActive
                ]}>
                  Nam
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === 'female' && styles.genderButtonActive
                ]}
                onPress={() => setGender('female')}
                disabled={loading}
              >
                <Text style={[
                  styles.genderButtonText,
                  gender === 'female' && styles.genderButtonTextActive
                ]}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
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
  inputContainer: {
    marginBottom: 24,
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
    backgroundColor: '#222',
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
    backgroundColor: '#222',
  },
  genderButtonActive: {
    borderColor: '#D32F2F',
    backgroundColor: '#D32F2F',
  },
  genderButtonText: {
    fontSize: 16,
    color: '#888',
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
  note: {
    fontSize: 12,
    textAlign: 'center',
    color: '#888',
    lineHeight: 18,
  },
}); 