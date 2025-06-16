/**
 * OPTIMIZED SCROLL ANIMATION HOOK
 * Perfect scroll header animation cho movie app
 * 
 * 🎯 DUAL MODE ARCHITECTURE:
 * ==========================================
 * 1️⃣ ANIMATED MODE (animationDuration > 0):
 *    - Smooth Animated.timing() transitions
 *    - Configurable delays & durations
 *    - Professional Netflix-style UX
 * 
 * 2️⃣ IMMEDIATE MODE (animationDuration = 0):
 *    - Direct setValue() như commit style
 *    - Ultra-responsive (2px threshold)
 *    - Zero animation delays
 *    - Instant hide/show behavior
 * 
 * 🎬 BEHAVIOR COMPARISON:
 * ==========================================
 * ANIMATED MODE:
 * ⬇️ Scroll down: Header fade out với timing (smooth)
 * ⬆️ Scroll up: Header fade in với timing (elegant)
 * 🔄 Delays: Configurable hideDelay/showDelay
 * 
 * IMMEDIATE MODE: 
 * ⬇️ Scroll down: Header biến mất ngay lập tức (setValue(0))
 * ⬆️ Scroll up: Header hiện ngay lập tức (setValue(1))
 * ⚡ Zero delays: Instant response like commit logic
 * 
 * 📱 SMART DETECTION:
 * ==========================================
 * - Direction tracking: up/down scroll detection
 * - Threshold-based: Only trigger on significant scroll
 * - Near-top handling: Always show header when scrollY <= threshold
 * - Timeout management: Prevent rapid hide/show flickering
 * 
 * PERFECT CHO:
 * - Movie streaming apps (Netflix-style)
 * - Content-heavy screens với banner  
 * - High-performance scroll UX
 * - A/B testing different animation styles
 * 
 * USAGE:
 * ```typescript
 * // SMOOTH ANIMATION (Netflix-style)
 * const { headerOpacity, headerTranslateY, onScroll } = useOptimizedScrollAnimation({
 *   preset: 'smooth'    // Elegant timing-based animations
 * });
 * 
 * // IMMEDIATE MODE (Commit-style handleScroll)  
 * const { headerOpacity, headerTranslateY, onScroll } = useOptimizedScrollAnimation({
 *   preset: 'immediate'  // Direct setValue(), ultra-responsive
 * });
 * 
 * // CUSTOM HYBRID CONFIG
 * const { headerOpacity, headerTranslateY, onScroll } = useOptimizedScrollAnimation({
 *   threshold: 30,           // Scroll threshold để trigger
 *   hideDelay: 50,          // Delay khi ẩn (animated mode)
 *   showDelay: 0,           // Delay khi hiện (animated mode)
 *   animationDuration: 200, // 0 = immediate setValue, >0 = Animated.timing
 *   slideDistance: -80,     // translateY distance for slide effect
 * });
 * ```
 */
import { useRef, useCallback } from 'react';
import { Animated, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

interface UseOptimizedScrollAnimationConfig {
  threshold?: number;           // Minimum scroll để trigger (default: 30)
  showDelay?: number;          // Delay when showing (default: 0 - immediate)
  hideDelay?: number;          // Delay when hiding (default: 50 - very fast)
  animationDuration?: number;  // Animation duration (default: 200)
  slideDistance?: number;      // Slide distance for translateY (default: -80)
  preset?: 'default' | 'instant' | 'smooth' | 'aggressive' | 'immediate'; // Predefined configurations
}

// 🎛️ PRESET CONFIGURATIONS
// ==========================================
// Mỗi preset được tối ưu cho use case khác nhau
const PRESETS = {
  // 🎬 NETFLIX-STYLE: Balanced smooth experience
  default: { 
    threshold: 30,           // Medium sensitivity - không quá nhạy
    showDelay: 0,           // Show ngay khi scroll up
    hideDelay: 50,          // Slight delay khi hide - avoid accidental hiding
    animationDuration: 200, // Smooth transition timing
    slideDistance: -80      // Standard slide distance
  },
  
  // ⚡ FAST RESPONSE: Quick but still animated
  instant: { 
    threshold: 20,           // High sensitivity
    showDelay: 0,           // Immediate show
    hideDelay: 0,           // Immediate hide  
    animationDuration: 150, // Fast animation
    slideDistance: -60      // Shorter slide for speed
  },
  
  // 🎭 ELEGANT: Smooth Netflix-like experience
  smooth: { 
    threshold: 50,           // Lower sensitivity - deliberate scrolls only
    showDelay: 0,           // Show immediately when intentional
    hideDelay: 150,         // Longer delay - avoid accidental hiding
    animationDuration: 300, // Smooth elegant timing
    slideDistance: -100     // Full slide effect
  },
  
  // 🏃 AGGRESSIVE: Very responsive for power users
  aggressive: { 
    threshold: 15,           // Very sensitive
    showDelay: 0,           // Instant show
    hideDelay: 25,          // Quick hide
    animationDuration: 180, // Fast but smooth
    slideDistance: -70      // Medium slide
  },
  
  // 🚀 IMMEDIATE: Direct setValue() - commit-style handleScroll logic
  immediate: { 
    threshold: 2,            // Ultra-sensitive - even slight scroll triggers
    showDelay: 0,           // Not used in immediate mode
    hideDelay: 0,           // Not used in immediate mode
    animationDuration: 0,   // KEY: 0 = immediate setValue(), no Animated.timing
    slideDistance: -80      // Standard slide distance
  },
};

export const useOptimizedScrollAnimation = (config: UseOptimizedScrollAnimationConfig = {}) => {
  // 🔧 CONFIG RESOLUTION
  // ==========================================
  // Step 1: Load preset defaults
  const preset = config.preset ? PRESETS[config.preset] : PRESETS.default;
  
  // Step 2: Override preset với custom config (if provided)
  const {
    threshold = preset.threshold,
    showDelay = preset.showDelay,
    hideDelay = preset.hideDelay,
    animationDuration = preset.animationDuration,
    slideDistance = preset.slideDistance,
  } = { ...preset, ...config };
  
  // 🎬 ANIMATED VALUES
  // ==========================================
  // Khởi tạo với visible state (opacity: 1, translateY: 0)
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  
  // 📊 TRACKING REFS
  // ==========================================
  // Persistent state giữa các render cycles
  const lastScrollY = useRef(0);                    // Previous scroll position
  const scrollDirection = useRef<'up' | 'down'>('up'); // Current scroll direction
  const isHeaderVisible = useRef(true);             // Current visibility state
  const hideTimeout = useRef<number | null>(null);  // Debounce hide action
  const showTimeout = useRef<number | null>(null);  // Debounce show action

  // 🔼 SHOW HEADER FUNCTION
  // ==========================================
  // Chỉ được sử dụng trong ANIMATED MODE (animationDuration > 0)
  const showHeader = useCallback(() => {
    if (!isHeaderVisible.current) {
      isHeaderVisible.current = true;
      
      // Clear any pending hide timeouts để avoid conflicts
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
        hideTimeout.current = null;
      }
      
      // Parallel animation cho smooth UX
      // Both opacity + translateY transition cùng lúc
      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 1,                    // Fully visible
          duration: animationDuration,   // Configurable timing
          useNativeDriver: true,         // Hardware acceleration
        }),
        Animated.timing(headerTranslateY, {
          toValue: 0,                    // Reset position (no slide)
          duration: animationDuration,   // Sync với opacity
          useNativeDriver: true,         // 60fps performance
        }),
      ]).start();
    }
  }, [headerOpacity, headerTranslateY, animationDuration]);

  // 🔽 HIDE HEADER FUNCTION  
  // ==========================================
  // Chỉ được sử dụng trong ANIMATED MODE (animationDuration > 0)
  const hideHeader = useCallback(() => {
    if (isHeaderVisible.current) {
      isHeaderVisible.current = false;
      
      // Clear any pending show timeouts để avoid conflicts
      if (showTimeout.current) {
        clearTimeout(showTimeout.current);
        showTimeout.current = null;
      }
      
      // Parallel animation cho smooth UX
      // Header fades out và slides up cùng lúc
      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 0,                    // Fully hidden
          duration: animationDuration,   // Configurable timing
          useNativeDriver: true,         // Hardware acceleration
        }),
        Animated.timing(headerTranslateY, {
          toValue: slideDistance,        // Slide up (negative value)
          duration: animationDuration,   // Sync với opacity
          useNativeDriver: true,         // 60fps performance
        }),
      ]).start();
    }
  }, [headerOpacity, headerTranslateY, animationDuration, slideDistance]);

  // 🎯 DUAL MODE SCROLL HANDLER
  // ==========================================
  // Main logic - detects scroll và trigger appropriate response
  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDelta = currentScrollY - lastScrollY.current;
    
    // 🚀 IMMEDIATE MODE: Direct setValue() - commit-style handleScroll logic
    // ==========================================
    if (animationDuration === 0) {
      // Ultra-sensitive detection với threshold (usually 2px)
      if (scrollDelta > threshold && currentScrollY > 0) {
        // SCROLLING DOWN -> HIDE IMMEDIATELY
        // Direct setValue() - no animation, instant response
        headerOpacity.setValue(0);                  // Instant hide
        headerTranslateY.setValue(slideDistance);   // Instant slide up
        isHeaderVisible.current = false;            // Update state
      } else if (scrollDelta < -threshold || currentScrollY <= 0) {
        // SCROLLING UP OR AT TOP -> SHOW IMMEDIATELY
        // Direct setValue() - no animation, instant response  
        headerOpacity.setValue(1);                  // Instant show
        headerTranslateY.setValue(0);               // Reset position
        isHeaderVisible.current = true;             // Update state
      }
      
      lastScrollY.current = currentScrollY;
      return; // Exit early, không process animated logic
    }
    
    // 🎬 ANIMATED MODE: Timing-based smooth animations
    // ==========================================
    
    // Ignore very small movements để avoid jittery behavior
    if (Math.abs(scrollDelta) < 2) return;
    
    // Determine scroll direction
    const newDirection = scrollDelta > 0 ? 'down' : 'up';
    
    // Only trigger nếu direction changed HOẶC scroll distance > threshold
    if (newDirection !== scrollDirection.current || Math.abs(scrollDelta) > threshold) {
      scrollDirection.current = newDirection;
      
      if (newDirection === 'down' && currentScrollY > threshold) {
        // 🔽 SCROLLING DOWN - Hide với configurable delay
        if (hideDelay > 0) {
          // Debounced hide - wait cho hideDelay trước khi trigger
          hideTimeout.current = setTimeout(() => {
            hideHeader(); // Smooth animated hide
          }, hideDelay);
        } else {
          // Immediate animated hide (no delay)
          hideHeader();
        }
        
      } else if (newDirection === 'up' || currentScrollY <= threshold) {
        // 🔼 SCROLLING UP OR NEAR TOP - Show với configurable delay
        if (showDelay > 0) {
          // Debounced show - wait cho showDelay trước khi trigger
          showTimeout.current = setTimeout(() => {
            showHeader(); // Smooth animated show
          }, showDelay);
        } else {
          // Immediate animated show (no delay)
          showHeader();
        }
      }
    }
    
    // Update last position cho next calculation
    lastScrollY.current = currentScrollY;
  }, [threshold, hideDelay, showDelay, hideHeader, showHeader, animationDuration, slideDistance]);

  // 🎮 MANUAL CONTROL FUNCTIONS
  // ==========================================
  // Programmatic control cho external components
  const manualShow = useCallback(() => showHeader(), [showHeader]);
  const manualHide = useCallback(() => hideHeader(), [hideHeader]);

  return {
    // 🎬 ANIMATED VALUES 
    // ==========================================
    // Apply these to TabHeader component props
    headerOpacity,        // Animated.Value for opacity animation (0-1)
    headerTranslateY,     // Animated.Value for slide animation (0 to slideDistance)
    
    // 📱 SCROLL HANDLER
    // ==========================================  
    // Apply to ScrollView's onScroll prop
    onScroll,            // Main scroll event handler with dual mode logic
    
    // 🎮 MANUAL CONTROLS
    // ==========================================
    // For programmatic control outside of scroll events
    showHeader: manualShow,   // Force show header (calls showHeader())
    hideHeader: manualHide,   // Force hide header (calls hideHeader())
    
    // 📊 CURRENT STATE
    // ==========================================
    // Read-only state information
    isVisible: isHeaderVisible.current, // Current visibility state (boolean)
  };
}; 