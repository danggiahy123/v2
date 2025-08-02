import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function TermsScreen() {
  const router = useRouter();

  const renderTermsCard = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    description: string,
    color: string,
    customIcon?: {
      type: 'material' | 'materialCommunity' | 'feather';
      name: string;
    }
  ) => (
    <View style={styles.card}>
      <LinearGradient
        colors={[`${color}15`, `${color}05`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          {customIcon ? (
            customIcon.type === 'material' ? (
              <MaterialIcons name={customIcon.name as any} size={24} color={color} />
            ) : customIcon.type === 'materialCommunity' ? (
              <MaterialCommunityIcons name={customIcon.name as any} size={24} color={color} />
            ) : (
              <Feather name={customIcon.name as any} size={24} color={color} />
            )
          ) : (
            <Ionicons name={icon} size={24} color={color} />
          )}
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
        <Text style={styles.headerTitle}>Điều khoản sử dụng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introSection}>
          <View style={styles.documentIconContainer}>
            <MaterialCommunityIcons name="file-document-outline" size={40} color="#FF6C00" />
          </View>
          <Text style={styles.introTitle}>Điều khoản dịch vụ</Text>
          <Text style={styles.introText}>
            Vui lòng đọc kỹ các điều khoản dưới đây trước khi sử dụng dịch vụ của chúng tôi
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          {renderTermsCard(
            "document-text-outline",
            "Quy định chung",
            "Khi sử dụng Tech 5 Play, bạn đồng ý tuân theo các điều khoản và chính sách mà chúng tôi đề ra.",
            "#FF6C00",
            { type: 'materialCommunity', name: 'file-document-multiple-outline' }
          )}

          {renderTermsCard(
            "warning-outline",
            "Hành vi bị cấm",
            "Nghiêm cấm phát tán nội dung vi phạm bản quyền, spam, hack hoặc can thiệp vào hệ thống.",
            "#DC2626",
            { type: 'materialCommunity', name: 'alert-octagon-outline' }
          )}

          {renderTermsCard(
            "calendar-outline",
            "Cập nhật điều khoản",
            "Chúng tôi có thể cập nhật điều khoản để phù hợp với pháp luật và chính sách mới, bạn sẽ được thông báo trước khi có thay đổi lớn.",
            "#2563EB",
            { type: 'materialCommunity', name: 'calendar-clock' }
          )}

          {renderTermsCard(
            "shield-outline",
            "Bảo vệ tài khoản",
            "Bạn có trách nhiệm bảo vệ thông tin đăng nhập và chịu trách nhiệm cho mọi hoạt động từ tài khoản của mình.",
            "#059669",
            { type: 'materialCommunity', name: 'shield-account-outline' }
          )}
        </View>

        <View style={styles.footerSection}>
          <View style={styles.footerItem}>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#666" />
            <Text style={styles.footerText}>Cập nhật lần cuối: 01/03/2025</Text>
          </View>
          <TouchableOpacity style={styles.footerItem}>
            <MaterialCommunityIcons name="file-download-outline" size={20} color="#666" />
            <Text style={styles.footerText}>Tải về bản PDF</Text>
          </TouchableOpacity>
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
  documentIconContainer: {
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
