/**
 * EXPLORE SCREEN - Màn hình mở rộng/menu chính
 * MÔ TẢ: Screen chứa menu điều hướng đến các tính năng phụ và settings
 * CHỨC NĂNG:
 * - Hiển thị thông tin user hiện tại
 * - Menu điều hướng đến profile, settings, help
 * - Logout functionality với confirmation modal
 * - Navigation đến các sub-screens
 * - User avatar display
 * - Notification access
 * LAYOUT: Header + ScrollView với các section menu
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationBadge from '../../components/ui/NotificationBadge';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ExploreScreen() {
  // REDUX STATE - Lấy thông tin user từ auth state
  const { user, isLoggedIn } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  // LOCAL STATE - Quản lý modal logout
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false); 
  const [notificationMessage, setNotificationMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // NOTIFICATIONS - Get notification state
  const { unreadCount } = useNotifications(userId || undefined);

  // Get userId from AsyncStorage
  useEffect(() => {
    const getUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
        }
      } catch (error) {
        console.error('Error getting userId:', error);
      }
    };

    if (isLoggedIn) {
      getUserId();
    }
  }, [isLoggedIn]);

  /**
   * NAVIGATION HANDLERS - Các function điều hướng đến screens khác
   */
  
  // Điều hướng đến notifications
  const handleNotifications = () => {
    router.push('/notifications' as any);
  };

  // Điều hướng đến notification settings
  const handleNotificationSettings = () => {
    router.push('/notification-settings' as any);
  };

  // Điều hướng đến notification debug
  const handleNotificationDebug = () => {
    router.push('/notification-debug' as any);
  };

  // Điều hướng đến help center
  const handleHelp = () => {
    router.push('/settings/help');
  };

  // Điều hướng đến contact info
  const handleContact = () => {
    router.push('/settings/contact');
  };

  // Điều hướng đến quản lý thiết bị
  const handleDeviceManagement = () => {
    Alert.alert('Quản lý thiết bị', 'Tính năng đang phát triển');
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
    router.push('/watch-later' as any);
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
        // Đăng xuất thành công - chuyển về flash screen
        router.replace('/(auth)/flash' as any);
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

  // Handler cho nút đăng nhập
  const handleLogin = () => {
    router.push('/(auth)/login' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Settings icon at top right */}
      {/* Removed absolute positioned settings button */}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.card}>
          <View style={styles.userHeader}>
            {isLoggedIn ? (
              <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={{flexDirection: 'row', alignItems: 'center', flex: 1}} activeOpacity={0.8}>
                <View style={styles.userAvatarContainer}>
                  {user?.avatar ? (
                    <LinearGradient colors={['#D11030', '#dd2476']} style={styles.avatarGlow}>
                      <Image source={{ uri: user.avatar }} style={styles.userAvatar} resizeMode="cover" />
                    </LinearGradient>
                  ) : (
                    <View style={[styles.userAvatarPlaceholder, styles.avatarGlow]}>
                      <Ionicons name="person" size={32} color="#bbb" />
                    </View>
                  )}
                </View>
                <View>
                  <Text style={styles.userText}>{user?.full_name || 'Người dùng'}</Text>
                  <Text style={styles.userEmail}>{user?.email}</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                <View style={styles.userAvatarContainer}>
                  <View style={[styles.userAvatarPlaceholder, styles.avatarGlow]}>
                    <Ionicons name="person" size={32} color="#666" />
                  </View>
                </View>
                <View>
                  <Text style={styles.userText}>Khách</Text>
                  <Text style={styles.userEmail}>Chưa đăng nhập</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Thông báo Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông báo</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleNotifications} activeOpacity={0.7}>
            <View style={styles.notificationIconContainer}>
              <Ionicons name="notifications-outline" size={26} color="#ff6b6b" style={styles.menuIcon} />
              {unreadCount > 0 && (
                <NotificationBadge 
                  count={unreadCount} 
                  size="small" 
                  style={styles.notificationBadge}
                />
              )}
            </View>
            <Text style={styles.menuItemText}>
              Thông báo {unreadCount > 0 && `(${unreadCount})`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleNotificationSettings} activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={26} color="#4ecdc4" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Cài đặt thông báo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleNotificationDebug} activeOpacity={0.7}>
            <Ionicons name="bug-outline" size={26} color="#ffa726" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Debug Thông báo</Text>
          </TouchableOpacity>
        </View>

        {/* Lịch sử Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Lịch sử</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleFavoriteMovies} activeOpacity={0.7}>
            <Ionicons name="bookmark-outline" size={26} color="#ffb347" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Phim xem sau</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleSubscribedMovies} activeOpacity={0.7}>
            <Ionicons name="card-outline" size={26} color="#6dd5ed" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Lịch sử thuê phim</Text>
          </TouchableOpacity>
        </View>

        {/* Trợ giúp Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Trợ giúp</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleHelp} activeOpacity={0.7}>
            <Ionicons name="help-circle-outline" size={26} color="#f7971e" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Trung tâm hỗ trợ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleContact} activeOpacity={0.7}>
            <Ionicons name="mail-outline" size={26} color="#43cea2" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Thông tin liên hệ</Text>
          </TouchableOpacity>
        </View>

        {/* Giới thiệu Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Giới thiệu</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleAbout} activeOpacity={0.7}>
            <Ionicons name="information-circle-outline" size={26} color="#36d1c4" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Thông tin về Tech5 Play </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleTerms} activeOpacity={0.7}>
            <Ionicons name="document-text-outline" size={26} color="#f7971e" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Điều khoản sử dụng</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handlePrivacyPolicy} activeOpacity={0.7}>
            <Ionicons name="shield-checkmark-outline" size={26} color="#43cea2" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Chính sách bảo mật</Text>
          </TouchableOpacity>
        </View>

        {/* Quản lý tài khoản Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quản lý tài khoản</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleDeviceManagement} activeOpacity={0.7}>
            <Ionicons name="phone-portrait-outline" size={26} color="#9b59b6" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Quản lý thiết bị</Text>
          </TouchableOpacity>
          {isLoggedIn ? (
            <TouchableOpacity style={[styles.menuItem, styles.logoutButton]} onPress={handleLogout} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={26} color="#D11030" style={styles.menuIcon} />
              <Text style={styles.menuItemTextLogout}>Đăng xuất</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.menuItem, styles.loginButton]} onPress={handleLogin} activeOpacity={0.8}>
              <Ionicons name="log-in-outline" size={26} color="#4CAF50" style={styles.menuIcon} />
              <Text style={styles.menuItemTextLogin}>Đăng nhập</Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoggedIn && user ? (
          <View style={styles.footer}>
            <Text style={styles.footerText}>Đăng nhập với: {user.full_name}</Text>
            <Text style={styles.footerSubText}>{user.email}</Text>
          </View>
        ) : (
          <View style={styles.footer}>
            <Text style={styles.footerText}>Bạn chưa đăng nhập</Text>
            <Text style={styles.footerSubText}>Đăng nhập để truy cập đầy đủ tính năng</Text>
          </View>
        )}
      </ScrollView>

      {/* Modal xác nhận đăng xuất */}
      <Modal transparent={true} visible={isLogoutModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="log-out-outline" size={32} color="#D11030" style={{ marginBottom: 8 }} />
            <Text style={styles.modalMessage}>{notificationMessage}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelLogout} activeOpacity={0.7}>
                <Text style={styles.buttonTextCancel}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={confirmLogout} activeOpacity={0.8}>
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
  scrollContent: {
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginTop: 56,
  },
  card: {
    backgroundColor: '#000',
    borderRadius: 18,
    marginBottom: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#222',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
    marginLeft: 2,
    letterSpacing: 0.2,
    fontFamily: 'System',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 12,
    marginBottom: 2,
  },
  userAvatarContainer: {
    marginRight: 18,
  },
  avatarGlow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D11030',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  userAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userAvatarPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
    fontFamily: 'System',
  },
  userEmail: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 2,
    fontFamily: 'System',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  menuIcon: {
    marginRight: 18,
  },
  notificationIconContainer: {
    position: 'relative',
    marginRight: 18,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  menuItemText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
    fontWeight: '500',
    fontFamily: 'System',
  },
  menuItemTextLogout: {
    color: '#D11030',
    fontSize: 16,
    flex: 1,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  logoutButton: {
    marginTop: 6,
    justifyContent: 'center',
    backgroundColor: 'rgba(209,16,48,0.08)',
    borderWidth: 1,
    borderColor: '#D11030',
  },
  loginButton: {
    marginTop: 6,
    justifyContent: 'center',
    backgroundColor: 'rgba(76,175,80,0.08)',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  menuItemTextLogin: {
    color: '#4CAF50',
    fontSize: 16,
    flex: 1,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#232526',
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  footerText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    fontFamily: 'System',
  },
  footerSubText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
    fontFamily: 'System',
  },
  // Custom Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    backgroundColor: '#000',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: 290,
    borderWidth: 1,
    borderColor: '#222',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 3,
  },
  modalMessage: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'System',
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1c1c1e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(209,16,48,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D11030',
  },
  buttonText: {
    color: '#D11030',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'System',
    textAlign: 'center',
  },
  buttonTextCancel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'System',
    textAlign: 'center',
  },
});