import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function HelpScreen() {
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/explore');
    }
  };

  const renderFAQCard = (icon: any, title: string, text: string, color: string) => (
    <TouchableOpacity activeOpacity={0.9} style={styles.card}>
      <LinearGradient
        colors={[`${color}20`, `${color}05`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${color}30` }]}>
          <Image source={icon} style={[styles.cardIcon, { tintColor: color }]} resizeMode="contain" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardText}>{text}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#000', 'transparent']}
        style={styles.headerGradient}
        pointerEvents="none"
      />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Image 
            source={require('../../assets/anh/back.png')} 
            style={styles.backIcon} 
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trung tâm hỗ trợ</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
        
          <Text style={styles.sectionTitle}>Câu hỏi thường gặp</Text>
        </View>

        {renderFAQCard(
          require('../../assets/anh/account.png'),
          "Cách tạo tài khoản?",
          "Đăng ký dễ dàng với email hoặc số điện thoại tại màn hình đăng nhập.",
          "#7C3AED"
        )}

        {renderFAQCard(
          require('../../assets/anh/responsive.png'),
          "Không xem được phim?",
          "Kiểm tra kết nối mạng, nếu vẫn lỗi, hãy khởi động lại ứng dụng hoặc liên hệ hỗ trợ.",
          "#EC4899"
        )}

        {renderFAQCard(
          require('../../assets/anh/phim.png'),
          "Tải phim offline?",
          "Tài khoản Premium có thể tải phim để xem không cần mạng trong phần \"Tải về\".",
          "#3B82F6"
        )}

        <View style={[styles.sectionHeader, { marginTop: 32 }]}>
      
          <Text style={styles.sectionTitle}>Liên hệ hỗ trợ</Text>
        </View>

        <View style={styles.contactBox}>
          <LinearGradient
            colors={['#FF6C0020', '#FF6C0005']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.contactGradient}
          >
            <View style={styles.contactRow}>
              <Image 
                source={require('../../assets/anh/chiase.png')} 
                style={[styles.contactIcon, { tintColor: '#FF6C00' }]} 
                resizeMode="contain"
              />
              <Text style={styles.contactLabel}>Email:</Text>
              <Text style={styles.contactValue}>support@tech5play.com</Text>
            </View>
            
            <View style={styles.contactRow}>
              <Image 
                source={require('../../assets/anh/bell.png')} 
                style={[styles.contactIcon, { tintColor: '#FF6C00' }]} 
                resizeMode="contain"
              />
              <Text style={styles.contactLabel}>Hotline:</Text>
              <Text style={styles.contactValue}>0798969915</Text>
            </View>
            
            <View style={styles.contactRow}>
              <Image 
                source={require('../../assets/anh/them.png')} 
                style={[styles.contactIcon, { tintColor: '#FF6C00' }]} 
                resizeMode="contain"
              />
              <Text style={styles.contactLabel}>Giờ làm việc:</Text>
              <Text style={styles.contactValue}>8:00 - 22:00 (T2 - CN)</Text>
            </View>
          </LinearGradient>
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    flexDirection: 'row',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardIcon: {
    width: 24,
    height: 24,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  contactBox: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  contactGradient: {
    padding: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  contactLabel: {
    fontSize: 15,
    color: '#rgba(255, 255, 255, 0.6)',
    marginRight: 8,
  },
  contactValue: {
    fontSize: 15,
    color: '#FF6C00',
    fontWeight: '500',
  },
});
