/**
 * 📖 MOVIE DESCRIPTION PREVIEW COMPONENT
 * 
 * Hiển thị nội dung phim rút gọn 3 dòng với nút "xem thêm"
 * Khi nhấn "xem thêm" sẽ mở trang description.tsx để xem nội dung đầy đủ
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';

interface MovieDescriptionPreviewProps {
  description: string;
  movieTitle: string;
  textStyle?: any;
  maxLines?: number;
}

export default function MovieDescriptionPreview({ 
  description, 
  movieTitle, 
  textStyle,
  maxLines = 3 
}: MovieDescriptionPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const [hasViewedFull, setHasViewedFull] = useState(false);
  const textRef = useRef<Text>(null);

  // Kiểm tra xem text có dài hơn 3 dòng không
  useEffect(() => {
    if (!description || description.trim() === '') {
      setShowReadMore(false);
      return;
    }

    // Ước tính độ dài text: khoảng 50 ký tự mỗi dòng
    const estimatedCharsPerLine = 50;
    const maxChars = estimatedCharsPerLine * maxLines;
    
    if (description.length > maxChars) {
      setShowReadMore(true);
    } else {
      setShowReadMore(false);
    }
  }, [description, maxLines]);

  // Kiểm tra xem user đã xem thêm chưa (từ navigation params)
  useEffect(() => {
    // Có thể kiểm tra từ navigation state hoặc local storage
    // Tạm thời sử dụng logic đơn giản
    const checkIfViewedFull = () => {
      // Logic kiểm tra - có thể dựa vào navigation state
      return false; // Mặc định false
    };
    
    if (checkIfViewedFull()) {
      setHasViewedFull(true);
      setIsExpanded(true);
    }
  }, []);

  const handleReadMore = () => {
    // Đánh dấu đã xem thêm
    setHasViewedFull(true);
    
    // Chuyển đến trang description với params
    router.push({
      pathname: '/movie/description',
      params: {
        title: movieTitle,
        description: description
      }
    });
  };

  if (!description || description.trim() === '') {
    return (
      <Text style={[styles.descriptionText, textStyle]}>
        Không có nội dung phim.
      </Text>
    );
  }

  // Nếu đã xem thêm hoặc text ngắn, hiển thị toàn bộ
  if (hasViewedFull || !showReadMore) {
    return (
      <Text style={[styles.descriptionText, textStyle]}>
        {description}
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      <Text 
        style={[styles.descriptionText, textStyle]}
        numberOfLines={maxLines}
      >
        {description}
      </Text>
      
      <TouchableOpacity 
        style={styles.readMoreButton}
        onPress={handleReadMore}
      >
        <Text style={styles.readMoreText}>
          (... xem thêm)
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  descriptionText: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
    flex: 1,
  },
  readMoreButton: {
    marginLeft: 4,
  },
  readMoreText: {
    fontSize: 16,
    color: '#ff6b6b',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
}); 