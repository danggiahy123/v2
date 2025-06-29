import React from 'react';
import { FlatList, TouchableOpacity, Image, View, Text, StyleSheet } from 'react-native';

interface Genre {
  _id: string;
  genre_name: string;
  poster: string;
}

interface GenreGridProps {
  genres: Genre[];
  onGenrePress: (genre: Genre) => void;
  limit?: number;
}

const GenreGrid: React.FC<GenreGridProps> = ({ genres, onGenrePress, limit }) => {
  const displayGenres = limit ? genres.slice(0, limit) : genres;

  return (
    <FlatList
      data={displayGenres}
      numColumns={2}
      keyExtractor={item => item._id}
      columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 18 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.genreItem}
          onPress={() => onGenrePress(item)}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: item.poster }}
            style={styles.genreImage}
            resizeMode="cover"
          />
          <View style={styles.overlay}>
            <Text style={styles.genreName} numberOfLines={2}>
              {item.genre_name}
            </Text>
          </View>
        </TouchableOpacity>
      )}
      scrollEnabled={true}
      showsVerticalScrollIndicator={true}
      style={{ flexGrow: 0 }}
    />
  );
};

const styles = StyleSheet.create({
  genreItem: {
    flex: 1,
    marginHorizontal: 8,
    marginBottom: 18,
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 110,
    maxHeight: 130,
    backgroundColor: '#181818',
    elevation: 2,
  },
  genreImage: {
    width: '100%',
    height: 130,
    borderRadius: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  genreName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});

export default GenreGrid; 