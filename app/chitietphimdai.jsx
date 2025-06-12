import { Feather, FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';
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


// Dữ liệu phim liên quan
const relatedMovies = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  title: `Phim liên quan ${i + 1}`,
  duration: '120 phút',
  image: require('../assets/anh/2.jpg'),
}));

export default function ChiTietPhimDai() {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [modalType, setModalType] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  const handleSendComment = () => {
    if (comment.trim() !== '') {
      setComments(prev => [comment, ...prev]);
      setComment('');
    }
  };

  const closeModal = () => setModalType(null);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#000' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container}>
        <View>
          <Image source={require('../assets/anh/phim.png')} style={styles.banner} />
          <Text style={styles.skipAd}>Video tiếp tục sau 4 giây</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.title}>Chốt Đơn Chị Đẹp</Text>
          <Text style={styles.subInfo}>
            <Text style={styles.tag}>Mới</Text> | 2025 | T13 | Phim lẻ | Việt Nam
          </Text>
          <Text style={styles.description}>Nội dung tâm lý, xã hội</Text>

          <TouchableOpacity onPress={() => setShowInfo(!showInfo)} style={styles.toggleRow}>
            <Text style={styles.toggleText}>Thông tin phim & Diễn viên</Text>
            <Feather name={showInfo ? 'chevron-up' : 'chevron-down'} size={20} color="#fff" />
          </TouchableOpacity>

          {showInfo && (
            <View style={styles.detailInfo}>
              <Text style={styles.infoLabel}>Diễn viên:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[1, 2, 3].map((i) => (
                  <Image key={i} source={require('../assets/anh/1.png')} style={styles.avatar} />
                ))}
              </ScrollView>

              <Text style={styles.infoLabel}>Đạo diễn:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[1, 2].map((i) => (
                  <Image key={i} source={require('../assets/anh/1.png')} style={styles.avatar} />
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionItem}>
            <FontAwesome name="heart" size={20} color="#fff" />
            <Text style={styles.actionText}>Bỏ theo dõi</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={() => setModalType('share')}>
            <Feather name="share-2" size={20} color="#fff" />
            <Text style={styles.actionText}>Chia sẻ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={() => setModalType('download')}>
            <Feather name="download" size={20} color="#fff" />
            <Text style={styles.actionText}>Tải xuống</Text>
          </TouchableOpacity>
        </View>

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
            />
            <TouchableOpacity onPress={handleSendComment}>
              <Feather name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {comments.map((cmt, index) => (
            <Text key={index} style={styles.commentItem}>• {cmt}</Text>
          ))}
        </View>

        <View style={styles.tabs}>
          <Text style={[styles.tab, styles.activeTab]}>Phim liên quan</Text>
        </View>

        <View style={styles.relatedContainer}>
          <FlatList
            data={relatedMovies}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            renderItem={({ item }) => (
              <View style={styles.relatedImageWrapper}>
                <Image source={item.image} style={styles.relatedImage} />
              </View>
            )}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>

    {modalType === 'share' && (
  <Modal visible animationType="slide" transparent onRequestClose={closeModal}>
    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeModal}>
      <View style={styles.shareModal}>
        <View style={styles.shareRow}>
          <TouchableOpacity style={styles.shareItem}>
            <Image source={require('../assets/anh/inta.jpg')} style={styles.shareIcon} />
            <Text style={styles.shareLabel}>Instagram</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareItem}>
            <Image source={require('../assets/anh/fb.png')} style={styles.shareIcon} />
            <Text style={styles.shareLabel}>Facebook</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareItem}>
            <Image source={require('../assets/anh/sao chep.jpg')} style={styles.shareIcon} />
            <Text style={styles.shareLabel}>Sao chép</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareItem}>
            <Image source={require('../assets/anh/them.png')} style={styles.shareIcon} />
            <Text style={styles.shareLabel}>Thêm</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={closeModal} style={styles.modalCloseBtn}>
          <Text style={{ color: '#fff' }}>Huỷ</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  </Modal>
)}

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  banner: { width, height: width * 9 / 16, backgroundColor: '#222' },
  skipAd: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#333',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
  },
  infoContainer: { padding: 16 },
  title: { fontSize: 18, color: '#fff', fontWeight: 'bold', marginBottom: 4 },
  subInfo: { color: '#aaa', fontSize: 13 },
  tag: { color: '#ff6600', fontWeight: 'bold' },
  description: { marginTop: 4, color: '#ccc', fontSize: 14 },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  toggleText: { color: '#fff', fontSize: 15 },
  detailInfo: { marginTop: 10 },
  infoLabel: { color: '#fff', fontWeight: 'bold', marginVertical: 6 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 10,
    backgroundColor: '#333',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#222',
  },
  actionItem: { alignItems: 'center' },
  actionText: { color: '#fff', fontSize: 12, marginTop: 4 },
  commentBox: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#000',
  },
  commentTitle: { color: '#fff', marginBottom: 12, fontWeight: 'bold', fontSize: 16 },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  input: { color: '#fff', marginLeft: 10, flex: 1, fontSize: 14, paddingVertical: 4 },
  commentItem: { color: '#ccc', marginBottom: 6, marginLeft: 4, fontSize: 14 },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#222',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  tab: { marginRight: 16, paddingVertical: 10, color: '#aaa', fontWeight: '500' },
  activeTab: { color: '#fff', borderBottomWidth: 2, borderColor: '#f50' },
  modalOverlay: { flex: 1, backgroundColor: '#000a', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#222',
    padding: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalText: { color: '#ccc', fontSize: 14, marginBottom: 20 },
  modalCloseBtn: {
    alignSelf: 'flex-end',
    backgroundColor: '#444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  relatedContainer: { paddingHorizontal: 16, marginTop: 16, marginBottom: 32 },
  relatedImageWrapper: {
    flex: 1,
    marginBottom: 16,
    marginHorizontal: 4,
  },
  relatedImage: {
    width: (width - 48) / 2,
    height: ((width - 48) / 2) * 1.5,
    borderRadius: 8,
    backgroundColor: '#333',
    resizeMode: 'cover',
  },

  // 🆕 Share modal styles
  shareModal: {
    backgroundColor: '#222',
    paddingTop: 20,
    paddingBottom: 30,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 24,
  },
  shareRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  shareItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
  },
  shareIcon: {
    width: 40,
    height: 40,
    marginBottom: 6,
    resizeMode: 'contain',
  },
  shareLabel: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
  },
});
