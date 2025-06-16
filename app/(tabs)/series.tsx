<<<<<<< Updated upstream
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SeriesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Phim bộ</Text>
        <Ionicons name="search" size={24} color="#fff" />
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.comingSoon}>
          <Ionicons name="tv" size={64} color="#888" />
          <Text style={styles.comingSoonTitle}>Phim bộ</Text>
          <Text style={styles.comingSoonText}>
            Tính năng này sẽ sớm được cập nhật với danh sách phim bộ mới nhất
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
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
=======
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Icon = MaterialCommunityIcons;
const { width } = Dimensions.get('window');

// --- Dữ liệu giả định cho các phim bộ và thể loại phim bộ ---
const latestSeries = [
    { id: 'ls1', title: 'Phim Bộ Mới Nhất 1', image: require('../../assets/anh/phim.png') },
    { id: 'ls2', title: 'Phim Bộ Mới Nhất 2', image: require('../../assets/anh/phim.png') },
    { id: 'ls3', title: 'Phim Bộ Mới Nhất 3', image: require('../../assets/anh/phim.png') },
    { id: 'ls4', title: 'Phim Bộ Mới Nhất 4', image: require('../../assets/anh/phim.png') },
    { id: 'ls5', title: 'Phim Bộ Mới Nhất 5', image: require('../../assets/anh/phim.png') },
];

const allSeries = [
    { id: 'as1', title: 'Phim Bộ A', image: require('../../assets/anh/phim.png') },
    { id: 'as2', title: 'Phim Bộ B', image: require('../../assets/anh/phim.png') },
    { id: 'as3', title: 'Phim Bộ C', image: require('../../assets/anh/phim.png') },
    { id: 'as4', title: 'Phim Bộ D', image: require('../../assets/anh/phim.png') },
    { id: 'as5', title: 'Phim Bộ E', image: require('../../assets/anh/phim.png') },
    { id: 'as6', title: 'Phim Bộ F', image: require('../../assets/anh/phim.png') },
    { id: 'as7', title: 'Phim Bộ G', image: require('../../assets/anh/phim.png') },
    { id: 'as8', title: 'Phim Bộ H', image: require('../../assets/anh/phim.png') },
    { id: 'as9', title: 'Phim Bộ I', image: require('../../assets/anh/phim.png') },
    { id: 'as10', title: 'Phim Bộ J', image: require('../../assets/anh/phim.png') },
];

// Định nghĩa kiểu dữ liệu cho thể loại lấy từ API
interface CategoryItem {
  _id: string;
  genre_name: string;
  description: string;
  poster: string;
  movie_count: number;
}

const Phimbo: React.FC = () => {
    const router = useRouter();
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    // Thay đổi trạng thái mặc định của selectedCategoryName thành 'Thể loại'
    const [selectedCategoryName, setSelectedCategoryName] = useState<string>('Thể loại');

    const [seriesCategoriesData, setSeriesCategoriesData] = useState<CategoryItem[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    // Hàm fetch dữ liệu thể loại từ API
    const fetchSeriesCategories = useCallback(async () => {
        setLoadingCategories(true);
        console.log('--- PHIMBO: BẮT ĐẦU GỌI API THỂ LOẠI (genres) ---');
        try {
            const response = await fetch('https://backend-app-lou3.onrender.com/api/genres?type=children&parent_id=68418dc73556ab3de6e4c434');

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Lỗi HTTP: ${response.status} - ${errorText || response.statusText}`);
            }

            const json = await response.json();
            console.log('--- PHIMBO: PHẢN HỒI API THỂ LOẠI (genres) ---');
            console.log(JSON.stringify(json, null, 2));

            if (json.status === 'success' && json.data && Array.isArray(json.data.genres)) {
                const formattedData: CategoryItem[] = json.data.genres.map((item: any) => ({
                    _id: item._id,
                    genre_name: item.genre_name,
                    description: item.description || '',
                    poster: item.poster || '',
                    movie_count: item.movie_count || 0,
                }));
                setSeriesCategoriesData(formattedData);
                // Giữ nguyên selectedCategoryName là 'Thể loại' nếu bạn muốn nó luôn là mặc định ban đầu
                // Nếu muốn đặt là tên thể loại đầu tiên từ API, uncomment dòng dưới:
                // if (formattedData.length > 0) {
                //     setSelectedCategoryName(formattedData[0].genre_name);
                // }
            } else {
                console.warn('PHIMBO: Dữ liệu thể loại phim bộ không đúng định dạng hoặc status không phải success:', json);
                Alert.alert('Lỗi Dữ Liệu', 'Không thể tải thể loại phim bộ: Cấu trúc dữ liệu không phù hợp hoặc lỗi từ server.');
                setSeriesCategoriesData([]);
            }
        } catch (err: any) {
            console.error('PHIMBO: LỖI KHI TẢI THỂ LOẠI PHIM BỘ:', err);
            Alert.alert('Lỗi Kết Nối', `Không thể tải thể loại phim bộ. Chi tiết: ${err.message}`);
            setSeriesCategoriesData([]);
        } finally {
            setLoadingCategories(false);
            console.log('--- PHIMBO: KẾT THÚC GỌI API THỂ LOẠI (genres) ---');
        }
    }, []);

    useEffect(() => {
        fetchSeriesCategories();
    }, [fetchSeriesCategories]);

    const handleCategorySelect = (category: CategoryItem) => {
        setSelectedCategoryName(category.genre_name);
        setShowCategoryModal(false);
        console.log('Đã chọn thể loại:', category.genre_name, 'ID:', category._id);
    };

    const renderMovieGridItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.movieGridItem}
            onPress={() => router.push('../chitietphimdai')}
        >
            <Image source={item.image} style={styles.movieGridImage} />
        </TouchableOpacity>
    );

    const renderMovieRowItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.movieRowItem}
            onPress={() => router.push('../chitietphimdai')}
        >
            <Image source={item.image} style={styles.movieRowImage} />
            <Text style={styles.movieRowTitle} numberOfLines={2}>{item.title}</Text>
        </TouchableOpacity>
    );

    const MovieSection = ({ title, data, numColumns = 0, horizontal = false, isGrid = false }: any) => {
        if (!data || data.length === 0) {
            return null;
        }
        return (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{title}</Text>
                    {!isGrid && (
                        <TouchableOpacity style={styles.sectionSeeAllButton}>
                            <Text style={styles.sectionSeeAllText}>Xem tất cả</Text>
                            <Icon name="chevron-right" size={20} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
                {horizontal ? (
                    <FlatList
                        data={data}
                        renderItem={renderMovieRowItem}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalListContent}
                    />
                ) : (
                    <FlatList
                        data={data}
                        renderItem={renderMovieGridItem}
                        keyExtractor={(item) => item.id}
                        numColumns={numColumns}
                        scrollEnabled={false}
                        columnWrapperStyle={numColumns > 1 ? styles.row : null}
                        contentContainerStyle={isGrid ? styles.allSeriesGrid : null}
                    />
                )}
            </View>
        );
    };

    if (loadingCategories) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#E50914" />
                    <Text style={styles.loadingText}>Đang tải thể loại phim bộ...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.scrollViewContent}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                        <Icon name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>

                    {/* Thanh chọn thể loại */}
                    <TouchableOpacity
                        style={styles.categoryPickerHeader}
                        onPress={() => setShowCategoryModal(true)}
                    >
                        <Text style={styles.categoryPickerHeaderText}>{selectedCategoryName}</Text>
                        <Icon name="chevron-down" size={20} color="#fff" />
                    </TouchableOpacity>

                    {/* Tiêu đề "Phim Bộ" */}
                    <View style={styles.headerTitleContainer}> {/* Bọc trong View để dễ căn giữa */}
                         <Text style={styles.headerTitle}>Phim Bộ</Text>
                    </View>

                    <TouchableOpacity style={styles.headerButton} onPress={() => router.push('../timkiem')}>
                        <Icon name="magnify" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Section: Phim Bộ Mới Nhất */}
                <MovieSection title="Phim Bộ Mới Nhất" data={latestSeries} horizontal={true} />
                <View style={styles.divider} />

                {/* Section: Tất Cả Phim Bộ (dạng lưới) */}
                <MovieSection title="Tất Cả Phim Bộ" data={allSeries} numColumns={3} isGrid={true} />
                <View style={styles.divider} />

                {/* Các Section thể loại Phim Bộ */}
                {seriesCategoriesData.map((category) => (
                    <React.Fragment key={category._id}>
                        <MovieSection title={category.genre_name} data={latestSeries} horizontal={true} />
                        <View style={styles.divider} />
                    </React.Fragment>
                ))}

                <View style={{ height: 60 }} />

            </ScrollView>

            {/* Modal chọn thể loại */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showCategoryModal}
                onRequestClose={() => setShowCategoryModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPressOut={() => setShowCategoryModal(false)}
                >
                    <View style={styles.categoryModalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Thể loại</Text>
                            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                                <Icon name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={seriesCategoriesData}
                            keyExtractor={(item) => item._id}
                            numColumns={2}
                            columnWrapperStyle={styles.categoryModalRow}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.categoryModalItem}
                                    onPress={() => handleCategorySelect(item)}
                                >
                                    {item.poster ? (
                                        <Image source={{ uri: item.poster }} style={styles.categoryModalImage} />
                                    ) : (
                                        <View style={[styles.categoryModalImage, { backgroundColor: '#444', justifyContent: 'center', alignItems: 'center' }]}>
                                          <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>{item.genre_name}</Text>
                                        </View>
                                    )}
                                    <View style={styles.categoryModalTextOverlay}>
                                        <Text style={styles.categoryModalText}>{item.genre_name}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollViewContent: {
        flexGrow: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    loadingText: {
        color: '#fff',
        marginTop: 10,
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        // justify-content: 'space-between' sẽ đẩy các item ra xa nhau
        // Thay bằng căn giữa nếu muốn tiêu đề "Phim Bộ" nằm giữa các thành phần khác.
        // Để linh hoạt hơn, chúng ta sẽ dùng flex: 1 cho headerTitleContainer
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#000',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    headerButton: {
        padding: 5,
        // Dùng marginRight để tạo khoảng cách giữa nút back và category picker
    },
    headerTitleContainer: { // Container mới cho tiêu đề
        flex: 1, // Chiếm hết không gian còn lại
        alignItems: 'center', // Căn giữa nội dung bên trong nó
        // Để headerTitle không còn position: 'absolute', nó sẽ nằm trong flow bình thường
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        // Bỏ position: 'absolute' ở đây
        // Bỏ left, right, textAlign, zIndex
    },
    categoryPickerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        marginLeft: 8, // Giảm khoảng cách từ nút mũi tên quay lại
        // Có thể dùng gap trong React Native 0.71+ nếu bạn đang dùng phiên bản mới
    },
    categoryPickerHeaderText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginRight: 5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryModalContainer: {
        backgroundColor: '#1a1a1a',
        borderRadius: 10,
        width: '90%',
        maxHeight: '80%',
        padding: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        marginBottom: 10,
    },
    modalTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    categoryModalRow: {
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    categoryModalItem: {
        width: (width * 0.9 - 30) / 2,
        height: ((width * 0.9 - 30) / 2) * 0.7,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#222',
        marginBottom: 10,
        marginHorizontal: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryModalImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        position: 'absolute',
    },
    categoryModalTextOverlay: {
        backgroundColor: 'rgba(0,0,0,0.4)',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryModalText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        paddingHorizontal: 5,
    },
    section: {
        paddingHorizontal: 15,
        paddingTop: 15,
        paddingBottom: 5,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    sectionSeeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionSeeAllText: {
        color: '#fff',
        fontSize: 14,
        marginRight: 5,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    movieGridItem: {
        width: (width - 30 - 20) / 3,
        height: ((width - 30 - 20) / 3) * 1.4,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#222',
        marginBottom: 10,
    },
    movieGridImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    allSeriesGrid: {
        paddingHorizontal: 0,
        marginBottom: 10,
    },
    horizontalListContent: {
        paddingRight: 15,
    },
    movieRowItem: {
        width: width * 0.3,
        marginRight: 10,
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    movieRowImage: {
        width: '100%',
        height: width * 0.3 * 1.4,
        borderRadius: 8,
        resizeMode: 'cover',
        marginBottom: 5,
    },
    movieRowTitle: {
        color: '#fff',
        fontSize: 12,
        textAlign: 'left',
        width: '100%',
    },
    divider: {
        height: 1,
        backgroundColor: '#333',
        marginHorizontal: 15,
        marginVertical: 10,
    },
});

export default Phimbo;
>>>>>>> Stashed changes
