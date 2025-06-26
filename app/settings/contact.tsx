import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, ScrollView, Linking, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function ContactScreen() {
  const router = useRouter();

  const handleCall = () => {
    Linking.openURL('tel:0798969915');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:contact@tech5play.com');
  };

  const handleMap = () => {
    Linking.openURL('https://maps.google.com/?q=123 Nguyễn Văn Cừ, Q.5, TP.HCM');
  };

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
        <Text style={styles.headerTitle}>Thông tin liên hệ</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
         
          <Text style={styles.sectionTitle}>Liên hệ với chúng tôi</Text>
        </View>

        <View style={styles.cardContainer}>
          <TouchableOpacity style={styles.card} onPress={handleEmail}>
            <LinearGradient
              colors={['#FF6C0015', '#FF6C0005']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.iconContainer}>
                <Image 
                  source={require('../../assets/anh/chiase.png')} 
                  style={styles.cardIcon} 
                  resizeMode="contain"
                />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>contact@tech5play.com</Text>
              </View>
              <Image 
                source={require('../../assets/anh/thu.png')} 
                style={[styles.arrowIcon, { tintColor: '#FF6C00' }]}
                resizeMode="contain"
              />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={handleCall}>
            <LinearGradient
              colors={['#3B82F615', '#3B82F605']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#3B82F615' }]}>
                <Image 
                  source={require('../../assets/anh/bell.png')} 
                  style={[styles.cardIcon, { tintColor: '#3B82F6' }]}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.label}>Hotline</Text>
                <Text style={[styles.value, { color: '#3B82F6' }]}>0798969915</Text>
              </View>
              <Image 
                source={require('../../assets/anh/thu.png')} 
                style={[styles.arrowIcon, { tintColor: '#3B82F6' }]}
                resizeMode="contain"
              />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={handleMap}>
            <LinearGradient
              colors={['#EC489915', '#EC489905']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#EC489915' }]}>
                <Image 
                  source={require('../../assets/anh/them.png')} 
                  style={[styles.cardIcon, { tintColor: '#EC4899' }]}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.label}>Địa chỉ</Text>
                <Text style={[styles.value, { color: '#EC4899' }]}>
                  123 Nguyễn Văn Cừ, Q.5, TP.HCM
                </Text>
              </View>
              <Image 
                source={require('../../assets/anh/thu.png')} 
                style={[styles.arrowIcon, { tintColor: '#EC4899' }]}
                resizeMode="contain"
              />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.card}>
            <LinearGradient
              colors={['#7C3AED15', '#7C3AED05']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#7C3AED15' }]}>
                <Image 
                  source={require('../../assets/anh/account.png')} 
                  style={[styles.cardIcon, { tintColor: '#7C3AED' }]}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.label}>Giờ làm việc</Text>
                <Text style={[styles.value, { color: '#7C3AED' }]}>08:00 - 22:00 (T2 - CN)</Text>
              </View>
            </LinearGradient>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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
  cardContainer: {
    marginBottom: 32,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6C0015',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardIcon: {
    width: 24,
    height: 24,
    tintColor: '#FF6C00',
  },
  cardContent: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: '#rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#FF6C00',
    fontWeight: '600',
  },
  arrowIcon: {
    width: 20,
    height: 20,
  },
});
