/**
 * TAB HEADER COMPONENT - Header chuyên dụng cho tab screens
 * 
 * MÔ TẢ:
 * Component header overlay với gradient background, được thiết kế đặc biệt cho
 * các tab screens như Home, Anime, Series. Hỗ trợ absolute positioning để
 * overlay trên banner/hero content.
 * 
 * TÍNH NĂNG:
 * - Absolute positioning với gradient overlay
 * - Logo tự động hoặc custom title
 * - Action buttons (search, notification) 
 * - Animation support với opacity
 * - Safe area handling cho notch/status bar
 * - Performance optimized với memoization
 * - Highly customizable props
 * 
 * SỬ DỤNG:
 * - Home screen: Logo + action buttons
 * - Anime/Series: Title + action buttons  
 * - Custom scenarios: leftComponent + actionButtons
 * 
 * PERFORMANCE:
 * - Memoized animated values
 * - Conditional rendering
 * - useCallback handlers recommended
 */
// import { useRouter } from 'expo-router'; // Not used in this component
import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Platform,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import GenreGrid from '../genre/GenreGrid';
import { notificationService } from '../../services/notificationService';

/**
 * TABHEADER PROPS INTERFACE
 * 
 * @param title - Header title text (optional, nếu không có sẽ hiện logo)
 * @param showLogo - Control logo visibility (default: !title)
 * @param onSearchPress - Search button handler (optional)
 * @param onNotificationPress - Notification button handler (optional)
 * @param onGenrePress - Genre button handler (optional)
 * @param showGenreButton - Control genre button visibility (default: false)
 * @param opacity - Animated value cho fade in/out effect (optional)
 * @param translateY - Animated value for slide animation (optional)
 * @param backgroundColor - Header background color (default: transparent)
 * @param gradientColors - Array màu cho gradient overlay (min 2 colors)
 * @param showGradient - Toggle gradient overlay (default: true)
 * @param actionButtons - Custom action buttons thay thế default (optional)
 * @param leftComponent - Custom left content thay thế title/logo (optional)
 * @param style - Additional custom styles (optional)
 * @param children - Additional content to render below logo/title (optional)
 * @param genres - Array of genre objects
 * @param onGenreSelect - Callback function to handle genre selection
 * @param showGenreSelector - Toggle genre selector visibility
 */
interface TabHeaderProps {
  title?: string;
  showLogo?: boolean;
  onSearchPress?: () => void;
  onNotificationPress?: () => void;
  onGenrePress?: () => void;
  showGenreButton?: boolean;
  opacity?: Animated.AnimatedValue;
  translateY?: Animated.AnimatedValue;
  backgroundColor?: string;
  gradientColors?: [string, string, ...string[]];
  showGradient?: boolean;
  actionButtons?: React.ReactNode;
  leftComponent?: React.ReactNode;
  style?: any;
  children?: React.ReactNode;
  genres?: Array<{ _id: string; genre_name: string; movie_count?: number }>;
  onGenreSelect?: (genre: any) => void;
  showGenreSelector?: boolean;
}

export default function TabHeader({ 
  title,
  showLogo = !title,
  onSearchPress,
  onNotificationPress,
  onGenrePress,
  showGenreButton = false,
  opacity,
  translateY,
  backgroundColor = 'transparent',
  gradientColors = ['rgba(0, 0, 0, 0.93)', 'rgba(0, 0, 0, 0.74)', 'transparent'],
  showGradient = true,
  actionButtons,
  leftComponent,
  style,
  children,
  genres = [],
  onGenreSelect,
  showGenreSelector = false,
}: TabHeaderProps) {
  const insets = useSafeAreaInsets();
  const [genreModalVisible, setGenreModalVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Animation refs
  const defaultOpacity = useMemo(() => new Animated.Value(1), []);
  const defaultTranslateY = useMemo(() => new Animated.Value(0), []);
  const animatedOpacity = opacity || defaultOpacity;
  const animatedTranslateY = translateY || defaultTranslateY;
  
  // Badge animations
  const badgeScale = useRef(new Animated.Value(1)).current;
  const badgeOpacity = useRef(new Animated.Value(1)).current;
  
  const memoizedGradientColors = useMemo(() => gradientColors, [gradientColors]);

  // Subscribe to notification changes
  useEffect(() => {
    const unsubscribe = notificationService.subscribeToUnreadCount((count) => {
      const oldCount = unreadCount;
      setUnreadCount(count);
      
      // Animate badge when count changes
      if (count > oldCount && count > 0) {
        // Bounce animation for new notification
        Animated.sequence([
          Animated.parallel([
            Animated.timing(badgeScale, {
              toValue: 1.3,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(badgeOpacity, {
              toValue: 0.8,
              duration: 100,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.spring(badgeScale, {
              toValue: 1,
              tension: 300,
              friction: 10,
              useNativeDriver: true,
            }),
            Animated.timing(badgeOpacity, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      }
    });

    return unsubscribe;
  }, [unreadCount]);

  const handleGenrePress = () => {
    if (showGenreSelector && genres.length > 0) {
      setGenreModalVisible(true);
    } else if (onGenrePress) {
      onGenrePress();
    }
  };

  const handleGenreSelect = (genre: any) => {
    setGenreModalVisible(false);
    if (onGenreSelect) {
      onGenreSelect(genre);
    }
  };

  const defaultActionButtons = (
    <View style={styles.actions}>
      {onSearchPress && (
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={onSearchPress}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={24} color="white" />
        </TouchableOpacity>
      )}
      {onNotificationPress && (
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={onNotificationPress}
          activeOpacity={0.7}
        >
          <View style={styles.notificationContainer}>
            <Ionicons name="notifications" size={24} color="white" />
            {unreadCount > 0 && (
              <Animated.View 
                style={[
                  styles.notificationBadge,
                  {
                    transform: [{ scale: badgeScale }],
                    opacity: badgeOpacity,
                  }
                ]}
              >
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount.toString()}
                </Text>
              </Animated.View>
            )}
          </View>
        </TouchableOpacity>
      )}
    </View>
  );

  const containerStyle = [
    styles.container,
    { 
      paddingTop: insets.top,
      opacity: animatedOpacity,
      transform: [{ translateY: animatedTranslateY }],
      backgroundColor,
    },
    Platform.OS === 'ios' && styles.iosContainer,
    style
  ];

  const { height: SCREEN_HEIGHT } = Dimensions.get('window');

  return (
    <>
      <Animated.View style={containerStyle}>
        {showGradient && (
          <LinearGradient
            colors={memoizedGradientColors}
            style={styles.gradient}
            pointerEvents="none"
          />
        )}

        <View style={styles.headerContent}>
          <View style={styles.topRow}>
            <View style={styles.leftSection}>
              {leftComponent ? (
                leftComponent
              ) : (
                <>
                  {title ? (
                    <Text style={styles.title}>{title}</Text>
                  ) : showLogo ? (
                    <Image 
                      source={require('../../assets/anh/logo.png')} 
                      style={styles.logoImage} 
                    />
                  ) : null}
                </>
              )}
            </View>
            
            {actionButtons || defaultActionButtons}
          </View>

          {(showGenreButton || showGenreSelector) && (
            <TouchableOpacity 
              style={styles.genreButton} 
              onPress={handleGenrePress}
              activeOpacity={0.7}
            >
              <Text style={styles.genreText}>Thể loại</Text>
              <Ionicons name="chevron-down" size={16} color="#999" />
            </TouchableOpacity>
          )}

          {children}
        </View>
      </Animated.View>

      {/* Genre Selector Modal */}
      {showGenreSelector && (
        <Modal
          visible={genreModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setGenreModalVisible(false)}
        >
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.7)'
          }}>
            <View style={{
              width: '92%',
              maxWidth: 420,
              borderRadius: 24,
              overflow: 'hidden',
              backgroundColor: '#181818',
              padding: 0
            }}>
              <View style={[styles.modalHeader, { borderBottomWidth: 0, padding: 18, paddingBottom: 0 }]}> 
                <Text style={[styles.modalTitle, { fontSize: 26, fontWeight: 'bold', color: '#fff', textAlign: 'center', flex: 1 }]}>Danh mục</Text>
                <TouchableOpacity
                  onPress={() => setGenreModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={{ padding: 12, paddingTop: 0, maxHeight: SCREEN_HEIGHT * 0.92, minHeight: 100, width: '100%' }}>
                <GenreGrid genres={genres as any} onGenrePress={handleGenreSelect} />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  iosContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    height: '200%',
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  leftSection: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
  },
  logoImage: {
    width: 160,
    height: 70,
    resizeMode: 'contain',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 16,
    padding: 4,
  },
  genreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  genreText: {
    color: '#999',
    fontSize: 14,
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 200, // Để modal xuất hiện dưới header
  },
  genreModal: {
    width: 320,
    maxHeight: 400,
    backgroundColor: 'rgba(30,30,30,0.98)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  genreList: {
    paddingVertical: 8,
  },
  genreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  genreItemText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  movieCount: {
    color: '#999',
    fontSize: 14,
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#E50914',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.8)',
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 8,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
}); 