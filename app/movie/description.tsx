/**
 * 📖 MOVIE DESCRIPTION SCREEN
 * 
 * Trang hiển thị nội dung phim đầy đủ khi người dùng nhấn "xem thêm"
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';

export default function MovieDescriptionScreen() {
  const { title, description } = useLocalSearchParams<{ 
    title: string; 
    description: string;
  }>();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Custom Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title || 'Nội dung phim'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>Nội dung phim</Text>
          <Text style={styles.descriptionText}>
            {description || 'Không có nội dung phim.'}
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  
  // Custom Header
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#000',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerSpacer: {
    width: 40,
  },
  
  // Description Content
  descriptionContainer: {
    padding: 20,
  },
  descriptionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 26,
    textAlign: 'justify',
  },
}); 