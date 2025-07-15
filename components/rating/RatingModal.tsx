import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StarRating from './StarRating';

const { width, height } = Dimensions.get('window');

interface Movie {
  _id: string;
  title: string;
  poster?: string;
  release_year?: number;
  genre?: string[];
}

interface UserRating {
  _id: string;
  star_rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  movie: Movie;
  currentUserRating?: UserRating | null;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  loading?: boolean;
}

const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  onClose,
  movie,
  currentUserRating,
  onSubmit,
  loading = false,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentUserRating) {
      setRating(currentUserRating.star_rating);
      setComment(currentUserRating.comment || '');
    } else {
      setRating(0);
      setComment('');
    }
  }, [currentUserRating, visible]);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn số sao đánh giá');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(rating, comment.trim());
      onClose();
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  const getRatingText = (rating: number) => {
    if (rating === 0) return 'Chọn số sao để đánh giá';
    if (rating <= 1) return 'Rất tệ';
    if (rating <= 2) return 'Tệ';
    if (rating <= 3) return 'Trung bình';
    if (rating <= 4) return 'Tốt';
    return 'Xuất sắc';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Đánh giá phim</Text>
              <TouchableOpacity 
                onPress={handleClose}
                style={styles.closeButton}
                disabled={submitting}
              >
                <Ionicons name="close" size={24} color="#D11030" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Movie Info */}
              <View style={styles.movieInfo}>
                <Image
                  source={{ 
                    uri: movie.poster || 'https://via.placeholder.com/100x150/333/fff?text=No+Image' 
                  }}
                  style={styles.moviePoster}
                  resizeMode="cover"
                />
                <View style={styles.movieDetails}>
                  <Text style={styles.movieTitle} numberOfLines={2}>
                    {movie.title}
                  </Text>
                  {movie.release_year && (
                    <Text style={styles.movieYear}>{movie.release_year}</Text>
                  )}
                  {movie.genre && movie.genre.length > 0 && (
                    <Text style={styles.movieGenre} numberOfLines={1}>
                      {movie.genre.join(', ')}
                    </Text>
                  )}
                </View>
              </View>

              {/* Rating Section */}
              <View style={styles.ratingSection}>
                <Text style={styles.sectionTitle}>Đánh giá của bạn</Text>
                
                <View style={styles.starRatingContainer}>
                  <StarRating
                    rating={rating}
                    size={40}
                    onRatingChange={setRating}
                    showText={false}
                    showRating={false}
                    starStyle={styles.starContainer}
                  />
                  <Text style={styles.ratingText}>
                    {getRatingText(rating)}
                  </Text>
                </View>
              </View>

              {/* Comment Section */}
              <View style={styles.commentSection}>
                <Text style={styles.sectionTitle}>Nhận xét (tùy chọn)</Text>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Chia sẻ cảm nhận của bạn về bộ phim..."
                  placeholderTextColor="#aaa"
                  multiline
                  numberOfLines={4}
                  value={comment}
                  onChangeText={setComment}
                  maxLength={500}
                  textAlignVertical="top"
                />
                <Text style={styles.commentCounter}>
                  {comment.length}/500
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleClose}
                  disabled={submitting}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.submitButton,
                    (rating === 0 || submitting) && styles.disabledButton
                  ]}
                  onPress={handleSubmit}
                  disabled={rating === 0 || submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {currentUserRating ? 'Cập nhật' : 'Gửi đánh giá'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Update Info */}
              {currentUserRating && (
                <View style={styles.updateInfo}>
                  <Text style={styles.updateText}>
                    Đánh giá lần cuối: {new Date(currentUserRating.updatedAt).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.85,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: '#D11030',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  movieInfo: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 0,
  },
  moviePoster: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#222',
  },
  movieDetails: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  movieYear: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 2,
  },
  movieGenre: {
    fontSize: 12,
    color: '#aaa',
  },
  ratingSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 16,
  },
  starRatingContainer: {
    alignItems: 'center',
  },
  starContainer: {
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#D11030',
  },
  commentSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    backgroundColor: '#111',
    color: '#fff',
  },
  commentCounter: {
    textAlign: 'right',
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#D11030',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#D11030',
  },
  submitButton: {
    backgroundColor: '#D11030',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  disabledButton: {
    backgroundColor: '#333',
  },
  updateInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  updateText: {
    fontSize: 12,
    color: '#aaa',
  },
});

export default RatingModal; 