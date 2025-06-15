import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    Image,
    Dimensions,
    TextInput,
    StatusBar,
    Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { movieService } from '../../services/movieService';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import type { GridMovie, BannerMovie } from '../../types/movie';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.33; // Exactly 3 items per row
const ITEM_HEIGHT = ITEM_WIDTH * 1.5;

interface CategoryData {
    title: string;
    type: string;
    movies: GridMovie[];
    loading: boolean;
}

export default function SeriesScreen() {
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [showSearchInput, setShowSearchInput] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<GridMovie[]>([]);
    const [categories, setCategories] = useState<CategoryData[]>([
        { title: 'Phim Bộ Hành Động', type: 'action', movies: [], loading: true },
        { title: 'Anime Bộ', type: 'anime', movies: [], loading: true },
        { title: 'Phim Bộ Việt Nam', type: 'vietnamese', movies: [], loading: true },
    ]);
    const [showCountryModal, setShowCountryModal] = useState(false);
    const [countryOptions] = useState([
        { label: 'Tất cả', value: 'all' },
        { label: 'Phim Việt Nam', value: 'vietnamese', country: 'Việt Nam' },
        { label: 'Phim Hành Động', value: 'action', genre: 'Hành động' },
        { label: 'Anime', value: 'anime', genre: 'Anime' }
    ]);
    const [selectedCountry, setSelectedCountry] = useState('vietnamese');
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
    const [bannerMovies, setBannerMovies] = useState<BannerMovie[]>([]);

    useEffect(() => {
        loadAllCategories();
        loadBannerMovies();
    }, []);

    // Add auto-sliding effect
    useEffect(() => {
        if (bannerMovies.length > 0) {
            const timer = setInterval(() => {
                setCurrentBannerIndex((prevIndex) => 
                    prevIndex === bannerMovies.length - 1 ? 0 : prevIndex + 1
                );
            }, 5000); // Change banner every 5 seconds

            return () => clearInterval(timer);
        }
    }, [bannerMovies.length]);

    const loadCategoryMovies = async (type: string) => {
        console.log('loadCategoryMovies called for type:', type); // Debug log
        try {
            let response;
            const LIMIT = 6;
            
            switch (type) {
                case 'action':
                    console.log('Fetching action movies...'); // Debug log
                    response = await movieService.searchMovies({
                        loaiPhim: 'Phim bộ',
                        theLoai: 'Hành động',
                        sapXep: 'moi-nhat',
                        limit: LIMIT
                    });
                    break;
                case 'anime':
                    console.log('Fetching anime...'); // Debug log
                    response = await movieService.getAnime(LIMIT);
                    break;
                case 'vietnamese':
                    console.log('Fetching Vietnamese movies...'); // Debug log
                    response = await movieService.getVietnamese(LIMIT);
                    break;
            }

            console.log(`Response for ${type}:`, response); // Debug log

            if (response && response.status === 'success') {
                let mappedMovies = response.data.movies
                    .slice(0, LIMIT)
                    .map(movie => ({
                        movieId: movie._id,
                        title: movie.movie_title || 'Untitled',
                        poster: movie.poster || movie.image || '',
                        movieType: movie.movie_type || 'Phim bộ',
                        producer: movie.producer || ''
                    }));

                console.log(`Mapped ${mappedMovies.length} movies for ${type}`); // Debug log

                setCategories(prev => {
                    const updated = prev.map(cat =>
                        cat.type === type
                            ? { ...cat, movies: mappedMovies, loading: false }
                            : cat
                    );
                    console.log('Updated categories:', updated); // Debug log
                    return updated;
                });
            }
        } catch (error) {
            console.error(`Error loading ${type} movies:`, error);
            setCategories(prev =>
                prev.map(cat =>
                    cat.type === type ? { ...cat, loading: false } : cat
                )
            );
        }
    };

    const loadAllCategories = () => {
        console.log('loadAllCategories called'); // Debug log
        const initialCategories = [
            { title: 'Phim Bộ Hành Động', type: 'action', movies: [], loading: true },
            { title: 'Anime Bộ', type: 'anime', movies: [], loading: true },
            { title: 'Phim Bộ Việt Nam', type: 'vietnamese', movies: [], loading: true },
        ];
        setCategories(initialCategories);
        
        initialCategories.forEach(category => {
            console.log('Loading category:', category.type); // Debug log
            loadCategoryMovies(category.type);
        });
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadAllCategories();
        setRefreshing(false);
    };

    const toggleSearch = () => {
        if (showSearchInput) {
            setSearchQuery('');
            setIsSearching(false);
        }
        setShowSearchInput(!showSearchInput);
    };

    const handleSearch = async (text: string) => {
        setSearchQuery(text);
        if (text.length > 0) {
            setIsSearching(true);
            try {
                const response = await movieService.searchMovies({
                    loaiPhim: 'Phim bộ',
                    tuKhoa: text,
                    limit: 20
                });
                if (response.status === 'success') {
                    const mappedResults = response.data.movies.map(movie => ({
                        movieId: movie._id,
                        title: movie.movie_title,
                        poster: movie.poster || movie.image || '',
                        movieType: movie.movie_type,
                        producer: movie.producer
                    }));
                    setSearchResults(mappedResults);
                }
            } catch (error) {
                console.error('Search error:', error);
                setSearchResults([]);
            }
        } else {
            setIsSearching(false);
            setSearchResults([]);
        }
    };

    const renderCategory = (category: CategoryData) => (
        <View style={styles.categoryContainer} key={category.type}>
            <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <TouchableOpacity 
                    onPress={() => {
                        // Navigate to list view with proper params for each category
                        router.push({
                            pathname: '/movies/list',
                            params: {
                                type: category.type,
                                title: category.title,
                                viewAll: 'true',
                                // Pass specific API parameters based on category type
                                ...(category.type === 'action' && {
                                    loaiPhim: 'Phim bộ',
                                    theLoai: 'Hành động'
                                }),
                                ...(category.type === 'anime' && {
                                    isAnime: 'true'
                                }),
                                ...(category.type === 'vietnamese' && {
                                    isVietnamese: 'true'
                                })
                            }
                        });
                    }}
                >
                    <Text style={styles.viewAllButton}>Xem tất cả</Text>
                </TouchableOpacity>
            </View>
            {category.loading ? (
                <ActivityIndicator color="#fff" style={styles.categoryLoading} />
            ) : (
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.movieList}
                >
                    {category.movies.slice(0, 6).map((movie, index) => (
                        <TouchableOpacity
                            key={`${movie.movieId}-${index}`}
                            style={styles.movieItem}
                            onPress={() => {
                                router.push({
                                    pathname: '/movies/[id]',
                                    params: { id: movie.movieId }
                                });
                            }}
                        >
                            <View style={styles.moviePosterContainer}>
                                <Image
                                    source={{ uri: movie.poster }}
                                    style={styles.moviePoster}
                                    resizeMode="cover"
                                />
                                <View style={styles.movieGradient} />
                            </View>
                            <Text style={styles.movieTitle} numberOfLines={2}>
                                {movie.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );

    const handleCountrySelect = async (value: string) => {
        setShowCountryModal(false);
        
        // Handle "Show All" option
        if (value === 'all') {
            loadAllCategories();
            return;
        }

        try {
            let response;
            // For Vietnamese movies, get all Vietnamese TV series
            if (value === 'vietnamese') {
                response = await movieService.searchMovies({
                    loaiPhim: 'Phim bộ',
                    sapXep: 'moi-nhat',
                    limit: 100 // Increased limit
                });

                // Filter Vietnamese movies after getting response
                if (response?.status === 'success' && response.data?.movies) {
                    response.data.movies = response.data.movies.filter(movie => 
                        (movie.producer && movie.producer.toLowerCase().includes('việt')) ||
                        (movie.movie_title && movie.movie_title.toLowerCase().includes('việt')) ||
                        (movie.description && movie.description.toLowerCase().includes('việt'))
                    );
                }
            } else if (value === 'action') {
                response = await movieService.searchMovies({
                    loaiPhim: 'Phim bộ',
                    theLoai: 'Hành động',
                    sapXep: 'moi-nhat',
                    limit: 30
                });
            } else if (value === 'anime') {
                response = await movieService.searchMovies({
                    loaiPhim: 'Phim bộ',
                    theLoai: 'Anime',
                    sapXep: 'moi-nhat',
                    limit: 30
                });
            }

            console.log('API Response:', JSON.stringify(response, null, 2)); // Debug log

            if (response?.status === 'success' && response.data?.movies) {
                const mappedMovies = response.data.movies
                    .filter(movie => movie && movie._id && (movie.poster || movie.image))
                    .map(movie => ({
                        movieId: movie._id,
                        title: movie.movie_title || 'Untitled',
                        poster: movie.poster || movie.image || '',
                        movieType: movie.movie_type || 'Phim bộ',
                        producer: movie.producer || ''
                    }));

                console.log('Mapped movies:', mappedMovies); // Debug log

                const selectedOption = countryOptions.find(opt => opt.value === value);
                if (selectedOption) {
                    // Update to show all found movies in a single category
                    setCategories([{
                        title: selectedOption.label,
                        type: value,
                        movies: mappedMovies,
                        loading: false
                    }]);
                }
            }
        } catch (error) {
            console.error('Error loading movies:', error);
            const selectedOption = countryOptions.find(opt => opt.value === value);
            if (selectedOption) {
                setCategories([{
                    title: selectedOption.label,
                    type: value,
                    movies: [],
                    loading: false
                }]);
            }
        }
    };

    const loadBannerMovies = async () => {
        try {
            const response = await movieService.getNewReleases({ bannerLimit: 5 });
            if (response.status === 'success' && response.data?.banner?.movies) {
                setBannerMovies(response.data.banner.movies);
            }
        } catch (error) {
            console.error('Error loading banner movies:', error);
            setBannerMovies([]);
        }
    };

    const renderBanner = () => {
        if (!bannerMovies.length) return null;
        const current = bannerMovies[currentBannerIndex];
        return (
            <View style={styles.bannerContainer}>
                <Image 
                    source={{ uri: current.poster }} 
                    style={styles.bannerImage} 
                    resizeMode="cover" 
                />
                <View style={styles.bannerOverlay} />
                
                <View style={styles.bannerContent}>
                    <View style={styles.bannerInfo}>
                        <Text style={styles.bannerTitle} numberOfLines={2}>
                            {current.title}
                        </Text>
                        <View style={styles.bannerMeta}>
                            <View style={styles.bannerTag}>
                                <Text style={styles.bannerTagText}>{current.movieType}</Text>
                            </View>
                            {current.producer && (
                                <Text style={styles.bannerProducer} numberOfLines={1}>
                                    {current.producer}
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity 
                            style={styles.watchButton}
                            onPress={() => {
                                router.push({
                                    pathname: '/movies/[id]',
                                    params: { id: current.movieId }
                                });
                            }}
                        >
                            <Ionicons name="play" size={20} color="#fff" />
                            <Text style={styles.watchButtonText}>Xem ngay</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Progress Indicators */}
                <View style={styles.progressContainer}>
                    {bannerMovies.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.progressDot,
                                index === currentBannerIndex && styles.activeProgressDot
                            ]}
                        />
                    ))}
                </View>
            </View>
        );
    };

    // Thêm useEffect để log categories khi thay đổi
    useEffect(() => {
        console.log('Current categories:', categories);
    }, [categories]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Phim Bộ</Text>
                <TouchableOpacity onPress={toggleSearch}>
                    <Ionicons name="search-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Genre Selector */}
            <TouchableOpacity 
                style={styles.genreSelector}
                onPress={() => setShowCountryModal(true)}
            >
                <Text style={styles.genreSelectorText}>Chọn thể loại</Text>
                <Ionicons name="chevron-down" size={20} color="#fff" />
            </TouchableOpacity>

            {/* Modal chọn thể loại */}
            <Modal
                visible={showCountryModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowCountryModal(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowCountryModal(false)}
                >
                    <BlurView intensity={80} tint="dark" style={[styles.modalContent, StyleSheet.absoluteFill]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn thể loại</Text>
                            <TouchableOpacity 
                                style={styles.closeButton}
                                onPress={() => setShowCountryModal(false)}
                            >
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.countryList}>
                            {countryOptions.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={styles.countryOption}
                                    onPress={() => handleCountrySelect(option.value)}
                                >
                                    <Text style={styles.countryOptionText}>{option.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </BlurView>
                </TouchableOpacity>
            </Modal>

            {/* Main Content */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#fff"
                    />
                }
            >
                {renderBanner()}
                {categories.map(renderCategory)}
            </ScrollView>

            {/* Search Modal */}
            {showSearchInput && (
                <View style={styles.searchOverlay}>
                    <View style={styles.searchHeader}>
                        <View style={styles.searchInputWrapper}>
                            <Ionicons name="search-outline" size={22} color="#fff" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Tìm kiếm phim..."
                                placeholderTextColor="rgba(255,255,255,0.6)"
                                value={searchQuery}
                                onChangeText={handleSearch}
                                autoFocus
                            />
                        </View>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={toggleSearch}
                        >
                            <Text style={styles.cancelButtonText}>Hủy</Text>
                        </TouchableOpacity>
                    </View>
                    {isSearching && (
                        <ScrollView style={styles.searchResults}>
                            <View style={styles.searchGrid}>
                                {searchResults.map((movie) => (
                                    <TouchableOpacity
                                        key={movie.movieId}
                                        style={styles.searchMovieItem}
                                        onPress={() => {
                                            router.push({
                                                pathname: '/movies/[id]',
                                                params: { id: movie.movieId }
                                            });
                                        }}
                                    >
                                        <View style={styles.searchMoviePosterContainer}>
                                            <Image
                                                source={{ uri: movie.poster }}
                                                style={styles.searchMoviePoster}
                                                resizeMode="cover"
                                            />
                                            <View style={styles.movieGradient} />
                                        </View>
                                        <Text style={styles.searchMovieTitle} numberOfLines={2}>
                                            {movie.title}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
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
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 90,
        paddingTop: 40,
        backgroundColor: '#000',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '600',
    },
    genreSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginHorizontal: 16,
        marginTop: 4,
        marginBottom: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 6,
        width: 120,
    },
    genreSelectorText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalContent: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        marginTop: 90,
        width: 200,
        alignSelf: 'flex-start',
        marginLeft: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
    },
    closeButton: {
        padding: 8,
    },
    countryList: {
        flex: 1,
    },
    countryOption: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    countryOptionText: {
        color: '#fff',
        fontSize: 16,
    },
    content: {
        flex: 1,
    },
    categoryContainer: {
        marginTop: 20,
    },
    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    categoryTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
    },
    viewAllButton: {
        color: '#999',
        fontSize: 14,
    },
    movieList: {
        paddingLeft: 16,
    },
    movieItem: {
        width: ITEM_WIDTH,
        marginRight: 10,
    },
    moviePosterContainer: {
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
    },
    moviePoster: {
        width: ITEM_WIDTH,
        height: ITEM_HEIGHT,
    },
    movieGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 50,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    movieTitle: {
        color: '#fff',
        fontSize: 14,
        marginTop: 8,
        paddingRight: 8,
    },
    searchOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000',
        zIndex: 2,
    },
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 40,
        height: 90,
        backgroundColor: '#000',
    },
    searchInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 40,
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        marginLeft: 8,
    },
    cancelButton: {
        paddingVertical: 8,
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    searchResults: {
        flex: 1,
        padding: 16,
    },
    searchGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    searchMovieItem: {
        width: width * 0.44,
        marginBottom: 20,
    },
    searchMoviePosterContainer: {
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
    },
    searchMoviePoster: {
        width: '100%',
        height: width * 0.66,
    },
    searchMovieTitle: {
        color: '#fff',
        fontSize: 14,
        marginTop: 8,
        paddingRight: 8,
    },
    categoryLoading: {
        marginVertical: 20,
    },
    bannerContainer: {
        height: width * 0.6,
        position: 'relative',
        marginBottom: 20,
        borderRadius: 12,
        overflow: 'hidden',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    bannerOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    bannerContent: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        padding: 20,
    },
    bannerInfo: {
        marginBottom: 16,
    },
    bannerTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    bannerMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    bannerTag: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
    },
    bannerTagText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    bannerProducer: {
        color: '#fff',
        fontSize: 14,
        opacity: 0.8,
    },
    watchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ff3b30',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
        alignSelf: 'flex-start',
        gap: 8,
    },
    watchButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    progressContainer: {
        position: 'absolute',
        top: 16,
        right: 16,
        flexDirection: 'row',
        gap: 6,
    },
    progressDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    activeProgressDot: {
        backgroundColor: '#fff',
        width: 18,
    },
});