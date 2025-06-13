import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  useColorScheme,
} from 'react-native';
import { Link } from 'expo-router';
import { Colors } from '../constants/Colors';

const windowWidth = Dimensions.get('window').width;
const COLUMN_GAP = 10;
const NUM_COLUMNS = 2;
const ITEM_WIDTH = (windowWidth - (NUM_COLUMNS + 1) * COLUMN_GAP) / NUM_COLUMNS;
const ITEM_HEIGHT = ITEM_WIDTH * 1.5;

interface Movie {
  movieId: string;
  title: string;
  poster: string;
  movieType: string;
  producer: string;
}

interface Props {
  movies: Movie[];
}

export default function SeriesMovieList({ movies }: Props) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      <View style={styles.gridContainer}>
        {movies.map((movie, index) => (
          <Link
            key={`${movie.movieId}-${index}`}
            href={{
              pathname: '/movies/[id]',
              params: { id: movie.movieId }
            } as any}
            asChild
          >
            <TouchableOpacity style={styles.movieItem}>
              <Image
                source={{ uri: movie.poster }}
                style={styles.poster}
                resizeMode="cover"
              />
              <View style={[styles.infoContainer, { backgroundColor: theme.background }]}>
                <Text 
                  style={[styles.title, { color: theme.text }]}
                  numberOfLines={2}
                >
                  {movie.title}
                </Text>
                <Text style={[styles.type, { color: theme.tabIconDefault }]}>
                  {movie.movieType}
                </Text>
              </View>
            </TouchableOpacity>
          </Link>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: COLUMN_GAP,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: COLUMN_GAP,
  },
  movieItem: {
    width: ITEM_WIDTH,
    marginBottom: 16,
  },
  poster: {
    width: '100%',
    height: ITEM_HEIGHT,
    borderRadius: 8,
  },
  infoContainer: {
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  type: {
    fontSize: 12,
  },
}); 