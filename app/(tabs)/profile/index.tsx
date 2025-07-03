import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { clearError, clearMessage, getProfile } from '../../../store/slices/authSlice';
import { Ionicons } from '@expo/vector-icons';
import Notification from '../../../components/ui/Notification';

export default function ProfileScreen() {
  const auth = useAppSelector((state) => state.auth);
  const { user, userId, loading, error, message } = auth || {};
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (userId) {
      dispatch(getProfile(userId));
    }
  }, [userId, dispatch]);

  useEffect(() => {
    if (message) {
      setNotificationMessage(message);
      setNotificationType('success');
      setNotificationVisible(true);
      setTimeout(() => {
        dispatch(clearMessage());
      }, 3000);
    }
  }, [message, dispatch]);

  useEffect(() => {
    if (error) {
      setNotificationMessage(error);
      setNotificationType('error');
      setNotificationVisible(true);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleRefresh = () => {
    if (userId) {
      dispatch(getProfile(userId));
    }
  };

  const handleEditProfile = () => {
    router.push('/settings/account');
  };

  const handleCloseNotification = () => {
    setNotificationVisible(false);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không tìm thấy thông tin người dùng</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} />}
    >
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/explore')} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Hồ sơ</Text>
      </View>

      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{user.full_name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>

        <Text style={styles.userName}>{user.full_name}</Text>
        <View style={styles.phoneRow}>
          <Ionicons name="call-outline" size={16} color="#4CAF50" style={{marginRight: 6}} />
          <Text style={styles.userPhone}>{user.phone}</Text>
          {user.is_phone_verified && <Text style={styles.verifiedBadge}>Đã xác thực</Text>}
        </View>

        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Ionicons name="create-outline" size={16} color="#fff" style={{marginRight: 6}} />
          <Text style={styles.editButtonText}>Chỉnh sửa hồ sơ</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

        <View style={styles.infoItem}>
          <Ionicons name="mail-outline" size={16} color="#aaa" style={styles.infoIcon} />
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{user.email}</Text>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="call-outline" size={16} color="#aaa" style={styles.infoIcon} />
          <Text style={styles.infoLabel}>Số điện thoại:</Text>
          <Text style={styles.infoValue}>{user.phone}</Text>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="person-outline" size={16} color="#aaa" style={styles.infoIcon} />
          <Text style={styles.infoLabel}>Giới tính:</Text>
          <Text style={styles.infoValue}>{user.gender === 'male' ? 'Nam' : user.gender === 'female' ? 'Nữ' : 'Khác'}</Text>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="key-outline" size={16} color="#aaa" style={styles.infoIcon} />
          <Text style={styles.infoLabel}>ID:</Text>
          <Text style={styles.infoValue}>{user._id}</Text>
        </View>
      </View>

      <Notification
        visible={notificationVisible}
        message={notificationMessage}
        type={notificationType}
        onClose={handleCloseNotification}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingTop: 70,
    paddingBottom: 15,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 20,
  },
  topBarTitle: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 0,
    margin: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarContainer: {
    marginBottom: 18,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#2c2c2e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    marginTop: 2,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  userPhone: {
    fontSize: 15,
    color: '#b0ffb0',
    marginRight: 8,
  },
  verifiedBadge: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    backgroundColor: '#1e2e1e',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D11030',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
    shadowColor: '#D11030',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#18181b',
    marginHorizontal: 18,
    padding: 22,
    borderRadius: 14,
    marginBottom: 24,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    marginLeft: 2,
    letterSpacing: 0.2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#232323',
  },
  infoIcon: {
    marginRight: 10,
    width: 20,
    textAlign: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#cccccc',
    width: 110,
  },
  infoValue: {
    fontSize: 14,
    color: '#ffffff',
    flex: 1,
  },
});