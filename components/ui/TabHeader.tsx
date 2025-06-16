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
 * @param opacity - Animated value cho fade in/out effect (optional)
 * @param backgroundColor - Header background color (default: transparent)
 * @param gradientColors - Array màu cho gradient overlay (min 2 colors)
 * @param showGradient - Toggle gradient overlay (default: true)
 * @param actionButtons - Custom action buttons thay thế default (optional)
 * @param leftComponent - Custom left content thay thế title/logo (optional)
 * @param style - Additional custom styles (optional)
 */
interface TabHeaderProps {
  title?: string;
  showLogo?: boolean;
  onSearchPress?: () => void;
  onNotificationPress?: () => void;
  opacity?: Animated.AnimatedValue;
  translateY?: Animated.AnimatedValue;  // 🆕 Added translateY for slide animation
  backgroundColor?: string;
  gradientColors?: [string, string, ...string[]];
  showGradient?: boolean;
  actionButtons?: React.ReactNode;
  leftComponent?: React.ReactNode;
  style?: any;
}

export default function TabHeader({ 
  title,
  showLogo = !title,
  onSearchPress,
  onNotificationPress,
  opacity,
  translateY,
  backgroundColor = 'transparent',
  gradientColors = ['rgb(0, 0, 0)', 'rgba(0, 0, 0, 0.8)', 'transparent'],
  showGradient = true,
  actionButtons,
  leftComponent,
  style,
}: TabHeaderProps) {
  const insets = useSafeAreaInsets();

  // PERFORMANCE OPTIMIZATION - Tối ưu hiệu suất component
  
  // Memoized animated values để tránh tạo mới mỗi lần render
  // Chỉ tạo 1 lần và sử dụng lại, giảm memory allocation
  const defaultOpacity = useMemo(() => new Animated.Value(1), []);
  const defaultTranslateY = useMemo(() => new Animated.Value(0), []);
  const animatedOpacity = opacity || defaultOpacity;
  const animatedTranslateY = translateY || defaultTranslateY;
  
  // Memoize gradient colors array để tránh re-render LinearGradient không cần thiết
  // LinearGradient re-render khi colors array reference thay đổi
  const memoizedGradientColors = useMemo(() => gradientColors, [gradientColors]);

  // DEFAULT ACTION BUTTONS - Render search và notification buttons nếu có handler
  // Chỉ render button khi có onPress handler để tránh vô hiệu hóa button
  // activeOpacity={0.7} cung cấp visual feedback khi touch
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

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          paddingTop: insets.top,
          opacity: animatedOpacity,
          transform: [{ translateY: animatedTranslateY }], // 🆕 Added slide animation
          backgroundColor,
        },
        style
      ]}
    >
      {showGradient && (
        <LinearGradient
          colors={memoizedGradientColors}
          style={styles.gradient}
          pointerEvents="none"
        />
      )}
      
      {/* LEFT COMPONENT OR TITLE/LOGO */}
      <View style={styles.leftSection}>
        {leftComponent ? (
          leftComponent
        ) : title ? (
          <Text style={styles.title}>{title}</Text>
        ) : showLogo ? (
          <Image 
            source={require('../../assets/anh/logo.png')} 
            style={styles.logoImage} 
          />
        ) : null}
      </View>

      {/* RIGHT ACTION BUTTONS */}
      {actionButtons || defaultActionButtons}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    paddingHorizontal: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 999,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    zIndex: -1,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
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
    gap: 16,
  },
  actionButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
}); 