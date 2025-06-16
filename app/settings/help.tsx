import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HelpScreen() {
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/explore');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trung tâm hỗ trợ</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Nội dung */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>❓ Câu hỏi thường gặp</Text>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <MaterialIcons name="person-add-alt-1" size={22} color="#FF6C00" />
            <Text style={styles.cardTitle}>Cách tạo tài khoản?</Text>
          </View>
          <Text style={styles.cardText}>
            Đăng ký dễ dàng với email hoặc số điện thoại tại màn hình đăng nhập.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Ionicons name="cloud-offline-outline" size={22} color="#FF6C00" />
            <Text style={styles.cardTitle}>Không xem được phim?</Text>
          </View>
          <Text style={styles.cardText}>
            Kiểm tra kết nối mạng, nếu vẫn lỗi, hãy khởi động lại ứng dụng hoặc liên hệ hỗ trợ.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Ionicons name="download-outline" size={22} color="#FF6C00" />
            <Text style={styles.cardTitle}>Tải phim offline?</Text>
          </View>
          <Text style={styles.cardText}>
            Tài khoản Premium có thể tải phim để xem không cần mạng trong phần &quot;Tải về&quot;.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>📞 Liên hệ hỗ trợ</Text>

        <View style={styles.contactBox}>
          <Text style={styles.contactText}>Email: <Text style={styles.contactHighlight}>support@tech5play.com</Text></Text>
          <Text style={styles.contactText}>Hotline: <Text style={styles.contactHighlight}>1900 1234</Text></Text>
          <Text style={styles.contactText}>Giờ làm việc: 8:00 - 22:00 (T2 - CN)</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#FF6C00',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#111',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6C00',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    marginLeft: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    paddingLeft: 30,
  },
  contactBox: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    borderColor: '#FF6C00',
    borderWidth: 1,
  },
  contactText: {
    color: '#ccc',
    fontSize: 15,
    marginBottom: 8,
  },
  contactHighlight: {
    color: '#FF6C00',
    fontWeight: '500',
  },
});
