import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState, useEffect } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Animated,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TabHeader from '../../components/ui/TabHeader';
import SearchModal from '../../components/ui/SearchModal';
import { animeService } from '../../services/animeService';

export default function AnimeScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);
  const [searchVisible, setSearchVisible] = useState(false);
  const [trending, setTrending] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    animeService.getAllAnime().then(res => {
      const data = res.data || {};
      setTrending(data.trending || []);
      setSeries(data.series || []);
      setMovies(data.movies || []);
      setLoading(false);
    }).catch(() => {
      setTrending([]); setSeries([]); setMovies([]); setLoading(false);
    });
  }, []);

  const renderSection = (title: string, data: any[]) => (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>{title}</Text>
      <FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity style={{ marginRight: 12, width: 120 }}>
            <Image source={{ uri: item.poster }} style={{ width: 120, height: 180, borderRadius: 10, backgroundColor: '#222' }} />
            <Text style={{ color: '#fff', width: 120, marginTop: 6 }} numberOfLines={2}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
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
          {renderSection('Anime Trending', trending)}
          {renderSection('Anime Phim Bộ', series)}
          {renderSection('Anime Chiếu Rạp', movies)}
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