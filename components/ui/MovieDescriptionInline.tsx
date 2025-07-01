/**
 * 📖 MOVIE DESCRIPTION INLINE COMPONENT
 * 
 * Hiển thị nội dung phim rút gọn 3 dòng với nút "xem thêm"
 * Khi nhấn "xem thêm" sẽ mở rộng nội dung ngay trong trang
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface MovieDescriptionInlineProps {
  description: string;
  textStyle?: any;
  maxLines?: number;
}

export default function MovieDescriptionInline({ 
  description, 
  textStyle,
  maxLines = 3 
}: MovieDescriptionInlineProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);

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

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  if (!description || description.trim() === '') {
    return (
      <Text style={[styles.descriptionText, textStyle]}>
        Không có nội dung phim.
      </Text>
    );
  }

  // Nếu text ngắn, hiển thị toàn bộ
  if (!showReadMore) {
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
        numberOfLines={isExpanded ? undefined : maxLines}
      >
        {description}
      </Text>
      
      <TouchableOpacity 
        style={styles.readMoreButton}
        onPress={handleToggleExpand}
      >
        <Text style={styles.readMoreText}>
          {isExpanded ? '(thu gọn)' : '(... xem thêm)'}
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