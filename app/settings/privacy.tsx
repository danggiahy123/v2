import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chính sách bảo mật</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>🔐 Thông tin cá nhân</Text>
        <Text style={styles.text}>
          Tech 5 Play cam kết bảo vệ thông tin cá nhân của người dùng. Chúng tôi chỉ thu thập các thông tin cần thiết để cải thiện trải nghiệm sử dụng.
        </Text>

        <Text style={styles.sectionTitle}>🔍 Mục đích sử dụng</Text>
        <Text style={styles.text}>
          Dữ liệu được sử dụng để đề xuất nội dung phù hợp, cá nhân hóa trải nghiệm và gửi thông báo nếu bạn cho phép.
        </Text>

        <Text style={styles.sectionTitle}>🛡️ Bảo mật</Text>
        <Text style={styles.text}>
          Mọi thông tin được mã hóa và lưu trữ an toàn, không chia sẻ cho bên thứ ba nếu không có sự đồng ý của bạn.
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
