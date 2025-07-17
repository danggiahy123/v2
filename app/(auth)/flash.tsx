import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Dimensions, Animated, Text } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppSelector } from '../../store/hooks';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function FlashScreen() {
  const { isLoggedIn } = useAppSelector((state) => state.auth);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Logo animation with enhanced effects
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous rotation animation for logo
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation for visual appeal
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Enhanced loading animation
    Animated.loop(
      Animated.timing(loadingAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: false,
      })
    ).start();

    // Navigate after 3.5 seconds
    const timer = setTimeout(() => {
      router.replace('/(tabs)' as any);
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  const loadingWidth = loadingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Animated background gradient */}
      <LinearGradient
        colors={['#000000', '#1a0000', '#2d0000', '#400000']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Animated particles */}
        <View style={styles.particlesContainer}>
          {[...Array(20)].map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.particle,
                {
                  left: Math.random() * width,
                  top: Math.random() * height,
                  opacity: Math.random() * 0.6 + 0.2,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.content}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: scaleAnim },
                  { translateY: slideAnim },
                  { rotate: rotateInterpolate },
                ],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.logoWrapper,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Image
                source={require('../../assets/anh/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>
            
            {/* Glow effect */}
            <View style={styles.glowEffect} />
          </Animated.View>

          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.welcomeText}>Tech5 Play</Text>
            <Text style={styles.subtitleText}>Ứng dụng xem phim hàng đầu</Text>
            <Text style={styles.descriptionText}>
              Khám phá kho phim khổng lồ với chất lượng cao
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.loadingContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.loadingBarContainer}>
              <View style={styles.loadingBar}>
                <Animated.View
                  style={[
                    styles.loadingProgress,
                    { width: loadingWidth },
                  ]}
                />
                <View style={styles.loadingGlow} />
              </View>
            </View>
            <Text style={styles.loadingText}>Đang khởi động...</Text>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 Tech5 Play - Nền tảng giải trí số</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particlesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  particle: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#ff0000',
    borderRadius: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
    position: 'relative',
  },
  logoWrapper: {
    position: 'relative',
    zIndex: 2,
  },
  logo: {
    width: width * 0.65,
    height: height * 0.28,
  },
  glowEffect: {
    position: 'absolute',
    width: width * 0.8,
    height: height * 0.35,
    backgroundColor: 'rgba(255, 0, 0, 0.15)',
    borderRadius: 50,
    zIndex: 1,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 70,
  },
  welcomeText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 1,
  },
  subtitleText: {
    fontSize: 20,
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
    opacity: 0.9,
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 16,
    color: '#b8b8b8',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
    maxWidth: width * 0.8,
  },
  loadingContainer: {
    alignItems: 'center',
    width: '100%',
  },
  loadingBarContainer: {
    width: '85%',
    marginBottom: 16,
  },
  loadingBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: '#ff0000',
    borderRadius: 3,
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 8,
  },
  loadingGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 0, 0, 0.4)',
    borderRadius: 3,
  },
  loadingText: {
    fontSize: 15,
    color: '#b8b8b8',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  footer: {
    paddingBottom: 50,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#666666',
    opacity: 0.7,
    letterSpacing: 0.3,
  },
});
