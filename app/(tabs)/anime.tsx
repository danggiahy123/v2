import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TabHeader from '../../components/ui/TabHeader';
import SearchModal from '../../components/ui/SearchModal';

export default function AnimeScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);
  const [searchVisible, setSearchVisible] = useState(false);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { 
      useNativeDriver: true,
      listener: (event: any) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const scrollDiff = currentScrollY - lastScrollY.current;
        
        if (scrollDiff > 2 && currentScrollY > 0) {
          headerOpacity.setValue(0);
        } else if (scrollDiff < -2 || currentScrollY <= 0) {
          headerOpacity.setValue(1);
        }
        
        lastScrollY.current = currentScrollY;
      }
    }
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <Animated.ScrollView 
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.content}>
          <View style={styles.comingSoon}>
            <Ionicons name="happy-outline" size={64} color="#888" />
            <Text style={styles.comingSoonTitle}>Hoạt hình</Text>
            <Text style={styles.comingSoonText}>
              Tính năng này sẽ sớm được cập nhật với danh sách hoạt hình và anime mới nhất
            </Text>
          </View>
        </View>
      </Animated.ScrollView>

      <TabHeader 
        title="Hoạt hình"
        onSearchPress={() => setSearchVisible(true)}
        onNotificationPress={() => {}}
        opacity={headerOpacity}
      />

      <SearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        category="anime"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 100, // Space for header
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