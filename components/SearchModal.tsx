import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  searchMovies,
  addRecentSearch,
  removeRecentSearch,
  clearSearchResults,
} from "../store/slices/movieSlice";
import type { Movie } from "../store/slices/movieSlice";
import type { RootState } from "../store/store";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEMS_PER_PAGE = 10;

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
}

const SearchModal = ({ visible, onClose }: SearchModalProps) => {
  const dispatch = useAppDispatch();
  const { searchResults, recentSearches, loading, error } = useAppSelector(
    (state: RootState) => state.movies
  );
  const [searchText, setSearchText] = useState("");
  const [displayedResults, setDisplayedResults] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (searchResults.length > 0) {
      setDisplayedResults(searchResults.slice(0, ITEMS_PER_PAGE));
      setPage(1);
      setHasMore(searchResults.length > ITEMS_PER_PAGE);
    } else {
      setDisplayedResults([]);
      setHasMore(false);
    }
  }, [searchResults]);

  const loadMoreResults = useCallback(() => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;
    const startIndex = (nextPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    
    setTimeout(() => {
      const newResults = searchResults.slice(startIndex, endIndex);
      setDisplayedResults(prev => [...prev, ...newResults]);
      setPage(nextPage);
      setHasMore(endIndex < searchResults.length);
      setIsLoadingMore(false);
    }, 500);
  }, [page, hasMore, isLoadingMore, searchResults]);

  const handleSearch = async (keyword: string) => {
    if (!keyword.trim()) {
      dispatch(clearSearchResults());
      return;
    }

    try {
      await dispatch(searchMovies({ tuKhoa: keyword })).unwrap();
      dispatch(addRecentSearch(keyword));
    } catch (error: any) {
      console.error("Search failed:", error?.message || error);
    }
  };

  const handleTextChange = (text: string) => {
    setSearchText(text);
    handleSearch(text); // Tìm kiếm ngay khi người dùng gõ
  };

  const handleRecentSearch = (keyword: string) => {
    setSearchText(keyword);
    handleSearch(keyword);
  };

  const renderMovieItem = ({ item }: { item: Movie }) => (
    <TouchableOpacity style={styles.movieItem} activeOpacity={0.7}>
      <Image
        source={{
          uri: item.poster || item.image || item.uri || "https://via.placeholder.com/300x450",
        }}
        style={styles.movieImage}
        resizeMode="cover"
      />
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle} numberOfLines={2}>
          {item.movie_title}
        </Text>
        <Text style={styles.movieYear}>
          {item.production_time?.split("T")[0]?.split("-")[0] || "N/A"}
        </Text>
        {item.is_free && (
          <View style={styles.freeTagContainer}>
            <Text style={styles.freeTag}>Miễn phí</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderRecentSearchItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.recentItem}
      onPress={() => handleRecentSearch(item)}
      activeOpacity={0.7}
    >
      <View style={styles.recentItemContent}>
        <View style={styles.recentIconContainer}>
          <Ionicons name="time-outline" size={20} color="#999" />
        </View>
        <Text style={styles.recentText} numberOfLines={1}>{item}</Text>
      </View>
      <TouchableOpacity 
        onPress={() => dispatch(removeRecentSearch(item))}
        style={styles.removeButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={20} color="#999" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color="#999" />
      </View>
    );
  };

  const MovieList = () => (
    <View>
      <Text style={styles.resultCount}>
        {searchResults.length} kết quả cho "{searchText}"
      </Text>
      <FlatList
        data={displayedResults}
        renderItem={renderMovieItem}
        keyExtractor={item => item._id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.movieList}
        onEndReached={loadMoreResults}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        columnWrapperStyle={styles.columnWrapper}
      />
    </View>
  );

  const RecentSearchList = () => (
    <FlatList
      data={recentSearches}
      renderItem={renderRecentSearchItem}
      keyExtractor={(item, index) => `recent-${index}`}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={true}
      scrollEventThrottle={16}
      bounces={true}
      overScrollMode="always"
      ListHeaderComponent={
        searchText ? (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={48} color="#999" />
            <Text style={styles.noResults}>
              Không tìm thấy kết quả cho "{searchText}"
            </Text>
          </View>
        ) : (
          <Text style={styles.sectionTitle}>Tìm kiếm gần đây</Text>
        )
      }
    />
  );

  if (!visible) return null;

  return (
    <View style={styles.modalContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            value={searchText}
            onChangeText={handleTextChange}
            placeholder="Tìm kiếm phim..."
            placeholderTextColor="#999"
            style={styles.input}
            onSubmitEditing={() => handleSearch(searchText)}
            returnKeyType="search"
            autoFocus
          />
          {searchText ? (
            <TouchableOpacity
              onPress={() => {
                setSearchText("");
                dispatch(clearSearchResults());
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.resultsContainer}>
        {loading && !isLoadingMore ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#999" />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#999" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : searchResults.length > 0 ? (
          <MovieList />
        ) : (
          <RecentSearchList />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height + 100,
    zIndex: 9999,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingBottom: 8,
    paddingHorizontal: 12,
    backgroundColor: "#000000",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    zIndex: 1,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2C2C2C",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 40,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    fontSize: 15,
    color: "#fff",
    padding: 0,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  gridContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
  },
  movieItem: {
    width: (SCREEN_WIDTH - 40) / 2,
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: '#1a1a1a',
  },
  movieImage: {
    width: '100%',
    height: ((SCREEN_WIDTH - 40) / 2) * 1.5,
    borderRadius: 8,
    backgroundColor: "#333",
  },
  movieInfo: {
    padding: 12,
  },
  movieTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  movieYear: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  freeTagContainer: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    padding: 4,
    alignSelf: 'flex-start',
  },
  freeTag: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    flexGrow: 1,
    paddingTop: 8,
    paddingBottom: 120,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  recentItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  recentIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2C2C2C",
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentText: {
    fontSize: 15,
    color: "#fff",
    flex: 1,
  },
  removeButton: {
    padding: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#000000",
  },
  resultCount: {
    fontSize: 14,
    color: "#999",
    marginBottom: 16,
    marginLeft: 16,
  },
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: "#000000",
  },
  noResults: {
    fontSize: 15,
    color: "#999",
    marginTop: 16,
    textAlign: "center",
  },
  errorText: {
    color: "#E53935",
    fontSize: 15,
    marginTop: 16,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginVertical: 16,
    marginHorizontal: 16,
  },
  loaderContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  movieList: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
});

export default SearchModal;
