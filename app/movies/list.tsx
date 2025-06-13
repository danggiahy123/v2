import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { movieService } from '../../services/movieService';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.33;
const ITEM_HEIGHT = ITEM_WIDTH * 1.5;

interface Movie {
    movieId: string;
    title: string;
    poster: string;
    movieType: string;
    producer: string;
}

interface MovieResponse {
    _id: string;
    movie_title?: string;
    poster?: string;
    image?: string;
    movie_type?: string;
    producer?: string;
}

export default function MovieListScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const getApiParams = () => {
        const type = params.type as string;
        switch (type) {
            case 'action':
                return {
                    loaiPhim: 'Phim bộ' as const,
                    theLoai: 'Hành động',
                    sapXep: 'moi-nhat' as const
                };
            case 'anime':
                return {
                    loaiPhim: 'Phim bộ' as const,
                    theLoai: 'Anime',
                    sapXep: 'moi-nhat' as const
                };
            case 'vietnamese':
                return {
                    loaiPhim: 'Phim bộ' as const,
                    tuKhoa: 'Việt Nam',
                    sapXep: 'moi-nhat' as const
                };
            default:
                return {
                    loaiPhim: 'Phim bộ' as const,
                    sapXep: 'moi-nhat' as const
                };
        }
    };

    const loadMovies = async (pageNumber = 1, shouldRefresh = false) => {
        try {
            if (pageNumber === 1) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            let response;
            const type = params.type as string;
            const isViewAll = params.viewAll === 'true';
            const pageSize = isViewAll ? 24 : 6;
            const offset = (pageNumber - 1) * pageSize;

            // Tải phim dựa vào loại cụ thể
            switch (type) {
                case 'action':
                    // Phim hành động
                    response = await movieService.searchMovies({
                        loaiPhim: 'Phim bộ',
                        theLoai: 'Hành động',
                        sapXep: 'moi-nhat',
                        limit: pageSize,
                        offset: (pageNumber - 1) * pageSize
                    });
                    console.log('Action movies response:', JSON.stringify(response));
                    
                    if (response.status === 'success' && response.data && response.data.movies) {
                        // Keep all movies from the action category without additional filtering
                        console.log(`Found ${response.data.movies.length} action movies`);
                    }
                    break;
                case 'anime':
                    // Phim anime
                    response = await movieService.getAnime(pageSize);
                    if (response.status === 'success') {
                        console.log('Loading anime movies, page', pageNumber, 'viewAll:', isViewAll, ':', JSON.stringify(response));
                    }
                    break;
                case 'vietnamese':
                    // Phim Việt Nam
                    response = await movieService.getVietnamese(pageSize);
                    if (response.status === 'success') {
                        console.log('Loading vietnamese movies, page', pageNumber, 'viewAll:', isViewAll, ':', JSON.stringify(response));
                    }
                    break;
                default:
                    // Mặc định lấy tất cả phim bộ
                    response = await movieService.searchMovies({
                        loaiPhim: 'Phim bộ',
                        sapXep: 'moi-nhat',
                        limit: pageSize
                    });
            }

            console.log(`Loading ${type} movies, page ${pageNumber}, viewAll: ${isViewAll}:`, response);

            if (response.status === 'success' && response.data && response.data.movies) {
                console.log('Raw movie data:', JSON.stringify(response.data.movies));
                
                const mappedMovies = response.data.movies
                    .filter(movie => {
                        // Only filter for valid ID and image
                        return movie && (movie._id || movie.movieId) && 
                               (movie.poster || movie.image || movie.movie_poster);
                    })
                    .map(movie => {
                        return {
                            movieId: movie._id || movie.movieId,
                            title: movie.movie_title || movie.title || 'Untitled',
                            poster: movie.poster || movie.image || movie.movie_poster || '',
                            movieType: movie.movie_type || movie.movieType || '',
                            producer: movie.producer || ''
                        };
                    });

                console.log('Final mapped movies:', JSON.stringify(mappedMovies));

                if (shouldRefresh || pageNumber === 1) {
                    setMovies(mappedMovies);
                } else {
                    setMovies(prev => [...prev, ...mappedMovies]);
                }

                // Update hasMore based on total count from API
                setHasMore(mappedMovies.length >= pageSize);
            } else {
                console.log('No movies data in response:', JSON.stringify(response));
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error loading movies:', error);
            setMovies([]);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        setMovies([]);
        setPage(1);
        setHasMore(params.viewAll === 'true');
        loadMovies(1);
    }, [params.type, params.viewAll]);

    const onRefresh = () => {
        setRefreshing(true);
        setPage(1);
        loadMovies(1, true);
    };

    const loadMore = () => {
        if (!loadingMore && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadMovies(nextPage);
        }
    };

    const renderMovie = ({ item }: { item: Movie }) => (
        <TouchableOpacity
            style={styles.movieCard}
            onPress={() => router.push({ pathname: '/movies/[id]', params: { id: item.movieId } } as any)}
        >
            <Image
                source={{ uri: item.poster }}
                style={styles.poster}
                resizeMode="cover"
            />
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        </TouchableOpacity>
    );

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color="#fff" />
            </View>
        );
    };

    if (loading && !loadingMore) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#fff" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerTitle: params.title as string || 'Danh sách phim',
                    headerStyle: { backgroundColor: '#000' },
                    headerTintColor: '#fff',
                    headerBackTitle: 'Quay lại',
                    headerTransparent: true,
                    headerBlurEffect: 'dark',
                    headerBackground: () => (
                        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                    ),
                }}
            />

            <FlatList
                data={movies}
                renderItem={renderMovie}
                keyExtractor={(item) => item.movieId}
                numColumns={3}
                contentContainerStyle={styles.movieList}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#fff"
                    />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="film-outline" size={64} color="#666" />
                        <Text style={styles.emptyText}>Không có phim nào</Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    movieList: {
        paddingTop: 100,
        paddingHorizontal: 8,
        paddingBottom: 20,
    },
    movieCard: {
        width: ITEM_WIDTH - 16,
        marginHorizontal: 8,
        marginBottom: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    poster: {
        width: '100%',
        height: ITEM_HEIGHT,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
    },
    title: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 12,
        marginBottom: 8,
        paddingHorizontal: 12,
        lineHeight: 20,
    },
    loadingFooter: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 16,
    },
});