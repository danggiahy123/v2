import { Feather, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Định nghĩa kiểu cho movie
type Movie = {
    id: number;
    title: string;
    image: any;
};

// Danh sách phim giả định
const movies: Movie[] = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    title: `Phim ${i + 1}`,
    image: require('../assets/anh/phim.png'),
}));

// Gợi ý tìm kiếm
const suggestions: string[] = [
    'dưa hấu lấp lánh',
    'nhạc thiếu nhi hay và ý nghĩa',
    'thiếu niên ca hành',
    'kiyii giai điệu vũ trụ phần 3',
    'hùng long phong bá 3',
];

export default function TimKiem() {
    const [searchText, setSearchText] = useState<string>('');
    const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
    const router = useRouter();

    const handleSuggestionPress = (text: string) => {
        setSearchText(text);
    };

    const handleSearchPress = () => {
        if (searchText.trim() !== '') {
            const results = movies.filter((movie) =>
                movie.title.toLowerCase().includes(searchText.toLowerCase())
            );
            setFilteredMovies(results);
        } else {
            setFilteredMovies([]);
        }
    };

    useEffect(() => {
        if (searchText.trim() !== '') {
            const results = movies.filter((movie) =>
                movie.title.toLowerCase().includes(searchText.toLowerCase())
            );
            setFilteredMovies(results);
        } else {
            setFilteredMovies([]);
        }
    }, [searchText]);

    const renderMovieItem = ({ item }: { item: Movie }) => (
        <View style={styles.movieItem}>
            <Image source={item.image} style={styles.movieImage} />
            <Text style={styles.movieTitle}>{item.title}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Thanh tìm kiếm */}
            <View style={styles.searchBar}>
                <TouchableOpacity onPress={() => router.push('../../index')} style={styles.iconButton}>
                    <Feather name="arrow-left" size={22} color="#fff" />
                </TouchableOpacity>

                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm nội dung giải trí ..."
                    placeholderTextColor="#999"
                    value={searchText}
                    onChangeText={setSearchText}
                    onSubmitEditing={handleSearchPress}
                />

                {searchText ? (
                    <TouchableOpacity onPress={() => setSearchText('')} style={styles.iconButton}>
                        <Feather name="x" size={20} color="#fff" />
                    </TouchableOpacity>
                ) : null}

                <TouchableOpacity onPress={handleSearchPress} style={styles.iconButton}>
                    <Feather name="search" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Khi chưa tìm kiếm */}
            {!searchText && (
                <ScrollView>
                    <Text style={styles.sectionTitle}>Xu hướng gần đây</Text>
                    <FlatList
                        horizontal
                        data={movies}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderMovieItem}
                        contentContainerStyle={{ paddingHorizontal: 16 }}
                        showsHorizontalScrollIndicator={false}
                    />

                    <Text style={styles.sectionTitle}>Gợi ý tìm kiếm</Text>
                    {suggestions.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.suggestionItem}
                            onPress={() => handleSuggestionPress(item)}
                        >
                            <FontAwesome
                                name={index < 2 ? 'history' : 'fire'}
                                size={16}
                                color="#aaa"
                                style={{ marginRight: 10 }}
                            />
                            <Text style={styles.suggestionText}>{item}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {/* Khi có kết quả tìm kiếm */}
            {searchText !== '' && (
                <View style={styles.searchResultContainer}>
                    <Text style={styles.resultText}>Kết quả cho: "{searchText}"</Text>
                    {filteredMovies.length > 0 ? (
                        <FlatList
                            data={filteredMovies}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderMovieItem}
                            numColumns={2}
                            columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
                            contentContainerStyle={{ paddingTop: 10, paddingHorizontal: 16 }}
                        />
                    ) : (
                        <Text style={{ color: '#888', marginTop: 10 }}>
                            Không tìm thấy phim phù hợp.
                        </Text>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        paddingTop: 40,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        margin: 16,
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 44,
    },
    iconButton: {
        padding: 5,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        marginLeft: 10,
        marginRight: 10,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 16,
        marginTop: 20,
        marginBottom: 10,
    },
 movieItem: {
    marginBottom: 16,
    alignItems: 'center',
    width: 140, // cố định hoặc bạn có thể dùng % nhỏ hơn như '42%'
},
movieImage: {
    width: 130, // hoặc '100%' nếu bạn dùng flex
    height: 195, // = 130 * 1.5 theo tỉ lệ 2:3
    borderRadius: 10,
    resizeMode: 'cover',
},

    movieTitle: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 8,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 12,
        paddingVertical: 5,
    },
    suggestionText: {
        color: '#ddd',
        fontSize: 14,
    },
    searchResultContainer: {
        flex: 1,
        paddingTop: 10,
    },
    resultText: {
        color: '#fff',
        fontSize: 16,
        paddingHorizontal: 16,
    },
});
