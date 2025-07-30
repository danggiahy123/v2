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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthGuard } from '../hooks';
import { LoginRequiredModal } from '../components/ui';
import { notificationService } from '../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setNotificationMute, getNotificationMute, NotificationMuteOption } from '../utils/notificationSettingsHelper';
import { updateNotificationMute, getNotificationMuteFromServer } from '../services/notificationMuteService';

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
  const [muteOption, setMuteOption] = useState<NotificationMuteOption>('on');
  const [muteUntil, setMuteUntil] = useState<number | undefined>(undefined);
  const [muteModalVisible, setMuteModalVisible] = useState(false);

  // Get userId from AsyncStorage
  useEffect(() => {
    const getUserId = async () => {
      try {
        console.log('🔄 Getting userId from storage...');
        const storedUserId = await AsyncStorage.getItem('userId');
        console.log('📱 Stored userId:', storedUserId);
        
        if (storedUserId) {
          setUserId(storedUserId);
          console.log('✅ UserId set successfully:', storedUserId);
        } else {
          console.log('⚠️ No userId found in storage');
          setUserId(null);
        }
      } catch (error) {
        console.error('❌ Error getting userId:', error);
        setUserId(null);
      }
    };

    if (isLoggedIn) {
      getUserId();
    } else {
      setUserId(null);
    }
  }, [isLoggedIn]);

  // Get push token
  useEffect(() => {
    const token = notificationService.getPushToken();
    setPushToken(token);
  }, []);

  useEffect(() => {
    // Lấy trạng thái mute khi vào màn hình
    const loadMuteStatus = async () => {
      try {
        console.log('🔄 Loading mute status...');
        
        // Lấy từ local storage trước
        const localSettings = await getNotificationMute();
        console.log('📱 Local mute settings loaded:', localSettings);
        
        // Nếu có userId, lấy từ server để đồng bộ
        if (userId) {
          const serverMuteStatus = await getNotificationMuteFromServer(userId);
          console.log('📱 Server mute status loaded:', serverMuteStatus);
          
          if (serverMuteStatus) {
            // Ưu tiên server data
            const isMuted = serverMuteStatus.isMuted;
            const muteUntil = serverMuteStatus.muteUntil ? new Date(serverMuteStatus.muteUntil).getTime() : undefined;
            
            // Cập nhật local storage nếu khác với server
            if (localSettings.muteOption === 'on' && isMuted) {
              // Server cho thấy đang mute nhưng local là on
              await setNotificationMute('off');
              setMuteOption('off');
              setMuteUntil(muteUntil);
            } else if (localSettings.muteOption !== 'on' && !isMuted) {
              // Server cho thấy không mute nhưng local không phải on
              await setNotificationMute('on');
              setMuteOption('on');
              setMuteUntil(undefined);
            } else {
              // Giữ nguyên local settings
              setMuteOption(localSettings.muteOption);
              setMuteUntil(localSettings.muteUntil);
            }
          } else {
            // Không lấy được từ server, dùng local
            setMuteOption(localSettings.muteOption);
            setMuteUntil(localSettings.muteUntil);
          }
        } else {
          // Không có userId, chỉ dùng local
          setMuteOption(localSettings.muteOption);
          setMuteUntil(localSettings.muteUntil);
        }
      } catch (error) {
        console.error('❌ Error loading mute status:', error);
      }
    };
    
    loadMuteStatus();
  }, [userId]);

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!userId) return;

    setLoading(true);
    try {
      const updatedSettings = { ...settings, ...newSettings };
      const success = await notificationService.updateNotificationSettings(updatedSettings);
      
      if (success) {
        setSettings(updatedSettings);
        // Bỏ Alert thành công - chỉ cập nhật state
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

  const handleMuteChange = async (option: NotificationMuteOption) => {
    try {
      console.log('🔄 Handling mute change:', { option, userId });
      
      if (!userId) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        return;
      }

      // Cập nhật local storage trước
      await setNotificationMute(option);
      setMuteOption(option);
      
      let muteUntil: number | null = null;
      let isMuted = false;
      
      if (option === 'on') {
        setMuteUntil(undefined);
        isMuted = false;
        muteUntil = null;
      } else {
        const settings = await getNotificationMute();
        setMuteUntil(settings.muteUntil);
        muteUntil = settings.muteUntil || null;
        isMuted = true;
      }
      
      // Cập nhật lên server
      const success = await updateNotificationMute(userId, isMuted, muteUntil);
      
      if (success) {
        console.log('✅ Mute status updated successfully');
        // Bỏ Alert thành công - chỉ log thôi
      } else {
        console.error('❌ Failed to update mute status on server');
        Alert.alert('Lỗi', 'Không thể cập nhật trạng thái thông báo. Vui lòng thử lại.');
        // Revert local changes if server update failed
        const currentSettings = await getNotificationMute();
        setMuteOption(currentSettings.muteOption || 'on');
        setMuteUntil(currentSettings.muteUntil);
      }
    } catch (error) {
      console.error('❌ Error in handleMuteChange:', error);
      Alert.alert('Lỗi', 'Đã có lỗi xảy ra khi cập nhật trạng thái thông báo');
    }
  };

  const renderMuteStatus = () => {
    if (muteOption === 'on') return 'Đang bật thông báo';
    if (muteOption === 'off') return 'Tắt thông báo cho đến khi bật lại';
    if (muteUntil && muteUntil > Date.now()) {
      const remain = muteUntil - Date.now();
      let hours = Math.floor(remain / 3600000);
      let minutes = Math.floor((remain % 3600000) / 60000);
      if (muteOption === '1h') return `Tắt thông báo trong 1 giờ (${hours}h ${minutes}m còn lại)`;
      if (muteOption === '8h') return `Tắt thông báo trong 8 giờ (${hours}h ${minutes}m còn lại)`;
      if (muteOption === '1d') return `Tắt thông báo trong 1 ngày (${hours}h ${minutes}m còn lại)`;
    }
    return 'Tắt thông báo tạm thời';
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
        {/* Notification Mute Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bật/Tắt thông báo </Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <LinearGradient
                  colors={['#E50914', '#B81D24']}
                  style={styles.settingIcon}
                >
                  <Ionicons name="notifications" size={20} color="#fff" />
                </LinearGradient>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Thông báo</Text>
                  <Text style={styles.settingSubtitle}>{renderMuteStatus()}</Text>
                </View>
              </View>
              <Switch
                value={muteOption === 'on'}
                onValueChange={async (value) => {
                  if (value) {
                    await handleMuteChange('on');
                  } else {
                    setMuteModalVisible(true);
                  }
                }}
                trackColor={{ false: '#333', true: '#E50914' }}
                thumbColor={muteOption === 'on' ? '#fff' : '#666'}
              />
            </View>
          </View>
        </View>
        {/* Modal chọn thời gian tắt thông báo */}
        <Modal
          visible={muteModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMuteModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.muteModalContent}>
              <Text style={styles.modalTitle}>Chọn thời gian tắt thông báo</Text>
              {[
                { label: 'Tắt 1 giờ', value: '1h' },
                { label: 'Tắt 8 giờ', value: '8h' },
                { label: 'Tắt 1 ngày', value: '1d' },
                { label: 'Tắt đến khi bật lại', value: 'off' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.muteOptionButton, muteOption === opt.value && styles.muteOptionButtonActive]}
                  onPress={async () => {
                    await handleMuteChange(opt.value as NotificationMuteOption);
                    setMuteModalVisible(false);
                  }}
                >
                  <Text style={[styles.muteOptionText, muteOption === opt.value && styles.muteOptionTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.closeModalButton} onPress={() => setMuteModalVisible(false)}>
                <Text style={styles.closeModalButtonText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>


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
  muteButton: {
    backgroundColor: '#222',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  muteButtonActive: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  muteButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  muteMainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E50914',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 8,
  },
  muteMainButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteModalContent: {
    backgroundColor: '#181818',
    borderRadius: 20,
    padding: 24,
    width: 320,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 18,
  },
  muteOptionButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#222',
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  muteOptionButtonActive: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  muteOptionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  muteOptionTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  closeModalButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  closeModalButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
});
