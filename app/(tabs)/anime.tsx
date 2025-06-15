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