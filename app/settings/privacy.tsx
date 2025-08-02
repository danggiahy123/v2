import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  const renderPrivacyCard = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    description: string,
    color: string
  ) => (
    <View style={styles.card}>
      <LinearGradient
        colors={[`${color}15`, `${color}05`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color }]}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with gradient */}
      <LinearGradient
        colors={['#000', 'transparent']}
        style={styles.headerGradient}
        pointerEvents="none"
      />
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={30} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chính sách bảo mật</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introSection}>
          <View style={styles.shieldIconContainer}>
            <MaterialIcons name="security" size={40} color="#FF6C00" />
          </View>
          <Text style={styles.introTitle}>Bảo vệ thông tin của bạn</Text>
          <Text style={styles.introText}>
            Chúng tôi cam kết bảo vệ quyền riêng tư và thông tin cá nhân của bạn
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          {renderPrivacyCard(
            "person-circle-outline",
            "Thông tin cá nhân",
            "Tech 5 Play cam kết bảo vệ thông tin cá nhân của người dùng. Chúng tôi chỉ thu thập các thông tin cần thiết để cải thiện trải nghiệm sử dụng.",
            "#FF6C00"
          )}

          {renderPrivacyCard(
            "search-outline",
            "Mục đích sử dụng",
            "Dữ liệu được sử dụng để đề xuất nội dung phù hợp, cá nhân hóa trải nghiệm và gửi thông báo nếu bạn cho phép.",
            "#3B82F6"
          )}

          {renderPrivacyCard(
            "shield-checkmark-outline",
            "Bảo mật",
            "Mọi thông tin được mã hóa và lưu trữ an toàn, không chia sẻ cho bên thứ ba nếu không có sự đồng ý của bạn.",
            "#EC4899"
          )}

          {renderPrivacyCard(
            "server-outline",
            "Lưu trữ dữ liệu",
            "Dữ liệu của bạn được lưu trữ trên các máy chủ bảo mật với công nghệ mã hóa tiên tiến.",
            "#7C3AED"
          )}
        </View>

        <View style={styles.footerSection}>
          <View style={styles.footerItem}>
            <Feather name="clock" size={20} color="#666" />
            <Text style={styles.footerText}>Cập nhật lần cuối: 01/03/2025</Text>
          </View>
          <View style={styles.footerItem}>
            <Feather name="file-text" size={20} color="#666" />
            <Text style={styles.footerText}>Phiên bản: 2.0</Text>
          </View>
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
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    zIndex: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
    paddingTop: 0,
  },
  introSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  shieldIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6C0015',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  introText: {
    fontSize: 16,
    color: '#rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 22,
  },
  cardsContainer: {
    marginBottom: 24,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  footerSection: {
    borderTopWidth: 1,
    borderTopColor: '#ffffff10',
    paddingTop: 16,
    gap: 8,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
});
