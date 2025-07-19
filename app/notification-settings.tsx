import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthGuard } from '../hooks';
import { LoginRequiredModal } from '../components/ui';
import { notificationService } from '../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationSettings {
  newMovies: boolean;
  newEpisodes: boolean;
  reminders: boolean;
  promotions: boolean;
  systemUpdates: boolean;
  pushEnabled: boolean;
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { isLoggedIn, showLoginModal, hideLoginModal, loginModalVisible, currentFeatureName } = useAuthGuard();
  const [userId, setUserId] = useState<string | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>({
    newMovies: true,
    newEpisodes: true,
    reminders: true,
    promotions: false,
    systemUpdates: true,
    pushEnabled: true,
  });
  const [loading, setLoading] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);

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

  // Get push token
  useEffect(() => {
    const token = notificationService.getPushToken();
    setPushToken(token);
  }, []);

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!userId) return;

    setLoading(true);
    try {
      const updatedSettings = { ...settings, ...newSettings };
      const success = await notificationService.updateNotificationSettings(updatedSettings);
      
      if (success) {
        setSettings(updatedSettings);
        Alert.alert('Thành công', 'Đã cập nhật cài đặt thông báo');
      } else {
        Alert.alert('Lỗi', 'Không thể cập nhật cài đặt thông báo');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Đã có lỗi xảy ra khi cập nhật cài đặt');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    updateSettings({ [key]: value });
  };

  const handleBack = () => {
    router.back();
  };

  const renderSettingItem = (
    key: keyof NotificationSettings,
    title: string,
    subtitle: string,
    icon: string
  ) => (
    <View style={styles.settingItem} key={key}>
      <View style={styles.settingLeft}>
        <LinearGradient
          colors={['#E50914', '#B81D24']}
          style={styles.settingIcon}
        >
          <Ionicons name={icon as any} size={20} color="#fff" />
        </LinearGradient>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={settings[key]}
        onValueChange={(value) => handleSettingChange(key, value)}
        trackColor={{ false: '#333', true: '#E50914' }}
        thumbColor={settings[key] ? '#fff' : '#666'}
        disabled={loading}
      />
    </View>
  );

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cài đặt thông báo</Text>
        </View>

        <View style={styles.loginContainer}>
          <Ionicons name="notifications-off" size={64} color="#666" />
          <Text style={styles.loginText}>Bạn cần đăng nhập để cài đặt thông báo</Text>
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={() => showLoginModal('Cài đặt thông báo')}
          >
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
        
        <LoginRequiredModal
          visible={loginModalVisible}
          onClose={hideLoginModal}
          featureName={currentFeatureName || undefined}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt thông báo</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Push Notification Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trạng thái Push Notification</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.statusLeft}>
                <Ionicons 
                  name={pushToken ? "checkmark-circle" : "close-circle"} 
                  size={24} 
                  color={pushToken ? "#4CAF50" : "#ff4444"} 
                />
                <Text style={styles.statusText}>
                  {pushToken ? "Đã kích hoạt" : "Chưa kích hoạt"}
                </Text>
              </View>
              {pushToken && (
                <Text style={styles.tokenText}>
                  Token: {pushToken.substring(0, 20)}...
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Notification Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loại thông báo</Text>
          <View style={styles.settingsCard}>
            {renderSettingItem(
              'newMovies',
              'Phim mới',
              'Thông báo khi có phim mới được thêm',
              'film'
            )}
            {renderSettingItem(
              'newEpisodes',
              'Tập phim mới',
              'Thông báo khi có tập mới của series bạn theo dõi',
              'play-circle'
            )}
            {renderSettingItem(
              'reminders',
              'Nhắc nhở',
              'Nhắc nhở về phim sắp hết hạn thuê',
              'alarm'
            )}
            {renderSettingItem(
              'promotions',
              'Khuyến mãi',
              'Thông báo về các chương trình khuyến mãi',
              'gift'
            )}
            {renderSettingItem(
              'systemUpdates',
              'Cập nhật hệ thống',
              'Thông báo về các bản cập nhật và tính năng mới',
              'information-circle'
            )}
          </View>
        </View>

        {/* Advanced Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cài đặt nâng cao</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => {
                Alert.alert(
                  'Xóa tất cả thông báo',
                  'Bạn có chắc chắn muốn xóa tất cả thông báo?',
                  [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Xóa', style: 'destructive' }
                  ]
                );
              }}
            >
              <Ionicons name="trash" size={20} color="#ff4444" />
              <Text style={[styles.actionText, { color: '#ff4444' }]}>
                Xóa tất cả thông báo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => {
                Alert.alert(
                  'Đặt lại cài đặt',
                  'Bạn có chắc chắn muốn đặt lại tất cả cài đặt về mặc định?',
                  [
                    { text: 'Hủy', style: 'cancel' },
                    { 
                      text: 'Đặt lại', 
                      onPress: () => {
                        setSettings({
                          newMovies: true,
                          newEpisodes: true,
                          reminders: true,
                          promotions: false,
                          systemUpdates: true,
                          pushEnabled: true,
                        });
                      }
                    }
                  ]
                );
              }}
            >
              <Ionicons name="refresh" size={20} color="#666" />
              <Text style={styles.actionText}>Đặt lại cài đặt mặc định</Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  tokenText: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  settingsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    color: '#666',
    fontSize: 14,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 16,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
