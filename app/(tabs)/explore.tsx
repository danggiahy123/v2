/**
 * EXPLORE SCREEN - Màn hình mở rộng/menu chính
 * MÔ TẢ: Screen chứa menu điều hướng đến các tính năng phụ và settings
 * CHỨC NĂNG:
 * - Hiển thị thông tin user hiện tại
 * - Menu điều hướng đến profile, settings, help
 * - Logout functionality với confirmation modal
 * - Navigation đến các sub-screens
 * - User avatar display
 * LAYOUT: Header + ScrollView với các section menu
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';

export default function ExploreScreen() {
  // REDUX STATE - Lấy thông tin user từ auth state
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  // LOCAL STATE - Quản lý modal logout
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false); 
  const [notificationMessage, setNotificationMessage] = useState('');

  /**
   * NAVIGATION HANDLERS - Các function điều hướng đến screens khác
   */
  
  // Điều hướng đến settings chính
  const handleSettings = () => {
    router.push('/settings' as any);
  };

  // Điều hướng đến help center
  const handleHelp = () => {
    router.push('/settings/help');
  };

  // Điều hướng đến contact info
  const handleContact = () => {
    router.push('/settings/contact');
  };

  // Điều hướng đến about page
  const handleAbout = () => {
    router.push('/settings/about');
  };

  // Điều hướng đến privacy policy
  const handlePrivacyPolicy = () => {
    router.push('/settings/privacy');
  };

  // Điều hướng đến terms of service
  const handleTerms = () => {
    router.push('/settings/terms');
  };

  // --- HANDLERS FOR MOVIE FEATURES ---
  const handleFavoriteMovies = () => {
    Alert.alert('Phim yêu thích', 'Tính năng đang phát triển');
  };
  const handleSubscribedMovies = () => {
    router.push('/settings/subscriptions' as any);
  };
  const handleTransactionHistory = () => {
    Alert.alert('Lịch sử giao dịch', 'Tính năng đang phát triển');
  };

  /**
   * LOGOUT HANDLERS - Xử lý đăng xuất với confirmation
   */
  
  // Hiển thị modal xác nhận đăng xuất
  const handleLogout = () => {
    setNotificationMessage('Bạn có chắc chắn muốn đăng xuất?');
    setIsLogoutModalVisible(true);
  };

  // Xác nhận đăng xuất - gọi Redux action và điều hướng
  const confirmLogout = async () => {
    try {
      const result = await dispatch(logout()); // Gọi logout action
      if (logout.fulfilled.match(result)) {
        // Đăng xuất thành công - chuyển về login screen
        router.replace('/(auth)/login' as any);
      } else if (logout.rejected.match(result)) {
        // Đăng xuất thất bại - hiển thị error
        setNotificationMessage('Không thể đăng xuất. Vui lòng thử lại.');
        setIsLogoutModalVisible(true);
      }
    } catch (err) {
      console.error('Logout error:', err);
      setNotificationMessage('Có lỗi xảy ra khi đăng xuất');
      setIsLogoutModalVisible(true);
    }
  };

  // Hủy đăng xuất - đóng modal
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
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.userHeader}>
            <View style={styles.userAvatarContainer}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.userAvatar} resizeMode="cover" />
              ) : (
                <View style={styles.userAvatarPlaceholder}>
                  <Ionicons name="person" size={24} color="#666" />
                </View>
              )}
            </View>
            <View>
              <Text style={styles.userText}>{user?.full_name || 'Người dùng'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Lịch sử</Text>

          <TouchableOpacity style={styles.menuItem} onPress={handleFavoriteMovies}>
            <Ionicons name="heart-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Phim yêu thích</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleSubscribedMovies}>
            <Ionicons name="bookmark-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Phim đăng ký</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleTransactionHistory}>
            <Ionicons name="card-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Lịch sử giao dịch</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trợ giúp</Text>

          <TouchableOpacity style={styles.menuItem} onPress={handleHelp}>
            <Ionicons name="help-circle-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Trung tâm hỗ trợ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleContact}>
            <Ionicons name="mail-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Thông tin liên hệ</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Giới thiệu</Text>

          <TouchableOpacity style={styles.menuItem} onPress={handleAbout}>
            <Ionicons name="information-circle-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Thông tin về Tech5 Play </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleTerms}>
            <Ionicons name="document-text-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Điều khoản sử dụng</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handlePrivacyPolicy}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Chính sách bảo mật</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.logoutButton]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Đăng xuất</Text>
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
                <Text style={styles.buttonTextCancel }>Hủy</Text>
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
    marginBottom: 32,
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingBottom: 2,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
    marginLeft: 2,
    letterSpacing: 0.2,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    padding: 18,
    borderRadius: 12,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
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
    marginBottom: 2,
  },
  userEmail: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#222',
    marginVertical: 12,
    borderRadius: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  menuIcon: {
    marginRight: 15,
  },
  menuItemText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 20,
    justifyContent: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#222',
    marginTop: 24,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  footerText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
  footerSubText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
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
    backgroundColor: '#444444',
    borderRadius: 8,
   
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#D11030',
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonTextCancel: {
    color: '#888',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
