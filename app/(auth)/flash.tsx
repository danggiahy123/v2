import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, StatusBar, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

export default function FlashScreen() {
  const navigation = useNavigation();
  const [dots, setDots] = useState('');
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 10000);

    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    return () => {
      clearTimeout(timer);
      clearInterval(dotInterval);
    };
  }, []);

  return (
    <LinearGradient colors={['#8B0000', '#000']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <Animated.View style={[styles.logoContainer, { transform: [{ scale: scaleAnim }] }]}>
        <Image
          source={require('../../assets/anh/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Text style={styles.title}>TECH5 PLAY</Text>

      <Text style={styles.subtitle}>
        Nền tảng xem phim, thể thao, giải trí hàng đầu Việt Nam
      </Text>

      <Text style={styles.loading}>Đang khởi động{dots}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  logoContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#1a0000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#ff4d4d',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 2,
    borderColor: '#ff1a1a',
  },
  logo: {
    width: 140,
    height: 140,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff1a1a',
    marginBottom: 12,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
    paddingHorizontal: 20,
  },
  loading: {
    marginTop: 40,
    color: '#ff4d4d',
    fontStyle: 'italic',
    fontSize: 15,
    letterSpacing: 1,
  },
});
