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
};

// Mảng gradient màu đẹp cho từng thể loại
const GRADIENTS: [string, string][] = [
    ['#262626', '#262626'], 
];

export const GenreSelector = ({ visible, onClose }: GenreSelectorProps) => {
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
    router.push({
      pathname: "/anime/genre/[id]",
      params: { id: genre._id }
    });
    onClose();
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.title}>Thể loại</Text>
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={genres}
            renderItem={renderGenreItem}
            keyExtractor={(item) => item._id}
            numColumns={2}
            contentContainerStyle={styles.genreList}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
            bounces={false}
          />
        </SafeAreaView>
      </View>
    </Modal>
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