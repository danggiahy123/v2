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

// --- Dữ liệu giả định cho các thể loại phim hoạt hình ---
const animationCategories = [
    {
        id: 'ac1',
        title: 'Hoạt Hình Cổ Điển',
        movies: Array.from({ length: 15 }, (_, i) => ({
            id: `cc${i + 1}`,
            image: require('../assets/anh/phim.png'),
        })),
    },
    {
        id: 'ac2',
        title: 'Phim Hoạt Hình 3D',
        movies: Array.from({ length: 15 }, (_, i) => ({
            id: `3d${i + 1}`,
            image: require('../assets/anh/phim.png'),
        })),
    },
    {
        id: 'ac3',
        title: 'Hoạt Hình Giáo Dục',
        movies: Array.from({ length: 15 }, (_, i) => ({
            id: `edu${i + 1}`,
            image: require('../assets/anh/phim.png'),
        })),
    },
    {
        id: 'ac4',
        title: 'Siêu Anh Hùng Hoạt Hình',
        movies: Array.from({ length: 15 }, (_, i) => ({
            id: `sh${i + 1}`,
            image: require('../assets/anh/phim.png'),
        })),
    },
    {
        id: 'ac5',
        title: 'Phim Hoạt Hình Phiêu Lưu',
        movies: Array.from({ length: 15 }, (_, i) => ({
            id: `adv${i + 1}`,
            image: require('../assets/anh/phim.png'),
        })),
    },
    {
        id: 'ac6',
        title: 'Phim Hoạt Hình Âm nhạc',
        movies: Array.from({ length: 15 }, (_, i) => ({
            id: `mus${i + 1}`,
            image: require('../assets/anh/phim.png'),
        })),
    },
    {
        id: 'ac7',
        title: 'Hoạt Hình Ngắn',
        movies: Array.from({ length: 15 }, (_, i) => ({
            id: `short${i + 1}`,
            image: require('../assets/anh/phim.png'),
        })),
    },
];

// Định nghĩa dữ liệu thể loại hoạt hình cho Modal (giống như SERIES_CATEGORIES_DATA ở Phimbo.tsx)
const ANIMATION_CATEGORIES_DATA = [
    { id: 'acat1', name: 'Hành động', image: require('../assets/anh/phim.png') },
    { id: 'acat2', name: 'Phiêu lưu', image: require('../assets/anh/phim.png') },
    { id: 'acat3', name: 'Giáo dục', image: require('../assets/anh/phim.png') },
    { id: 'acat4', name: 'Hài hước', image: require('../assets/anh/phim.png') },
    { id: 'acat5', name: 'Kỳ ảo', image: require('../assets/anh/phim.png') },
    { id: 'acat6', name: 'Khoa học', image: require('../assets/anh/phim.png') },
    { id: 'acat7', name: 'Âm nhạc', image: require('../assets/anh/phim.png') },
    // Thêm các thể loại khác nếu cần
];

// --- Component MoviePoster để hiển thị từng poster phim ---
const MoviePoster = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.moviePosterContainer}>
        <Image source={item.image} style={styles.moviePosterImage} />
    </TouchableOpacity>
);

// --- Component CategoryRow để hiển thị một hàng thể loại phim ---
const CategoryRow = ({ title, movies }: { title: string; movies: any[] }) => (
    <View style={styles.categoryRow}>
        <Text style={styles.categoryTitle}>{title}</Text>
        <FlatList
            data={movies}
            renderItem={({ item }) => <MoviePoster item={item} />}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContent}
        />
    </View>
);

const Hoathinh: React.FC = () => {
    const router = useRouter();
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('Thể loại'); // State để lưu thể loại đã chọn

    // Hàm xử lý khi chọn một thể loại từ modal
    const handleCategorySelect = (categoryName: string) => {
        setSelectedCategory(categoryName);
        setShowCategoryModal(false);
        console.log('Đã chọn thể loại:', categoryName);
        // Ở đây bạn có thể thêm logic để lọc phim theo thể loại đã chọn
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.scrollViewContent}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
                        <Icon name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>

                    {/* Thanh chọn thể loại - Đã hoán đổi vị trí của Icon và Text */}
                    <TouchableOpacity
                        style={styles.categoryPickerHeader}
                        onPress={() => setShowCategoryModal(true)}
                    >
                        <Icon name="chevron-down" size={20} color="#fff" style={styles.chevronIcon} /> {/* Thêm style mới cho icon */}
                        <Text style={styles.categoryPickerHeaderText}>{selectedCategory}</Text>
                    </TouchableOpacity>

                    {/* Tiêu đề "Hoạt hình cho trẻ em" - Giữ vị trí trung tâm */}
                    <Text style={styles.headerTitle}>Hoạt hình </Text>

                    <TouchableOpacity style={styles.headerButton} onPress={() => router.push('../timkiem')}>
                        <Icon name="magnify" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Danh sách các thể loại phim hoạt hình */}
                <FlatList
                    data={animationCategories}
                    renderItem={({ item }) => <CategoryRow title={item.title} movies={item.movies} />}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.mainListContainer}
                    scrollEnabled={false} // Disable FlatList scrolling as it's nested in a ScrollView
                />

                {/* Add padding at the bottom to prevent content from being hidden by the bottom nav bar */}
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
                            data={ANIMATION_CATEGORIES_DATA} // Sử dụng dữ liệu thể loại hoạt hình
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

            {/* Bottom Navigation Bar */}
            <View style={styles.bottomNavBar}>
                <Link href="../index" asChild>
                    <TouchableOpacity style={styles.navBarItem}>
                        <Icon name="home" size={24} color="#888" />
                        <Text style={styles.navBarText}>Trang chủ</Text>
                    </TouchableOpacity>
                </Link>
                <Link href="../Phimbo" asChild>
                    <TouchableOpacity style={styles.navBarItem}>
                        <Icon name="movie-play-outline" size={24} color="#888" />
                        <Text style={styles.navBarText}>Phim bộ</Text>
                    </TouchableOpacity>
                </Link>
                <Link href="../hoathinh" asChild>
                    <TouchableOpacity style={styles.navBarItem}>
                        <Icon name="television-play" size={24} color="#E50914" />
                        <Text style={styles.navBarTextActive}>Hoạt hình</Text>
                    </TouchableOpacity>
                </Link>
                <TouchableOpacity style={styles.navBarItem}>
                    <Icon name="dots-horizontal" size={24} color="#888" />
                    <Text style={styles.navBarText}>Mở rộng</Text>
                </TouchableOpacity>
            </View>
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
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#000',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    headerButton: {
        padding: 5,
        marginRight: 10,
    },
    // Styles for the category picker within the header
    categoryPickerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        marginLeft: 0,
        marginRight: 'auto',
    },
    categoryPickerHeaderText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        // marginRight: 5, // Bỏ hoặc điều chỉnh nếu cần khoảng cách giữa icon và text
    },
    chevronIcon: { // Style mới cho icon mũi tên
        marginRight: 5, // Khoảng cách giữa icon và text
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
        zIndex: -1,
    },
    mainListContainer: {
        paddingVertical: 8,
    },
    categoryRow: {
        marginBottom: 18,
    },
    categoryTitle: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
        marginBottom: 10,
        paddingLeft: 15,
    },
    horizontalListContent: {
        paddingLeft: 15,
        paddingRight: 10,
    },
    moviePosterContainer: {
        width: width * 0.25,
        height: width * 0.25 * 1.5,
        borderRadius: 6,
        overflow: 'hidden',
        marginRight: 8,
        backgroundColor: '#222',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 3,
        elevation: 5,
    },
    moviePosterImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    // Modal Styles (copied from Phimbo)
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
    // Bottom Navigation Bar Styles
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

export default Hoathinh;