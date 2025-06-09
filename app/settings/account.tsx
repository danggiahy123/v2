import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearError, clearMessage, updateProfile } from '../../store/slices/authSlice';

export default function AccountInfoScreen() {
  const { user, userId, loading, error, message } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(user?.gender as any || 'male');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<any>(null);
  const [showGenderPicker, setShowGenderPicker] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setGender(user.gender as any);
    }
  }, [user]);

  // Show error if exists
  useEffect(() => {
    if (error) {
      Alert.alert('Lỗi', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Show message if exists
  useEffect(() => {
    if (message && message.includes('updated successfully')) {
      Alert.alert('Thành công', 'Cập nhật thông tin thành công', [
        {
          text: 'OK',
          onPress: () => {
            router.back();
            // Clear message after navigation
            setTimeout(() => {
              dispatch(clearMessage());
            }, 100);
          }
        }
      ]);
    } else if (message) {
      Alert.alert('Thông báo', message);
      dispatch(clearMessage());
    }
  }, [message, dispatch, router]);

  // Compress image to reduce file size
  const compressImage = async (uri: string) => {
    try {
      console.log('🔄 Compressing image:', uri);
      
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [
          // Resize if too large (max 800x800)
          { resize: { width: 800, height: 800 } }
        ],
        {
          compress: 0.7, // 70% quality
          format: ImageManipulator.SaveFormat.JPEG, // Convert to JPEG for smaller size
        }
      );
      
      console.log('✅ Image compressed:', {
        original: uri,
        compressed: manipulated.uri,
        width: manipulated.width,
        height: manipulated.height
      });
      
      return manipulated.uri;
    } catch (error) {
      console.error('❌ Image compression failed:', error);
      // If compression fails, return original
      return uri;
    }
  };

  const requestMediaPermissions = async () => {
    const mediaLibraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    
    if (mediaLibraryStatus.status !== 'granted' || cameraStatus.status !== 'granted') {
      Alert.alert(
        'Quyền truy cập',
        'Cần quyền truy cập máy ảnh và thư viện ảnh để thay đổi avatar',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission) return;

    Alert.alert(
      'Chọn ảnh',
      'Bạn muốn chọn ảnh từ đâu?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Thư viện', onPress: () => openImagePicker() },
        { text: 'Máy ảnh', onPress: () => openCamera() },
      ]
    );
  };

  const openImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Compress image before setting
        const compressedUri = await compressImage(asset.uri);
        setSelectedImage(compressedUri);
        
        // Create file object for upload
        const fileExtension = compressedUri.split('.').pop();
        const fileName = `avatar.${fileExtension}`;
        
        setImageFile({
          uri: compressedUri,
          type: `image/${fileExtension}`,
          name: fileName,
        });
        
        console.log('📸 Image selected and compressed:', {
          original: asset.uri,
          compressed: compressedUri,
          type: `image/${fileExtension}`,
          name: fileName,
        });
      }
    } catch (error) {
      console.error('❌ Image picker error:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const openCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Compress image before setting
        const compressedUri = await compressImage(asset.uri);
        setSelectedImage(compressedUri);
        
        // Create file object for upload
        const fileExtension = compressedUri.split('.').pop();
        const fileName = `avatar.${fileExtension}`;
        
        setImageFile({
          uri: compressedUri,
          type: `image/${fileExtension}`,
          name: fileName,
        });
        
        console.log('📷 Camera image compressed:', {
          original: asset.uri,
          compressed: compressedUri,
          type: `image/${fileExtension}`,
          name: fileName,
        });
      }
    } catch (error) {
      console.error('❌ Camera error:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh');
    }
  };

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ và tên');
      return false;
    }
    
    if (fullName.trim().length < 2) {
      Alert.alert('Lỗi', 'Họ và tên phải có ít nhất 2 ký tự');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    if (!userId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
      return;
    }

    const profileData: any = {
      full_name: fullName.trim(),
      gender: gender,
    };

    // Add avatar if selected
    if (imageFile) {
      profileData.avatar = imageFile;
    }

    console.log('🔄 Sending profile update:', {
      userId,
      profileData: {
        ...profileData,
        avatar: profileData.avatar ? 'File selected' : 'No file'
      }
    });

    try {
      const result = await dispatch(updateProfile({ userId, profileData }));
      
      if (updateProfile.fulfilled.match(result)) {
        console.log('✅ Profile updated successfully:', result.payload);
      } else if (updateProfile.rejected.match(result)) {
        console.error('❌ Profile update failed:', result.payload);
        console.error('❌ Full error:', result);
      }
    } catch (error) {
      console.error('❌ Profile update error:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi cập nhật profile');
    }
  };

  const handleGenderSelect = (selectedGender: 'male' | 'female' | 'other') => {
    setGender(selectedGender);
    setShowGenderPicker(false);
  };

  const getGenderDisplayText = (genderValue: string) => {
    switch (genderValue) {
      case 'male': return 'Nam';
      case 'female': return 'Nữ';
      case 'other': return 'Khác';
      default: return 'Nam / Nữ / Khác';
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không tìm thấy thông tin người dùng</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin tài khoản</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView 
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={styles.avatar} />
              ) : user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={40} color="#666" />
                </View>
              )}
              {/* Camera Icon */}
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            
            {/* Họ và tên */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Họ và tên</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nhập họ và tên"
                placeholderTextColor="#666"
              />
            </View>

            {/* Giới tính */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Giới tính</Text>
              <TouchableOpacity 
                style={styles.input}
                onPress={() => setShowGenderPicker(true)}
              >
                <Text style={styles.inputText}>
                  {getGenderDisplayText(gender)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Số điện thoại */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Số điện thoại</Text>
              <TextInput
                style={[styles.input, styles.readonlyInput]}
                value={user.phone}
                editable={false}
                placeholderTextColor="#666"
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, styles.readonlyInput]}
                value={user.email}
                editable={false}
                placeholderTextColor="#666"
              />
            </View>

          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.buttonSection}>
          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Lưu</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Gender Picker Modal */}
      {showGenderPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn giới tính</Text>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => handleGenderSelect('male')}
            >
              <Text style={styles.modalOptionText}>Nam</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => handleGenderSelect('female')}
            >
              <Text style={styles.modalOptionText}>Nữ</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => handleGenderSelect('other')}
            >
              <Text style={styles.modalOptionText}>Khác</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalCancel}
              onPress={() => setShowGenderPicker(false)}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
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
    width: 40,
  },
  scrollContent: {
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  formSection: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    minHeight: 50,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 16,
    color: '#fff',
  },
  readonlyInput: {
    backgroundColor: '#2a2a2a',
    color: '#999',
  },
  buttonSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 30,
  },
  saveButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  saveButtonDisabled: {
    backgroundColor: '#666',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  modalCancel: {
    paddingVertical: 16,
    marginTop: 10,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    fontWeight: '600',
  },
}); 