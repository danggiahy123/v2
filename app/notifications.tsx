import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Animated,
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthGuard } from '../hooks';
import { LoginRequiredModal } from '../components/ui';
// import { BlurView } from 'expo-blur'; // Optional blur effect
import { useNotifications, NotificationItem } from '../hooks/useNotifications';

const { width, height } = Dimensions.get('window');

// Separate component for notification items to properly use hooks
const NotificationItemComponent = React.memo(({ 
  item, 
  index, 
  onPress, 
  getTypeColor, 
  getTypeIcon, 
  formatTime 
}: {
  item: NotificationItem;
  index: number;
  onPress: (item: NotificationItem) => void;
  getTypeColor: (type: string) => [string, string];
  getTypeIcon: (type: string) => string;
  formatTime: (timestamp: string) => string;
}) => {
  const colors = getTypeColor(item.type);
  const itemAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(itemAnim, {
      toValue: 1,
      duration: 600,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.notificationWrapper,
        {
          opacity: itemAnim,
          transform: [{
            translateY: itemAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            })
          }]
        }
      ]}
    >
              <TouchableOpacity
          style={[
            styles.notificationItem,
            !item.read && styles.unreadNotification,
          ]}
          onPress={() => onPress(item)}
          activeOpacity={0.7}
        >
          {/* Glow effect for unread */}
          {!item.read && (
          <LinearGradient
            colors={['rgba(229, 9, 20, 0.1)', 'transparent']}
            style={styles.glowEffect}
          />
        )}

        {/* Left side - Image or Icon */}
        <View style={styles.notificationLeft}>
          {item.imageUrl ? (
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: item.imageUrl }}
                style={styles.notificationImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={colors}
                style={styles.typeIconOverlay}
              >
                <Ionicons 
                  name={getTypeIcon(item.type) as any}
                  size={14} 
                  color="#fff" 
                />
              </LinearGradient>
            </View>
          ) : (
            <LinearGradient
              colors={colors}
              style={styles.typeIcon}
            >
              <Ionicons 
                name={getTypeIcon(item.type) as any}
                size={24} 
                color="#fff" 
              />
            </LinearGradient>
          )}
        </View>

        {/* Content */}
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.notificationTime}>
              {formatTime(item.timestamp)}
            </Text>
          </View>
          
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>

          {!item.read && (
            <View style={styles.unreadIndicator} />
          )}
        </View>

        {/* Right Arrow */}
        <View style={styles.notificationRight}>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function NotificationsScreen() {
  const router = useRouter();
  const { isLoggedIn, showLoginModal, hideLoginModal, loginModalVisible, currentFeatureName } = useAuthGuard();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    simulateNewNotification 
  } = useNotifications();
  
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  
  // Animations
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(-100)).current;
  const listAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(headerAnim, {
        toValue: 0,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(listAnim, {
        toValue: 1,
        duration: 800,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
      // Add a new notification for demo
      simulateNewNotification();
    }, 1000);
  };

  const handleNotificationPress = (notification: NotificationItem) => {
    markAsRead(notification.id);
    
    // Add haptic feedback
    if (Platform.OS === 'ios') {
      // iOS haptic feedback would go here
    }
    
    // Navigate based on action type
    switch (notification.actionType) {
      case 'movie':
        if (notification.actionData?.movieId) {
          router.push(`/movie/${notification.actionData.movieId}`);
        }
        break;
      case 'payment':
        router.push('/settings/subscriptions');
        break;
      case 'settings':
        router.push('/settings');
        break;
    }
  };

  const handleBack = () => {
    // Exit animations
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.back();
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'movie': return 'film';
      case 'payment': return 'card';
      case 'reminder': return 'alarm';
      case 'system': return 'information-circle';
      case 'update': return 'download';
      default: return 'notifications';
    }
  };

  const getTypeColor = (type: string): [string, string] => {
    switch (type) {
      case 'movie': return ['#E50914', '#B81D24'];
      case 'payment': return ['#4CAF50', '#2E7D32'];
      case 'reminder': return ['#FF9800', '#F57C00'];
      case 'system': return ['#2196F3', '#1565C0'];
      case 'update': return ['#9C27B0', '#6A1B9A'];
      default: return ['#757575', '#424242'];
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const filteredNotifications = notifications.filter(notif => 
    filter === 'all' || (filter === 'unread' && !notif.read)
  );

  const renderNotificationItem = ({ item, index }: { item: NotificationItem; index: number }) => (
    <NotificationItemComponent 
      item={item} 
      index={index} 
      onPress={handleNotificationPress}
      getTypeColor={getTypeColor}
      getTypeIcon={getTypeIcon}
      formatTime={formatTime}
    />
  );

  // Kiểm tra đăng nhập
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        
        {/* Black Background */}
        <View style={styles.background} />

        {/* Header for not logged in state */}
        <View style={styles.header}>
          <View style={styles.headerGradient}>
            <View style={styles.headerContainer}>
              <View style={styles.headerTopRow}>
                <TouchableOpacity 
                  style={styles.modernBackButton}
                  onPress={handleBack}
                  activeOpacity={0.6}
                >
                  <View style={styles.backButtonInner}>
                    <Ionicons name="chevron-back" size={27} color="#fff" />
                  </View>
                </TouchableOpacity>
                
                <View style={styles.headerCenterSection}>
                  <View style={styles.titleRow}>
                    <Text style={styles.modernHeaderTitle}>Thông báo</Text>
                  </View>
                  <Text style={styles.headerSubtitle}>
                    Đăng nhập để xem thông báo
                  </Text>
                </View>

                <View style={styles.modernActionButton}>
                  <View style={[styles.actionButtonInner, { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }]}>
                    <Ionicons name="notifications-off" size={20} color="#fff" />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={[styles.loadingContainer, { flex: 1, justifyContent: 'center' }]}>
          <Ionicons name="notifications-off" size={64} color="#666" style={{ marginBottom: 16 }} />
          <Text style={styles.loadingText}>Bạn cần đăng nhập để xem thông báo</Text>
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={() => showLoginModal('Xem thông báo')}
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        
        {/* Black Background */}
        <View style={styles.background} />

        {/* Header for loading state */}
        <View style={styles.header}>
          <View style={styles.headerGradient}>
            <View style={styles.headerContainer}>
              <View style={styles.headerTopRow}>
                <TouchableOpacity 
                  style={styles.modernBackButton}
                  onPress={handleBack}
                  activeOpacity={0.6}
                >
                  <View style={styles.backButtonInner}>
                    <Ionicons name="chevron-back" size={27} color="#fff" />
                  </View>
                </TouchableOpacity>
                
                <View style={styles.headerCenterSection}>
                  <View style={styles.titleRow}>
                    <Text style={styles.modernHeaderTitle}>Thông báo</Text>
                  </View>
                  <Text style={styles.headerSubtitle}>
                    Đang tải...
                  </Text>
                </View>

                <View style={styles.modernActionButton}>
                  <View style={[styles.actionButtonInner, { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }]}>
                    <Ionicons name="hourglass" size={20} color="#fff" />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={[styles.loadingContainer, { flex: 1, justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color="#E50914" />
          <Text style={styles.loadingText}>Đang tải thông báo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Black Background */}
      <Animated.View style={[styles.background, { opacity: fadeAnim }]} />

      {/* Animated Container */}
      <Animated.View 
        style={[
          styles.animatedContainer,
          {
            transform: [{ translateY: slideAnim }],
            opacity: fadeAnim,
          }
        ]}
      >
        {/* Modern Header */}
        <Animated.View 
          style={[
            styles.header,
            { transform: [{ translateY: headerAnim }] }
          ]}
        >
          <View style={styles.headerGradient}>
            <View style={styles.headerContainer}>
              {/* Top Row */}
              <View style={styles.headerTopRow}>
                <TouchableOpacity 
                  style={styles.modernBackButton}
                  onPress={handleBack}
                  activeOpacity={0.6}
                >
                  <View style={styles.backButtonInner}>
                    <Ionicons name="chevron-back" size={27} color="#fff" />
                  </View>
                </TouchableOpacity>
                
                <View style={styles.headerCenterSection}>
                  <View style={styles.titleRow}>
                    <Text style={styles.modernHeaderTitle}>Thông báo</Text>
                    {unreadCount > 0 && (
                      <Animated.View style={styles.modernBadge}>
                        <LinearGradient
                          colors={['#E50914', '#B81D24']}
                          style={styles.badgeGradient}
                        >
                          <Text style={styles.modernBadgeText}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </Text>
                        </LinearGradient>
                      </Animated.View>
                    )}
                  </View>
                  <Text style={styles.headerSubtitle}>
                    {unreadCount > 0 
                      ? `${unreadCount} thông báo mới` 
                      : 'Tất cả đã được đọc'
                    }
                  </Text>
                </View>

                <TouchableOpacity 
                  style={styles.modernActionButton}
                  onPress={markAllAsRead}
                  activeOpacity={0.6}
                >
                  <View style={styles.actionButtonInner}>
                    <Ionicons name="checkmark-done" size={20} color="#fff" />
                  </View>
                  <Text style={styles.actionButtonText}>Đọc hết</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Notifications List */}
        <Animated.View style={{ flex: 1, opacity: listAnim }}>
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyWrapper}>
              {/* Filter Tabs for empty state */}
              <View style={styles.filterContainer}>
                <TouchableOpacity 
                  style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
                  onPress={() => setFilter('all')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
                    Tất cả ({notifications.length})
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.filterTab, filter === 'unread' && styles.activeFilterTab]}
                  onPress={() => setFilter('unread')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterText, filter === 'unread' && styles.activeFilterText]}>
                    Chưa đọc ({unreadCount})
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.emptyContainer}>
                <LinearGradient
                  colors={['rgba(229, 9, 20, 0.1)', 'transparent']}
                  style={styles.emptyGlow}
                >
                  <Ionicons name="notifications-off" size={80} color="#666" />
                </LinearGradient>
                <Text style={styles.emptyText}>
                  {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
                </Text>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={simulateNewNotification}
                >
                  <Text style={styles.addButtonText}>Thêm thông báo mới</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <FlatList
              data={filteredNotifications}
              renderItem={renderNotificationItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={() => (
                <View style={styles.filterContainer}>
                  <TouchableOpacity 
                    style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
                    onPress={() => setFilter('all')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
                      Tất cả ({notifications.length})
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.filterTab, filter === 'unread' && styles.activeFilterTab]}
                    onPress={() => setFilter('unread')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterText, filter === 'unread' && styles.activeFilterText]}>
                      Chưa đọc ({unreadCount})
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              refreshControl={
                <RefreshControl 
                  refreshing={refreshing} 
                  onRefresh={onRefresh}
                  tintColor="#E50914"
                  colors={['#E50914']}
                />
              }
              contentContainerStyle={styles.listContainer}
            />
          )}
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  animatedContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    position: 'relative',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    backgroundColor: '#000',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernBackButton: {
    marginRight: 16,
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerCenterSection: {
    flex: 1,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  modernHeaderTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginRight: 12,
  },
  headerSubtitle: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  modernBadge: {
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 6,
  },
  badgeGradient: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modernBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modernActionButton: {
    alignItems: 'center',
  },
  actionButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(229, 9, 20, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
    marginBottom: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.9,
  },


  // Legacy styles for backward compatibility
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginRight: 8,
  },
  headerBadge: {
    backgroundColor: '#E50914',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  headerAction: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 100,
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: '#E50914',
  },
  filterText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyWrapper: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyGlow: {
    padding: 40,
    borderRadius: 80,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  notificationWrapper: {
    marginBottom: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  unreadNotification: {
    backgroundColor: 'rgba(229, 9, 20, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.2)',
  },
  glowEffect: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  notificationLeft: {
    marginRight: 16,
  },
  imageContainer: {
    position: 'relative',
  },
  notificationImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  typeIconOverlay: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0A0A0A',
  },
  typeIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
    position: 'relative',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  notificationTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  notificationTime: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
  },
  notificationMessage: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E50914',
  },
  notificationRight: {
    marginLeft: 12,
    opacity: 0.6,
  },
  loginButton: {
    backgroundColor: '#D11030',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 