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

export default function AnimeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hoạt hình</Text>
        <Ionicons name="search" size={24} color="#fff" />
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.comingSoon}>
          <Ionicons name="happy-outline" size={64} color="#888" />
          <Text style={styles.comingSoonTitle}>Hoạt hình</Text>
          <Text style={styles.comingSoonText}>
            Tính năng này sẽ sớm được cập nhật với danh sách hoạt hình và anime mới nhất
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
  ActivityIndicator, // Import ActivityIndicator
  Alert, // Import Alert for error messages
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Icon = MaterialCommunityIcons;
const { width } = Dimensions.get('window');

// --- Dữ liệu giả định cho các phim hoạt hình (vì chưa có API cụ thể cho phim) ---
const latestCartoons = [
    { id: 'lca1', title: 'Hoạt Hình Mới Nhất 1', image: require('../../assets/anh/phim.png') },
    { id: 'lca2', title: 'Hoạt Hình Mới Nhất 2', image: require('../../assets/anh/phim.png') },
    { id: 'lca3', title: 'Hoạt Hình Mới Nhất 3', image: require('../../assets/anh/phim.png') },
    { id: 'lca4', title: 'Hoạt Hình Mới Nhất 4', image: require('../../assets/anh/phim.png') },
    { id: 'lca5', title: 'Hoạt Hình Mới Nhất 5', image: require('../../assets/anh/phim.png') },
];

const allCartoons = [
    { id: 'aca1', title: 'Hoạt Hình A', image: require('../../assets/anh/phim.png') },
    { id: 'aca2', title: 'Hoạt Hình B', image: require('../../assets/anh/phim.png') },
    { id: 'aca3', title: 'Hoạt Hình C', image: require('../../assets/anh/phim.png') },
    { id: 'aca4', title: 'Hoạt Hình D', image: require('../../assets/anh/phim.png') },
    { id: 'aca5', title: 'Hoạt Hình E', image: require('../../assets/anh/phim.png') },
    { id: 'aca6', title: 'Hoạt Hình F', image: require('../../assets/anh/phim.png') },
    { id: 'aca7', title: 'Hoạt Hình G', image: require('../../assets/anh/phim.png') },
    { id: 'aca8', title: 'Hoạt Hình H', image: require('../../assets/anh/phim.png') },
    { id: 'aca9', title: 'Hoạt Hình I', image: require('../../assets/anh/phim.png') },
    { id: 'aca10', title: 'Hoạt Hình J', image: require('../../assets/anh/phim.png') },
];

// Định nghĩa kiểu dữ liệu cho thể loại lấy từ API (giống Phim Bộ)
interface CategoryItem {
  _id: string;
  genre_name: string;
  description: string;
  poster: string;
  movie_count: number;
}

const Hoathinh: React.FC = () => {
    const router = useRouter();
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    // Đã thay đổi text mặc định thành "Thể loại"
    const [selectedCategoryName, setSelectedCategoryName] = useState<string>('Thể loại');

    // State để lưu dữ liệu thể loại từ API cho phim hoạt hình
    const [cartoonCategoriesData, setCartoonCategoriesData] = useState<CategoryItem[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    // Hàm fetch dữ liệu thể loại phim hoạt hình từ API
    const fetchCartoonCategories = useCallback(async () => {
        setLoadingCategories(true);
        console.log('--- PHIMHOATHINH: BẮT ĐẦU GỌI API THỂ LOẠI HOẠT HÌNH ---');
        try {
            // SỬ DỤNG API THỂ LOẠI HOẠT HÌNH BẠN ĐÃ CUNG CẤP
            const response = await fetch('https://backend-app-lou3.onrender.com/api/genres?type=children&parent_id=683d7c44d0ee4aeb15a11382');

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Lỗi HTTP: ${response.status} - ${errorText || response.statusText}`);
            }

            const json = await response.json();
            console.log('--- PHIMHOATHINH: PHẢN HỒI API THỂ LOẠI HOẠT HÌNH ---');
            console.log(JSON.stringify(json, null, 2));

            if (json.status === 'success' && json.data && Array.isArray(json.data.genres)) {
                const formattedData: CategoryItem[] = json.data.genres.map((item: any) => ({
                    _id: item._id,
                    genre_name: item.genre_name,
                    description: item.description || '',
                    poster: item.poster || '',
                    movie_count: item.movie_count || 0,
                }));
                setCartoonCategoriesData(formattedData);
                // Bạn có thể giữ nguyên 'Thể loại' hoặc đặt là tên thể loại đầu tiên từ API
                // if (formattedData.length > 0) {
                //     setSelectedCategoryName(formattedData[0].genre_name); // Bỏ comment nếu muốn hiển thị thể loại đầu tiên
                // }
            } else {
                console.warn('PHIMHOATHINH: Dữ liệu thể loại hoạt hình không đúng định dạng hoặc status không phải success:', json);
                Alert.alert('Lỗi Dữ Liệu', 'Không thể tải thể loại phim hoạt hình: Cấu trúc dữ liệu không phù hợp hoặc lỗi từ server.');
                setCartoonCategoriesData([]);
            }
        } catch (err: any) {
            console.error('PHIMHOATHINH: LỖI KHI TẢI THỂ LOẠI HOẠT HÌNH:', err);
            Alert.alert('Lỗi Kết Nối', `Không thể tải thể loại phim hoạt hình. Chi tiết: ${err.message}`);
            setCartoonCategoriesData([]);
        } finally {
            setLoadingCategories(false);
            console.log('--- PHIMHOATHINH: KẾT THÚC GỌI API THỂ LOẠI HOẠT HÌNH ---');
        }
    }, []);

    useEffect(() => {
        fetchCartoonCategories();
    }, [fetchCartoonCategories]);

    // Hàm xử lý khi chọn một thể loại từ modal
    const handleCategorySelect = (category: CategoryItem) => {
        setSelectedCategoryName(category.genre_name);
        setShowCategoryModal(false);
        console.log('Đã chọn thể loại hoạt hình:', category.genre_name, 'ID:', category._id);
        // Logic lọc phim hoạt hình theo thể loại sẽ được thêm ở đây nếu bạn fetch phim thật
    };

    // Component hiển thị mỗi item phim trong lưới
    const renderMovieGridItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.movieGridItem}
            onPress={() => router.push('../chitietphimdai')} // Có thể đổi thành ../chitietphimhoathinh nếu có
        >
            <Image source={item.image} style={styles.movieGridImage} />
        </TouchableOpacity>
    );

    // Component hiển thị mỗi item phim theo chiều ngang
    const renderMovieRowItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.movieRowItem}
            onPress={() => router.push('../chitietphimdai')} // Có thể đổi thành ../chitietphimhoathinh nếu có
        >
            <Image source={item.image} style={styles.movieRowImage} />
            <Text style={styles.movieRowTitle} numberOfLines={2}>{item.title}</Text>
        </TouchableOpacity>
    );

    // Component chung cho mỗi section phim
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
                    <Text style={styles.loadingText}>Đang tải thể loại phim hoạt hình...</Text>
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
                        {/* Đã thay đổi thứ tự và thêm style chevronIcon để icon ở bên trái text */}
                        <Text style={styles.categoryPickerHeaderText}>{selectedCategoryName}</Text>
                        <Icon name="chevron-down" size={20} color="#fff" />
                    </TouchableOpacity>

                    {/* Tiêu đề "Hoạt hình" */}
                    <View style={styles.headerTitleContainer}> {/* Bọc trong View để dễ căn giữa */}
                         <Text style={styles.headerTitle}>Hoạt hình</Text>
                    </View>

                    <TouchableOpacity style={styles.headerButton} onPress={() => router.push('../timkiem')}>
                        <Icon name="magnify" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Section: Phim Hoạt Hình Mới Nhất */}
                <MovieSection title="Phim Hoạt Hình Mới Nhất" data={latestCartoons} horizontal={true} />
                <View style={styles.divider} />

                {/* Section: Tất Cả Phim Hoạt Hình (dạng lưới) */}
                <MovieSection title="Tất Cả Phim Hoạt Hình" data={allCartoons} numColumns={3} isGrid={true} />
                <View style={styles.divider} />

                {/* Các Section thể loại Phim Hoạt Hình từ API */}
                {cartoonCategoriesData.map((category) => (
                    <React.Fragment key={category._id}>
                        <MovieSection title={category.genre_name} data={latestCartoons} horizontal={true} />
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
                            data={cartoonCategoriesData} // Sử dụng dữ liệu thể loại fetched từ API
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
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#000',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    headerButton: {
        padding: 5,
    },
    headerTitleContainer: { // Container mới cho tiêu đề
        flex: 1, // Chiếm hết không gian còn lại
        alignItems: 'center', // Căn giữa nội dung bên trong nó
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    categoryPickerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        marginLeft: 8, // Giữ nguyên 8 để sát, có thể điều chỉnh thêm
        // justifyContent: 'center' nếu bạn muốn text và icon luôn ở giữa cái cục này
    },
    categoryPickerHeaderText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        // marginRight: 5, // Đã bỏ hoặc điều chỉnh để icon nằm sát text hơn
    },
    // chevronIcon: { // Style này không còn cần thiết nếu icon nằm cùng dòng với text và không cần khoảng cách riêng
    //     marginRight: 5,
    // },
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

export default Hoathinh;
>>>>>>> Stashed changes
