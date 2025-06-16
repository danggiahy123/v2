import { Ionicons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabHeader } from '../../components/ui';
import { useOptimizedScrollAnimation } from '../../hooks';

export default function AnimeScreen() {
  // PERFORMANCE OPTIMIZATION - Memoized handlers cho TabHeader
  // useCallback prevents TabHeader re-render when AnimeScreen re-renders
  // Essential for performance khi có animation hoặc state changes
  const handleSearch = useCallback(() => {
    console.log('🔍 Search anime - TODO: Implement anime search');
    // TODO: Navigate to anime search with filters (genre, year, rating)
    // router.push('/search/anime');
  }, []);

  const handleNotification = useCallback(() => {
    console.log('🔔 Anime notifications - TODO: Implement');
    // TODO: Show anime-specific notifications (new episodes, recommendations)
    // Could show modal or navigate to notifications with anime filter
  }, []);

  // SCROLL ANIMATION - Optimized scroll animation
  // Consistent UX across all tab screens
  const {
    headerOpacity,
    headerTranslateY,
    onScroll: onScrollWithAnimation,
  } = useOptimizedScrollAnimation({
    preset: 'immediate',  // Test immediate mode like your handleScroll logic
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* 
        TAB HEADER INTEGRATION - Thay thế custom header với TabHeader component
        
        CONFIGURATION:
        - title: "Hoạt hình & Anime" (shows title instead of logo)
        - showGradient: true (enables gradient overlay)
        - gradientColors: Lighter gradient để không che khuất content
        - backgroundColor: Semi-transparent background
        
        BENEFITS:
        - Consistent UI với home screen
        - Performance optimized với memoized values
        - Safe area handling automatic
        - Reduces code duplication
      */}
      <TabHeader 
        title="Hoạt hình & Anime"
        onSearchPress={handleSearch}
        onNotificationPress={handleNotification}
        opacity={headerOpacity}        // 🎬 Scroll animation
        translateY={headerTranslateY}  // 🎬 Slide animation
        showGradient={true}
        gradientColors={['rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.4)', 'transparent']}
        backgroundColor="rgba(0, 0, 0, 0.3)"
      />
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        onScroll={onScrollWithAnimation}  // 🎬 Enable header animation
        scrollEventThrottle={16}          // 🎬 Smooth scroll tracking
      >
        <View style={styles.comingSoon}>
          <Ionicons name="happy-outline" size={64} color="#888" />
          <Text style={styles.comingSoonTitle}>Hoạt hình</Text>
          <Text style={styles.comingSoonText}>
            Tính năng này sẽ sớm được cập nhật với danh sách hoạt hình và anime mới nhất từ Nhật Bản, Hàn Quốc và Việt Nam
          </Text>
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
  // REMOVED STYLES - Custom header styles không còn cần thiết
  // header: Removed flexDirection, justifyContent, alignItems, padding
  // headerTitle: Removed fontSize, fontWeight, color - TabHeader handles này
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    // CRITICAL: paddingTop compensates cho absolute positioned TabHeader
    // 120px = header height + safe area + spacing để content không bị che
    paddingTop: 120,
  },
  comingSoon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 100,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
  },
}); 