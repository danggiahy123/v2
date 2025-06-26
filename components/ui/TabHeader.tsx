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
import React, { useMemo } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

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
}: TabHeaderProps) {
  const insets = useSafeAreaInsets();
  
  const defaultOpacity = useMemo(() => new Animated.Value(1), []);
  const defaultTranslateY = useMemo(() => new Animated.Value(0), []);
  const animatedOpacity = opacity || defaultOpacity;
  const animatedTranslateY = translateY || defaultTranslateY;
  
  const memoizedGradientColors = useMemo(() => gradientColors, [gradientColors]);

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
          <Ionicons name="notifications" size={24} color="white" />
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

  return (
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

        {showGenreButton && (
          <TouchableOpacity 
            style={styles.genreButton} 
            onPress={onGenrePress}
            activeOpacity={0.7}
          >
            <Text style={styles.genreText}>Thể loại</Text>
            <Ionicons name="chevron-up" size={16} color="#999" />
          </TouchableOpacity>
        )}

        {children}
      </View>
    </Animated.View>
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
}); 