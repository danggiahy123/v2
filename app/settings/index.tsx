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
} from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();

  const handleAccountInfo = () => {
    // Navigate to account info screen
    router.push('/settings/account' as any);
  };

  const handleNotifications = () => {
    // TODO: Navigate to notifications settings
    Alert.alert('Thông báo', 'Tính năng đang phát triển');
  };

  const handleFavoriteMovies = () => {
    // TODO: Navigate to favorite movies
    Alert.alert('Phim yêu thích', 'Tính năng đang phát triển');
  };

  const handleSubscribedMovies = () => {
    // TODO: Navigate to subscribed movies
    Alert.alert('Phim đăng ký', 'Tính năng đang phát triển');
  };

  const handleTransactionHistory = () => {
    // TODO: Navigate to transaction history
    Alert.alert('Lịch sử giao dịch', 'Tính năng đang phát triển');
  };

  const handleDeviceManagement = () => {
    // TODO: Navigate to device management
    Alert.alert('Quản lý thiết bị', 'Tính năng đang phát triển');
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt chung</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Settings Menu Items */}
        <View style={styles.section}>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleAccountInfo}
          >
            <Ionicons name="person-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Chỉnh sửa profile </Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleNotifications}
          >
            <Ionicons name="notifications-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Thông báo</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleFavoriteMovies}
          >
            <Ionicons name="heart-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Phim yêu thích</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleSubscribedMovies}
          >
            <Ionicons name="bookmark-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Phim đăng ký</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleTransactionHistory}
          >
            <Ionicons name="card-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Lịch sử giao dịch</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleDeviceManagement}
          >
            <Ionicons name="phone-portrait-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Quản lý thiết bị</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Nền đen
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
    width: 40, // Same width as back button for centering
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
    marginBottom: 8, // Khoảng cách giữa các item
  },
  menuIcon: {
    marginRight: 15,
  },
  menuItemText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
}); 