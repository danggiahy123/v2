import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giới thiệu</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>🎬 Về Tech 5 Play</Text>
        <Text style={styles.text}>
          Tech 5 Play là nền tảng xem phim và giải trí hàng đầu, cung cấp hàng ngàn nội dung chất lượng cao từ phim bộ, điện ảnh, anime đến thể thao trực tiếp.
        </Text>

        <Text style={styles.sectionTitle}>🚀 Sứ mệnh</Text>
        <Text style={styles.text}>
          Mang đến trải nghiệm giải trí số mượt mà, cá nhân hóa và đáng tin cậy cho mọi gia đình Việt.
        </Text>

        <Text style={styles.sectionTitle}>📱 Ứng dụng đa nền tảng</Text>
        <Text style={styles.text}>
          Dễ dàng truy cập Tech 5 Play từ TV, điện thoại, máy tính bảng với cùng một tài khoản.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  content: { paddingBottom: 32 },
  sectionTitle: { color: '#FF6C00', fontSize: 18, fontWeight: 'bold', marginVertical: 12 },
  text: { color: '#ccc', fontSize: 15, lineHeight: 22 },
});
