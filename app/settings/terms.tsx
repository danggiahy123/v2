import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Điều khoản sử dụng</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>📘 Quy định chung</Text>
        <Text style={styles.text}>
          Khi sử dụng Tech 5 Play, bạn đồng ý tuân theo các điều khoản và chính sách mà chúng tôi đề ra.
        </Text>

        <Text style={styles.sectionTitle}>⚠️ Hành vi bị cấm</Text>
        <Text style={styles.text}>
          Nghiêm cấm phát tán nội dung vi phạm bản quyền, spam, hack hoặc can thiệp vào hệ thống.
        </Text>

        <Text style={styles.sectionTitle}>📅 Cập nhật điều khoản</Text>
        <Text style={styles.text}>
          Chúng tôi có thể cập nhật điều khoản để phù hợp với pháp luật và chính sách mới, bạn sẽ được thông báo trước khi có thay đổi lớn.
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
