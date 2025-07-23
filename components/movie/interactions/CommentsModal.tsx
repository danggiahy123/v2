import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { userInteractionService } from '../../../services/userInteractionService';

interface Comment {
  _id: string;
  user: {
    _id: string;
    full_name?: string;
    avatar?: string;
  };
  comment: string;
  isLike?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CommentsModalProps {
  visible: boolean;
  onClose: () => void;
  movieId: string;
  movieTitle: string;
  userId?: string;
  isLoggedIn: boolean;
  onLoginRequired?: () => void;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  visible,
  onClose,
  movieId,
  movieTitle,
  userId,
  isLoggedIn,
  onLoginRequired,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLikeComment, setIsLikeComment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      // Reset state and load fresh comments every time modal opens
      setComments([]);
      setPage(1);
      setHasMoreComments(true);
      setNewComment('');
      setIsLikeComment(false);
      
      console.log('📝 [CommentsModal] Modal opened, loading fresh comments...');
      loadComments(1);
      
      // Animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animation
      fadeAnim.setValue(0);
      slideAnim.setValue(300);
    }
  }, [visible]);

  const loadComments = async (pageNum: number) => {
    try {
      setIsLoading(pageNum === 1);
      
      console.log(`📝 [CommentsModal] Loading comments for movie ${movieId}, page ${pageNum}`);
      
      // Call real API to get comments from movie detail with timestamp to prevent cache
      const timestamp = Date.now();
      const response = await fetch(
        `https://backend-app-lou3.onrender.com/api/movies/${movieId}/detail-with-interactions?userId=${userId || ''}&t=${timestamp}&force=${Math.random()}`,
        {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success' && data.data.movie.recentComments) {
        const apiComments = data.data.movie.recentComments.map((comment: any) => ({
          _id: comment._id,
          user: {
            _id: comment.user._id || 'unknown',
            full_name:
              (comment.user.full_name && comment.user.full_name !== 'Unknown User' && comment.user.full_name)
              || (comment.user.email ? comment.user.email.split('@')[0] : 'Ẩn danh'),
          },
          comment: comment.comment,
          isLike: comment.isLike || false,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt || comment.createdAt,
        }));

        console.log(`✅ [CommentsModal] Loaded ${apiComments.length} comments from API`);

        if (pageNum === 1) {
          setComments(apiComments);
        } else {
          setComments(prev => [...prev, ...apiComments]);
        }
        
        // For now, assume no pagination in API
        setHasMoreComments(false);
      } else {
        console.log('⚠️ [CommentsModal] No comments found in API response');
        setComments([]);
        setHasMoreComments(false);
      }
      
    } catch (error) {
      console.error('❌ [CommentsModal] Error loading comments:', error);
      Alert.alert('Lỗi', 'Không thể tải bình luận. Vui lòng thử lại.');
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!isLoggedIn || !userId) {
      console.log('❌ [CommentsModal] User not logged in - this should not happen');
      onLoginRequired?.();
      return;
    }

    if (!newComment.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập nội dung bình luận');
      return;
    }

    try {
      setIsSubmitting(true);
      
      await userInteractionService.addComment(
        movieId,
        newComment.trim(),
        userId,
        isLikeComment
      );

      console.log('✅ [CommentsModal] Comment submitted successfully, refreshing comments...');
      
      // Clear form
      setNewComment('');
      setIsLikeComment(false);

      // Add longer delay to ensure database has been updated
      setTimeout(async () => {
        console.log('🔄 [CommentsModal] Refreshing comments after delay...');
        await loadComments(1);
      }, 500);
      
    } catch (error) {
      console.error('❌ [CommentsModal] Error submitting comment:', error);
      Alert.alert('Lỗi', 'Không thể gửi bình luận. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadMoreComments = () => {
    if (!isLoading && hasMoreComments) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadComments(nextPage);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.user.full_name ? item.user.full_name.charAt(0).toUpperCase() : 'A')}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>{item.user.full_name || 'Ẩn danh'}</Text>
            <Text style={styles.commentTime}>{formatTimeAgo(item.createdAt)}</Text>
          </View>
        </View>
        {item.isLike && (
          <Ionicons name="heart" size={16} color="#ff6b6b" />
        )}
      </View>
      <Text style={styles.commentText}>{item.comment}</Text>
    </View>
  );

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={handleClose}
    >
      <Animated.View 
        style={[
          styles.modalOverlay,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1}
          onPress={handleClose}
        />
        
        <Animated.View 
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Bình luận</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {movieTitle}
            </Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={handleClose}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item._id}
            style={styles.commentsList}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMoreComments}
            onEndReachedThreshold={0.1}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                {isLoading ? (
                  <ActivityIndicator size="large" color="#007AFF" />
                ) : (
                  <>
                    <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyText}>Chưa có bình luận nào</Text>
                    <Text style={styles.emptySubText}>Hãy là người đầu tiên bình luận!</Text>
                  </>
                )}
              </View>
            )}
            ListFooterComponent={() => (
              hasMoreComments && comments.length > 0 ? (
                <View style={styles.loadingFooter}>
                  <ActivityIndicator size="small" color="#007AFF" />
                </View>
              ) : null
            )}
          />

          {/* Comment Input */}
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            style={styles.inputContainer}
          >
            <View style={styles.inputRow}>
              <TouchableOpacity
                style={[
                  styles.likeToggle,
                  { backgroundColor: isLikeComment ? '#ff6b6b' : '#f0f0f0' }
                ]}
                onPress={() => setIsLikeComment(!isLikeComment)}
              >
                <Ionicons 
                  name="heart" 
                  size={16} 
                  color={isLikeComment ? '#fff' : '#666'} 
                />
              </TouchableOpacity>
              
              <TextInput
                style={styles.textInput}
                placeholder={isLoggedIn ? "Viết bình luận..." : "Đăng nhập để bình luận"}
                placeholderTextColor="#999"
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={500}
                editable={isLoggedIn}
              />
              
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { 
                    opacity: (!isLoggedIn || !newComment.trim() || isSubmitting) ? 0.5 : 1 
                  }
                ]}
                onPress={handleSubmitComment}
                disabled={!isLoggedIn || !newComment.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <Ionicons name="send" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            </View>
            
            {newComment.length > 0 && (
              <Text style={styles.characterCount}>
                {newComment.length}/500
              </Text>
            )}
          </KeyboardAvoidingView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '60%',
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    padding: 4,
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  commentItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginLeft: 42,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
    paddingBottom: Platform.OS === 'ios' ? 0 : 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  likeToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
    backgroundColor: '#f8f8f8',
  },
  submitButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
});

export default CommentsModal; 