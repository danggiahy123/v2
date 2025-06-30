import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Image,
} from 'react-native';
import { useAppSelector } from '../../store/hooks';

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);

  const handleAccountInfo = () => {
   
    router.push('/settings/account' as any);
  };

  const handleNotifications = () => {
 
    Alert.alert('Thông báo', 'Tính năng đang phát triển');
  };

  const handleFavoriteMovies = () => {
   
    Alert.alert('Phim yêu thích', 'Tính năng đang phát triển');
  };

  const handleSubscribedMovies = () => {
    router.push('/settings/subscriptions' as any);
  };

  const handleTransactionHistory = () => {
  
    Alert.alert('Lịch sử giao dịch', 'Tính năng đang phát triển');
  };

  const handleDeviceManagement = () => {

    Alert.alert('Quản lý thiết bị', 'Tính năng đang phát triển');
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt chung</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Avatar và tên user */}
      <View style={styles.userCard}>
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{user?.full_name?.charAt(0).toUpperCase() || '?'}</Text>
          </View>
        )}
        <Text style={styles.userName}>{user?.full_name || 'Người dùng'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleAccountInfo}
          >
            <Ionicons name="person-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Chỉnh sửa hồ sơ </Text>
      
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleNotifications}
          >
            <Ionicons name="notifications-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Thông báo</Text>
       
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleDeviceManagement}
          >
            <Ionicons name="phone-portrait-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Quản lý thiết bị</Text>
          
          </TouchableOpacity>

        </View>
      </ScrollView>
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
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  section: {
    marginBottom: 20,
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
  userCard: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#fff',
    marginBottom: 8,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2c2c2e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    marginBottom: 8,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
}); 