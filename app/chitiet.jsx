import { Feather, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

// Data for episodes - keeping it local for simplicity
const episodes = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  title: `Tập ${i + 1}`,
  duration: '21 phút',
  image: require('../assets/anh/phim.png'), // Ensure this image path is correct
}));

// Data for share options
const shareOptions = [
  { id: 'insta', img: require('../assets/anh/inta.jpg'), label: 'Instagram' },
  { id: 'fb', img: require('../assets/anh/fb.png'), label: 'Facebook' },
  { id: 'copy', img: require('../assets/anh/sao chep.jpg'), label: 'Sao chép' },
  { id: 'more', img: require('../assets/anh/them.png'), label: 'Thêm' },
];

export default function ChiTiet() {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [modalType, setModalType] = useState(null); // 'share' or 'download'
  const [showInfo, setShowInfo] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);

  const handleSendComment = () => {
    if (comment.trim() !== '') {
      setComments(prev => [comment, ...prev]);
      setComment('');
    }
  };

  const closeModal = () => setModalType(null);

  // Bottom navigation bar component - extracted for better reusability if needed elsewhere
  const BottomNavBar = () => (
    <View style={styles.bottomNavBar}>
      <Link href="../index" asChild>
        <TouchableOpacity style={styles.navBarItem} accessibilityLabel="Đi tới trang chủ">
          <MaterialCommunityIcons name="home" size={24} color="#E50914" />
          <Text style={styles.navBarTextActive}>Trang chủ</Text>
        </TouchableOpacity>
      </Link>

      <Link href="../Phimbo" asChild>
        <TouchableOpacity style={styles.navBarItem} accessibilityLabel="Đi tới trang phim bộ">
          <MaterialCommunityIcons name="movie-play-outline" size={24} color="#888" />
          <Text style={styles.navBarText}>Phim bộ</Text>
        </TouchableOpacity>
      </Link>

      <Link href="../hoathinh" asChild>
        <TouchableOpacity style={styles.navBarItem} accessibilityLabel="Đi tới trang hoạt hình">
          <MaterialCommunityIcons name="television-play" size={24} color="#888" />
          <Text style={styles.navBarText}>Hoạt hình</Text>
        </TouchableOpacity>
      </Link>

      {/* This item doesn't have a specific link, so it's a regular TouchableOpacity */}
      <TouchableOpacity style={styles.navBarItem} accessibilityLabel="Mở rộng tùy chọn">
        <MaterialCommunityIcons name="dots-horizontal" size={24} color="#888" />
        <Text style={styles.navBarText}>Mở rộng</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#000' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container}>
        {/* Video Player/Banner Section */}
        <View>
          <Image source={require('../assets/anh/phim.png')} style={styles.banner} />
          <Text style={styles.skipAd}>Video tiếp tục sau 4 giây</Text>
        </View>

        {/* Movie Info Section */}
        <View style={styles.infoContainer}>
          <Text style={styles.title}>Chốt Đơn Chị Đẹp - Tập 1</Text>
          <Text style={styles.subInfo}>
            <Text style={styles.tag}>Mới</Text> | 2025 | T13 | 100/100 tập | Việt Nam
          </Text>
          <Text style={styles.description}>Nội dung tâm lý, xã hội</Text>

          <TouchableOpacity
            onPress={() => setShowInfo(!showInfo)}
            style={styles.toggleRow}
            accessibilityLabel={showInfo ? 'Ẩn thông tin phim và diễn viên' : 'Hiển thị thông tin phim và diễn viên'}
          >
            <Text style={styles.toggleText}>Thông tin phim & Diễn viên</Text>
            <Feather name={showInfo ? 'chevron-up' : 'chevron-down'} size={20} color="#fff" />
          </TouchableOpacity>

          {showInfo && (
            <View style={styles.detailInfo}>
              <Text style={styles.infoLabel}>Diễn viên:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[1, 2, 3].map((i) => (
                  <Image
                    key={i}
                    source={require('../assets/anh/1.png')} // Ensure this image path is correct
                    style={styles.avatar}
                    accessibilityLabel="Ảnh diễn viên"
                  />
                ))}
              </ScrollView>

              <Text style={styles.infoLabel}>Đạo diễn:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[1, 2].map((i) => (
                  <Image
                    key={i}
                    source={require('../assets/anh/1.png')} // Ensure this image path is correct
                    style={styles.avatar}
                    accessibilityLabel="Ảnh đạo diễn"
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Actions Section */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => setIsFollowed(!isFollowed)}
            accessibilityLabel={isFollowed ? 'Bỏ theo dõi phim này' : 'Theo dõi phim này'}
          >
            <FontAwesome
              name={isFollowed ? 'heart' : 'heart-o'}
              size={20}
              color={isFollowed ? '#ff4d4d' : '#fff'}
            />
            <Text style={styles.actionText}>{isFollowed ? 'Bỏ theo dõi' : 'Theo dõi'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => setModalType('share')}
            accessibilityLabel="Chia sẻ phim"
          >
            <Feather name="share-2" size={20} color="#fff" />
            <Text style={styles.actionText}>Chia sẻ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => setModalType('download')}
            accessibilityLabel="Tải xuống phim"
          >
            <Feather name="download" size={20} color="#fff" />
            <Text style={styles.actionText}>Tải xuống</Text>
          </TouchableOpacity>
        </View>

        {/* Comment Section */}
        <View style={styles.commentBox}>
          <Text style={styles.commentTitle}>Bình luận ({comments.length})</Text>
          <View style={styles.commentInput}>
            <FontAwesome name="user-circle-o" size={24} color="#999" />
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Viết bình luận..."
              placeholderTextColor="#777"
              style={styles.input}
              onSubmitEditing={handleSendComment}
              returnKeyType="send"
              accessibilityLabel="Trường nhập bình luận"
            />
            <TouchableOpacity onPress={handleSendComment} accessibilityLabel="Gửi bình luận">
              <Feather name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {comments.map((cmt, index) => (
            <Text key={index} style={styles.commentItem}>• {cmt}</Text>
          ))}
        </View>

        {/* Tabs and Sort Section */}
        <View style={styles.tabs}>
          <Text style={[styles.tab, styles.activeTab]}>Danh sách</Text>
          <Text style={styles.tab}>Liên quan</Text>
        </View>

        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Sắp xếp theo:</Text>
          {/* This could be a dropdown/modal for sorting options */}
          <TouchableOpacity accessibilityLabel="Sắp xếp danh sách tập phim theo cũ nhất">
            <Text style={styles.sortValue}>Cũ nhất ▼</Text>
          </TouchableOpacity>
        </View>

        {/* Episodes List */}
        <FlatList
          data={episodes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.episodeItem} accessibilityLabel={`Tập ${item.id}, ${item.title}`}>
              <Image source={item.image} style={styles.episodeThumb} accessibilityLabel="Ảnh thumbnail tập phim" />
              <View style={styles.episodeInfo}>
                <Text style={styles.episodeTitle}>{item.title}</Text>
                <Text style={styles.episodeDuration}>{item.duration}</Text>
              </View>
              <Feather name="download" size={20} color="#fff" style={{ marginLeft: 'auto' }} accessibilityLabel="Tải xuống tập phim" />
            </TouchableOpacity>
          )}
          scrollEnabled={false} // Since it's inside a ScrollView
        />
      </ScrollView>

      {/* Share Modal */}
      <Modal visible={!!modalType} animationType="slide" transparent onRequestClose={closeModal}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeModal} accessibilityLabel="Đóng cửa sổ chia sẻ">
          <View style={styles.shareModal}>
            <View style={styles.shareRow}>
              {shareOptions.map((option) => (
                <TouchableOpacity key={option.id} style={styles.shareItem} accessibilityLabel={`Chia sẻ qua ${option.label}`}>
                  <Image source={option.img} style={styles.shareIcon} />
                  <Text style={styles.shareLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={closeModal} style={styles.modalCloseBtn} accessibilityLabel="Hủy chia sẻ">
              <Text style={{ color: '#fff' }}>Huỷ</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bottom Navigation Bar */}
      <BottomNavBar />
    </KeyboardAvoidingView>
  );
}

// ---
// Styles
// ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  banner: { width, height: width * 9 / 16, backgroundColor: '#222' },
  skipAd: {
    position: 'absolute', bottom: 10, right: 10, backgroundColor: '#333', color: '#fff',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, fontSize: 12,
  },
  infoContainer: { padding: 16 },
  title: { fontSize: 18, color: '#fff', fontWeight: 'bold', marginBottom: 4 },
  subInfo: { color: '#aaa', fontSize: 13 },
  tag: { color: '#ff6600', fontWeight: 'bold' },
  description: { marginTop: 4, color: '#ccc', fontSize: 14 },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 12, paddingVertical: 8,
  },
  toggleText: { color: '#fff', fontSize: 15 },
  detailInfo: { marginTop: 10 },
  infoLabel: { color: '#fff', fontWeight: 'bold', marginVertical: 6 },
  avatar: {
    width: 60, height: 60, borderRadius: 30, marginRight: 10, backgroundColor: '#333',
  },
  actions: {
    flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#222',
  },
  actionItem: { alignItems: 'center' },
  actionText: { color: '#fff', fontSize: 12, marginTop: 4 },
  commentBox: {
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, backgroundColor: '#000',
  },
  commentTitle: { color: '#fff', marginBottom: 12, fontWeight: 'bold', fontSize: 16 },
  commentInput: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a',
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, marginBottom: 12,
  },
  input: { color: '#fff', marginLeft: 10, flex: 1, fontSize: 14, paddingVertical: 4 },
  commentItem: { color: '#ccc', marginBottom: 6, marginLeft: 4, fontSize: 14 },
  tabs: {
    flexDirection: 'row', borderBottomWidth: 1, borderColor: '#222',
    paddingHorizontal: 16, marginTop: 16,
  },
  tab: { marginRight: 16, paddingVertical: 10, color: '#aaa', fontWeight: '500' },
  activeTab: { color: '#fff', borderBottomWidth: 2, borderColor: '#f50' },
  sortRow: { flexDirection: 'row', padding: 16, justifyContent: 'space-between' },
  sortLabel: { color: '#aaa' },
  sortValue: { color: '#fff' },
  episodeItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  episodeThumb: { width: 120, height: 70, borderRadius: 6, backgroundColor: '#333' },
  episodeInfo: { marginLeft: 12 },
  episodeTitle: { color: '#fff', fontSize: 16 },
  episodeDuration: { color: '#aaa', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: '#000a', justifyContent: 'flex-end' },
  shareModal: {
    backgroundColor: '#222', padding: 20,
    borderTopLeftRadius: 12, borderTopRightRadius: 12,
  },
  shareRow: {
    flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20,
  },
  shareItem: { alignItems: 'center' },
  shareIcon: { width: 50, height: 50, borderRadius: 10, marginBottom: 6 },
  shareLabel: { color: '#fff', fontSize: 12 },
  modalCloseBtn: {
    alignSelf: 'center', backgroundColor: '#444',
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginTop: 10,
  },
  bottomNavBar: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: '#111', borderTopWidth: 1, borderTopColor: '#333',
    paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  navBarItem: { alignItems: 'center', flex: 1 },
  navBarText: { color: '#888', fontSize: 10, marginTop: 4 },
  navBarTextActive: { color: '#E50914', fontSize: 10, marginTop: 4 },
});