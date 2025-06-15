import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ContactScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin liên hệ</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>📩 Liên hệ với chúng tôi</Text>
        <View style={styles.infoBox}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>contact@tech5play.com</Text>

          <Text style={styles.label}>Hotline:</Text>
          <Text style={styles.value}>1900 1234</Text>

          <Text style={styles.label}>Địa chỉ:</Text>
          <Text style={styles.value}>123 Nguyễn Văn Cừ, Q.5, TP.HCM</Text>

          <Text style={styles.label}>Giờ làm việc:</Text>
          <Text style={styles.value}>08:00 - 22:00 (T2 - CN)</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  content: { paddingBottom: 32 },
  sectionTitle: { color: '#FF6C00', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  infoBox: { backgroundColor: '#111', borderRadius: 12, padding: 16, borderLeftColor: '#FF6C00', borderLeftWidth: 4 },
  label: { color: '#aaa', fontSize: 14, marginTop: 12 },
  value: { color: '#fff', fontSize: 16, fontWeight: '500' },
});
