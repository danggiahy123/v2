import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function AboutScreen() {
  const router = useRouter();

  const renderFeatureCard = (icon: any, title: string, description: string, color: string) => (
    <View style={styles.card}>
      <LinearGradient
        colors={[`${color}15`, `${color}05`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Image source={icon} style={styles.featureIcon} resizeMode="contain" />
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Image 
            source={require('../../assets/anh/back.png')} 
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giới thiệu</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Image 
            source={require('../../assets/anh/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Tech 5 Play</Text>
          <Text style={styles.version}>Version 2.0.0</Text>
        </View>

        {/* Features Section */}
        <View style={styles.featuresContainer}>
          {renderFeatureCard(
            require('../../assets/anh/phim.png'),
            "Nền tảng giải trí hàng đầu",
            "Tech 5 Play là nền tảng xem phim và giải trí hàng đầu, cung cấp hàng ngàn nội dung chất lượng cao từ phim bộ, điện ảnh, anime đến thể thao trực tiếp.",
            "#FF6C00"
          )}

          {renderFeatureCard(
            require('../../assets/anh/responsive.png'),
            "Sứ mệnh của chúng tôi",
            "Mang đến trải nghiệm giải trí số mượt mà, cá nhân hóa và đáng tin cậy cho mọi gia đình Việt.",
            "#3B82F6"
          )}

          {renderFeatureCard(
            require('../../assets/anh/account.png'),
            "Đa nền tảng",
            "Dễ dàng truy cập Tech 5 Play từ TV, điện thoại, máy tính bảng với cùng một tài khoản.",
            "#EC4899"
          )}

          {renderFeatureCard(
            require('../../assets/anh/subscribe.png'),
            "An toàn & Bảo mật",
            "Chúng tôi cam kết bảo vệ thông tin người dùng và tuân thủ các tiêu chuẩn bảo mật cao nhất.",
            "#7C3AED"
          )}
        </View>

        {/* Copyright Section */}
        <View style={styles.copyrightSection}>
          <Text style={styles.copyright}>© 2024 Tech 5 Play. All rights reserved.</Text>
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
  backIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
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
  logoSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  version: {
    fontSize: 14,
    color: '#666',
  },
  featuresContainer: {
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
  featureIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
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
  copyrightSection: {
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ffffff10',
  },
  copyright: {
    fontSize: 12,
    color: '#666',
  },
});
