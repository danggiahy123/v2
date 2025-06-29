import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type Genre = {
  _id: string;
  genre_name: string;
  description: string;
  movie_count: number;
};

type GenreSelectorProps = {
  visible: boolean;
  onClose: () => void;
  onSelectGenre?: (genre: Genre) => void;
};

// Mảng gradient màu đẹp cho từng thể loại
const GRADIENTS: [string, string][] = [
    ['#262626', '#262626'], 
];

export const GenreSelector = ({ visible, onClose, onSelectGenre }: GenreSelectorProps) => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      const response = await fetch('https://backend-app-lou3.onrender.com/api/genres?type=children&parent_id=6847d080101e640d01a0c37f');
      const data = await response.json();
      if (data.status === 'success' && data.data.genres) {
        setGenres(data.data.genres);
      }
    } catch (error) {
      console.error('Error fetching genres:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenreSelect = (genre: Genre) => {
    if (onSelectGenre) {
      onSelectGenre(genre);
      onClose();
    } else {
      router.push({
        pathname: "/anime/genre/[id]",
        params: { id: genre._id }
      });
      onClose();
    }
  };

  const renderGenreItem = ({ item, index }: { item: Genre; index: number }) => (
    <TouchableOpacity
      style={styles.genreItem}
      onPress={() => handleGenreSelect(item)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={GRADIENTS[index % GRADIENTS.length]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.contentContainer}>
          <Text style={styles.genreName}>{item.genre_name}</Text>
          <View style={styles.overlay} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (!visible) return null;

  return (
    <View style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
      backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center'
    }}>
      <View style={{
        width: 360, backgroundColor: 'rgba(30,30,30,0.98)', borderRadius: 28, padding: 28,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 24,
        elevation: 16,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <Text style={{
            color: '#fff', fontSize: 30, fontWeight: 'bold', letterSpacing: 0.5,
            textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6
          }}>
            Thể loại
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, width: 40, height: 40,
              alignItems: 'center', justifyContent: 'center', shadowColor: '#fff', shadowOpacity: 0.1
            }}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {genres.map((genre) => (
            <TouchableOpacity
              key={genre._id}
              style={{
                width: '48%',
                backgroundColor: '#23272f',
                borderRadius: 18,
                paddingVertical: 26,
                marginBottom: 18,
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: '#444',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.18,
                shadowRadius: 6,
                elevation: 4,
              }}
              activeOpacity={0.85}
              onPress={() => {
                if (onSelectGenre) onSelectGenre(genre);
                onClose();
              }}
            >
              <Text style={{
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 17,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                textAlign: 'center',
                textShadowColor: 'rgba(0,0,0,0.4)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
              }}>
                {genre.genre_name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');
const ITEM_MARGIN = 8;
const ITEM_WIDTH = (width - (ITEM_MARGIN * 6)) / 2;
const ITEM_HEIGHT = ITEM_WIDTH * 0.6;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
  },
  closeButton: {
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  genreList: {
    padding: ITEM_MARGIN * 2,
  },
  row: {
    justifyContent: 'space-between',
  },
  genreItem: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    marginBottom: ITEM_MARGIN * 2,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  gradient: {
    flex: 1,
    padding: 16,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
   
  },
  genreName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
    zIndex: 1,
  },
}); 