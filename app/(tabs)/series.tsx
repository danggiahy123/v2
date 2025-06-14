import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
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
  
];

// Định nghĩa thể loại phim
const SERIES_CATEGORIES_DATA = [
    { id: 'cat1', name: 'Hành động', image: require('../../assets/anh/phim.png') },
    { id: 'cat2', name: 'Phiêu lưu', image: require('../../assets/anh/phim.png') },
    { id: 'cat3', name: 'Viễn tưởng', image: require('../../assets/anh/phim.png') },
    { id: 'cat4', name: 'Tình cảm', image: require('../../assets/anh/phim.png') },
    { id: 'cat5', name: 'Học đường', image: require('../../assets/anh/phim.png') },
    { id: 'cat6', name: 'Hình sự', image: require('../../assets/anh/phim.png') },
    { id: 'cat7', name: 'Khoa học viễn tưởng', image: require('../../assets/anh/phim.png') },
    // Thêm các thể loại khác nếu cần
];

const Phimbo: React.FC = () => {
    const router = useRouter();
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('Thể loại'); // Thay đổi text mặc định

    // Hàm xử lý khi chọn một thể loại từ modal
    const handleCategorySelect = (categoryName: string) => {
        setSelectedCategory(categoryName);
        setShowCategoryModal(false);
        console.log('Đã chọn thể loại:', categoryName);
        // Ở đây bạn có thể thêm logic để lọc phim theo thể loại đã chọn
    };

    // Component hiển thị mỗi item phim trong lưới
    const renderMovieGridItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.movieGridItem}
            onPress={() => router.push('../chitietphimdai')} // Navigate on press
        >
            <Image source={item.image} style={styles.movieGridImage} />
        </TouchableOpacity>
    );

    // Component hiển thị mỗi item phim theo chiều ngang
    const renderMovieRowItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.movieRowItem}
            onPress={() => router.push('../chitietphimdai')} // Navigate on press
        >
            <Image source={item.image} style={styles.movieRowImage} />
            <Text style={styles.movieRowTitle}>{item.title}</Text>
        </TouchableOpacity>
    );

    // Component chung cho mỗi section phim
    const MovieSection = ({ title, data, numColumns = 0, horizontal = false, isGrid = false }: any) => (
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

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.scrollViewContent}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                        <Icon name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>

                    {/* Thanh chọn thể loại - Di chuyển vào trong header */}
                    <TouchableOpacity
                        style={styles.categoryPickerHeader} // Style mới cho category picker trong header
                        onPress={() => setShowCategoryModal(true)}
                    >
                        <Text style={styles.categoryPickerHeaderText}>{selectedCategory}</Text>
                        <Icon name="chevron-down" size={20} color="#fff" />
                    </TouchableOpacity>

                    {/* Tiêu đề "Phim Bộ" - Giữ vị trí trung tâm */}
                    <Text style={styles.headerTitle}>Phim Bộ</Text>

                    <TouchableOpacity style={styles.headerButton} onPress={() => router.push('../timkiem')}>
                        <Icon name="magnify" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Section: Phim Bộ Mới Nhất */}
                <MovieSection title="Phim Bộ Mới Nhất" data={latestSeries} horizontal={true} />

                {/* --- */}

                {/* Section: Tất Cả Phim Bộ (dạng lưới) */}
                <MovieSection title="Tất Cả Phim Bộ" data={allSeries} numColumns={3} isGrid={true} />

                {/* --- */}

                {/* Các Section thể loại Phim Bộ */}
                {SERIES_CATEGORIES_DATA.map((category) => (
                    <React.Fragment key={category.id}>
                        <MovieSection title={category.name} data={latestSeries} horizontal={true} />
                        <View style={styles.divider} />
                    </React.Fragment>
                ))}

                {/* Đệm cuối trang để tránh nội dung bị che bởi bottom tab nếu có */}
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
                            data={SERIES_CATEGORIES_DATA}
                            keyExtractor={(item) => item.id}
                            numColumns={2}
                            columnWrapperStyle={styles.categoryModalRow}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.categoryModalItem}
                                    onPress={() => handleCategorySelect(item.name)}
                                >
                                    <Image source={item.image} style={styles.categoryModalImage} />
                                    <View style={styles.categoryModalTextOverlay}>
                                        <Text style={styles.categoryModalText}>{item.name}</Text>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center', // Đổi từ 'space-between' thành 'center'
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#000',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    headerButton: {
        padding: 5,
        marginRight: 10, // Thêm khoảng cách bên phải cho nút mũi tên
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        // Giữ absolute để nó vẫn ở giữa, nhưng chỉnh lại left/right và margin
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
        zIndex: -1,
        // Cần tính toán lại nếu muốn nó nằm chính xác giữa tổng không gian còn lại
        // Tuy nhiên, với 3 phần tử (back, category, search), absolute sẽ phức tạp hơn.
        // Để đơn giản, ta sẽ cho nó nằm ở giữa header, các nút sẽ đẩy nó ra.
        // Bỏ position absolute nếu muốn nó chảy theo flow của flexbox.
        // Tạm thời để absolute để giữ nguyên hành vi cũ nếu không cần quá phức tạp
    },
    // Styles mới cho thanh chọn thể loại trong header
    categoryPickerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333', // Màu nền tối hơn để nổi bật
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20, // Bo tròn nhiều hơn
        marginLeft: 0, // Bỏ margin cũ
        marginRight: 'auto', // Đẩy nó sang trái sau nút back
    },
    categoryPickerHeaderText: {
        color: '#fff',
        fontSize: 14, // Kích thước nhỏ hơn để vừa trong header
        fontWeight: 'bold',
        marginRight: 5,
    },
    // Styles cũ của categoryPicker không còn dùng, có thể xóa
    categoryPicker: {
        // ... (có thể xóa hoặc comment)
    },
    categoryPickerText: {
        // ... (có thể xóa hoặc comment)
    },
    // Existing styles (no change)
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
    bottomNavBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderTopWidth: 1,
        borderTopColor: '#333',
        height: 60,
        paddingBottom: 5,
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
    },
    navBarItem: {
        alignItems: 'center',
        padding: 5,
    },
    navBarText: {
        color: '#888',
        fontSize: 10,
        marginTop: 2,
    },
    navBarTextActive: {
        color: '#E50914',
        fontSize: 10,
        marginTop: 2,
    },
});

export default Phimbo;