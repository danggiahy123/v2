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
  const { user, userId, loading, error, message } = useAppSelector((state) => state.auth);
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
    if (error) {
      setNotificationMessage(error);
      setNotificationType('error');
      setNotificationVisible(true);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (message) {
      setNotificationMessage(message);
      setNotificationType('success');
      setNotificationVisible(true);
      dispatch(clearMessage());
    }
  }, [message, dispatch]);

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
        <Text style={styles.userPhone}>{user.phone}</Text>

        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Text style={styles.editButtonText}>Chỉnh sửa profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{user.email}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Số điện thoại:</Text>
          <Text style={styles.infoValue}>{user.phone}</Text>
          {user.is_phone_verified && <Text style={styles.verifiedBadge}>Đã xác thực</Text>}
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Giới tính:</Text>
          <Text style={styles.infoValue}>
            {user.gender === 'male' ? 'Nam' : user.gender === 'female' ? 'Nữ' : 'Khác'}
          </Text>
        </View>

        <View style={styles.infoItem}>
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
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  topBarTitle: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '600',
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
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    margin: 16,
    borderRadius: 12,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2c2c2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 16,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButtonText: {
    color: '#D11030',
    fontSize: 14,
  },
  infoSection: {
    backgroundColor: '#1c1c1e',
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  infoLabel: {
    fontSize: 14,
    color: '#cccccc',
    width: 120,
  },
  infoValue: {
    fontSize: 14,
    color: '#ffffff',
    flex: 1,
  },
  verifiedBadge: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
});
