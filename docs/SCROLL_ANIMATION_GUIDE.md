# 🎬 SCROLL ANIMATION GUIDE

## 📦 **useOptimizedScrollAnimation**

Perfect scroll header animation cho movie app với behavior tối ưu.

### 🎯 **BEHAVIOR**

- **⬇️ Scroll Down**: Header biến mất rất nhanh (50ms delay)
- **⬆️ Scroll Up**: Header hiện ngay lập tức (0ms delay)
- **🔝 Near Top**: Header luôn visible
- **🎬 Rich Animation**: Cả opacity + translateY slide
- **📱 Responsive**: Chỉ cần 30px scroll để trigger

### 🚀 **BASIC USAGE**

```typescript
import { useOptimizedScrollAnimation } from '../hooks';

const MyScreen = () => {
  const { headerOpacity, headerTranslateY, onScroll } = useOptimizedScrollAnimation();

  return (
    <View>
      <TabHeader opacity={headerOpacity} translateY={headerTranslateY} />
      <ScrollView onScroll={onScroll} scrollEventThrottle={16}>
        {/* content */}
      </ScrollView>
    </View>
  );
};
```

### 🎛️ **PRESETS**

#### **Default (Recommended)**
```typescript
useOptimizedScrollAnimation({ preset: 'default' })
// threshold: 30, hideDelay: 50, showDelay: 0, duration: 200
```

#### **Instant (Ultra Responsive)**
```typescript
useOptimizedScrollAnimation({ preset: 'instant' })
// threshold: 20, hideDelay: 0, showDelay: 0, duration: 150
```

#### **Smooth (Premium Feel)**
```typescript
useOptimizedScrollAnimation({ preset: 'smooth' })
// threshold: 50, hideDelay: 150, showDelay: 0, duration: 300
```

#### **Aggressive (Gaming Style)**
```typescript
useOptimizedScrollAnimation({ preset: 'aggressive' })
// threshold: 15, hideDelay: 25, showDelay: 0, duration: 180
```

### ⚙️ **CUSTOM CONFIG**

```typescript
useOptimizedScrollAnimation({
  preset: 'default',        // Base preset
  threshold: 40,            // Override threshold
  hideDelay: 100,          // Override hide delay
  slideDistance: -100,     // Override slide distance
})
```

### 📋 **CONFIG OPTIONS**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `preset` | string | 'default' | Predefined configuration |
| `threshold` | number | 30 | Minimum scroll để trigger |
| `hideDelay` | number | 50 | Delay khi ẩn (ms) |
| `showDelay` | number | 0 | Delay khi hiện (ms) |
| `animationDuration` | number | 200 | Animation duration (ms) |
| `slideDistance` | number | -80 | Slide distance (pixels) |

### 🎯 **RETURN VALUES**

```typescript
const {
  headerOpacity,        // Animated.Value for opacity
  headerTranslateY,     // Animated.Value for slide
  onScroll,            // ScrollView handler
  showHeader,          // Manual show function
  hideHeader,          // Manual hide function
  isVisible,           // Current state (boolean)
} = useOptimizedScrollAnimation();
```

### 📱 **IMPLEMENTATION EXAMPLES**

#### **Home Screen với Banner**
```typescript
// Perfect cho banner content
useOptimizedScrollAnimation({ 
  preset: 'default',
  hideDelay: 50    // Fast hide để không che banner
})
```

#### **Content List Screen**
```typescript
// Perfect cho danh sách content
useOptimizedScrollAnimation({ 
  preset: 'smooth',
  threshold: 40    // Cao hơn để không trigger khi scroll nhẹ
})
```

#### **Gaming/Action Screen**
```typescript
// Ultra responsive cho gaming experience
useOptimizedScrollAnimation({ 
  preset: 'aggressive'
})
```

### 🔧 **TROUBLESHOOTING**

#### **Header không ẩn/hiện**
- Check `scrollEventThrottle={16}` on ScrollView
- Verify TabHeader has `position: 'absolute'`
- Ensure proper `opacity` and `translateY` props

#### **Animation giật lag**
- Reduce `animationDuration`
- Use `useNativeDriver: true` (đã built-in)
- Check device performance

#### **Quá sensitive**
- Tăng `threshold` value
- Tăng `hideDelay` để ít trigger hơn

#### **Không responsive**
- Giảm `threshold` value  
- Giảm `hideDelay` để responsive hơn

### ⚡ **PERFORMANCE TIPS**

1. **Always use `scrollEventThrottle={16}`** cho 60fps
2. **Memoize handlers** với useCallback khi truyền props
3. **Use presets** thay vì custom config khi có thể
4. **Test on device** thay vì simulator cho accurate performance

### 🎨 **CUSTOMIZATION**

#### **Custom Slide Effect**
```typescript
useOptimizedScrollAnimation({
  slideDistance: -120,  // Slide xa hơn
  animationDuration: 250, // Smooth hơn
})
```

#### **Instant Response**
```typescript
useOptimizedScrollAnimation({
  preset: 'instant',
  threshold: 10,    // Very sensitive
})
```

#### **Delayed Hide for Reading**
```typescript
useOptimizedScrollAnimation({
  hideDelay: 200,   // Cho user time để đọc
  showDelay: 0,     // Show ngay khi scroll up
})
``` 