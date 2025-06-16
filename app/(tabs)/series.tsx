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

export default function SeriesScreen() {
  // PERFORMANCE OPTIMIZATION - Memoized handlers cho TabHeader
  // Pattern giống AnimeScreen để maintain consistency
  // useCallback essential cho preventing unnecessary TabHeader re-renders
  const handleSearch = useCallback(() => {
    console.log('🔍 Search series - TODO: Implement series search');
    // TODO: Navigate to series search with filters (seasons, episodes, genre)
    // router.push('/search/series');
  }, []);

  const handleNotification = useCallback(() => {
    console.log('🔔 Series notifications - TODO: Implement');
    // TODO: Show series-specific notifications (new episodes, season updates)
    // Could integrate với watchlist và continue watching features
  }, []);

  // SCROLL ANIMATION - Optimized scroll animation
  // Same configuration as AnimeScreen để maintain uniform UX
  const {
    headerOpacity,
    headerTranslateY,
    onScroll: onScrollWithAnimation,
  } = useOptimizedScrollAnimation({
    preset: 'smooth',     // Smooth preset for content screens
    threshold: 50,        // Same as AnimeScreen for consistency
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* 
        TAB HEADER INTEGRATION - Same pattern as AnimeScreen for consistency
        
        DESIGN DECISIONS:
        - title: "Phim bộ & Series" descriptive và SEO-friendly
        - gradientColors: Same as AnimeScreen để uniform experience
        - showGradient: true để enhance readability over dark content
        
        ARCHITECTURE:
        - Reuses TabHeader component eliminating code duplication
        - Consistent props pattern across tab screens
        - Performance optimized với memoized handlers
      */}
      <TabHeader 
        title="Phim bộ & Series"
        onSearchPress={handleSearch}
        onNotificationPress={handleNotification}
        opacity={headerOpacity}        // 🎬 Consistent scroll animation
        translateY={headerTranslateY}  // 🎬 Consistent slide animation
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
          <Ionicons name="tv-outline" size={64} color="#888" />
          <Text style={styles.comingSoonTitle}>Phim bộ</Text>
          <Text style={styles.comingSoonText}>
            Tính năng này sẽ sớm được cập nhật với danh sách phim bộ và series mới nhất
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
  // CLEANUP - Removed duplicate header styles (same pattern as AnimeScreen)
  // This maintains DRY principle và reduces CSS bundle size
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    // LAYOUT COMPENSATION - Account for TabHeader absolute positioning
    // 120px calculated: header(~60px) + safe area(~44px) + spacing(~16px)
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