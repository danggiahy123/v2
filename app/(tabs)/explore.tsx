import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert } from 'react-native';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';

export default function ExploreScreen() {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false); 
  const [notificationMessage, setNotificationMessage] = useState('');

  const handleSettings = () => {
    router.push('/settings' as any);
  };

  const handleDownloads = () => {
    Alert.alert('Thông báo', 'Tính năng đang phát triển');
  };

  const handleHelp = () => {
    Alert.alert('Trợ giúp', 'Liên hệ hỗ trợ: support@example.com');
  };

  const handleContact = () => {
    Alert.alert('Thông tin liên hệ', 'Email: contact@fptplay.com\nHotline: 1900-xxxx');
  };

  const handleAbout = () => {
    Alert.alert('Thông tin về FPT Play', 'Ứng dụng xem phim FPT Play v1.0.0');
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Chính sách bảo mật', 'Chính sách bảo mật đang được cập nhật');
  };

  const handleTerms = () => {
    Alert.alert('Điều khoản sử dụng', 'Điều khoản sử dụng đang được cập nhật');
  };


  const handleLogout = () => {
    setNotificationMessage('Bạn có chắc chắn muốn đăng xuất?');
    setIsLogoutModalVisible(true);
  };

 
  const confirmLogout = async () => {
    try {
      const result = await dispatch(logout());
      if (logout.fulfilled.match(result)) {
        router.replace('/(auth)/login' as any);
      } else if (logout.rejected.match(result)) {
        setNotificationMessage('Không thể đăng xuất. Vui lòng thử lại.');
        setIsLogoutModalVisible(true);
      }
    } catch (error) {
      setNotificationMessage('Có lỗi xảy ra khi đăng xuất');
      setIsLogoutModalVisible(true);
    }
  };


  const cancelLogout = () => {
    setIsLogoutModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
 
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mở rộng</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <TouchableOpacity onPress={() => router.push('/profile')} style={styles.userHeader}>
            <View style={styles.userAvatarContainer}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.userAvatar} resizeMode="cover" />
              ) : (
                <View style={styles.userAvatarPlaceholder}>
                  <Ionicons name="person" size={24} color="#666" />
                </View>
              )}
            </View>
            <Text style={styles.userText}>Người dùng</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>


          <TouchableOpacity style={styles.menuItem} onPress={handleDownloads}>
            <Ionicons name="download-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Nội dung tải xuống</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

   
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trợ giúp</Text>

          <TouchableOpacity style={styles.menuItem} onPress={handleHelp}>
            <Ionicons name="help-circle-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Trung tâm hỗ trợ</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleContact}>
            <Ionicons name="mail-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Thông tin liên hệ</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>


        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Giới thiệu</Text>

          <TouchableOpacity style={styles.menuItem} onPress={handleAbout}>
            <Ionicons name="information-circle-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Thông tin về FPT </Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleTerms}>
            <Ionicons name="document-text-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Điều khoản sử dụng</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handlePrivacyPolicy}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Chính sách bảo mật</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.logoutButton]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Đăng xuất</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {user && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Đăng nhập với: {user.full_name}
            </Text>
            <Text style={styles.footerSubText}>
              {user.email}
            </Text>
          </View>
        )}
      </ScrollView>


      <Modal transparent={true} visible={isLogoutModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalMessage}>{notificationMessage}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelLogout}>
                <Text style={styles.buttonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={confirmLogout}>
                <Text style={styles.buttonText}>Đăng xuất</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  settingsButton: {
    padding: 8,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 10,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  userAvatarContainer: {
    marginRight: 15,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 8,
  },
  menuIcon: {
    marginRight: 15,
  },
  menuItemText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  logoutButton: {
    marginTop: 20,
    justifyContent: 'center',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  footerSubText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },

  // Custom Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#1c1c1e',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalMessage: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center', 
    width: '60%', 
    gap: 10, 
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#F44336',
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
