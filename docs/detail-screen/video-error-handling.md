# 🎥 Video Error Handling Guide

> **Hướng dẫn xử lý lỗi video player và URL validation**

## 🚨 **Problem Identified**

**Error**: `The server is not correctly configured. - The AVPlayerItem instance has failed with error code -11850`

**Root Cause**: Database chứa relative paths như `media/movie.mp4` thay vì real video URLs

## ✅ **Solution Implemented**

### 🔧 **Enhanced VideoPlayer Component**

**File**: `components/movie/player/VideoPlayer.tsx`

#### 1. **Smart URL Validation**
```tsx
// Helper function to validate video URL
const isValidVideoUrl = (url: string): boolean => {
  if (!url) return false;
  
  // Check if it's a valid HTTP/HTTPS URL
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};
```

#### 2. **URL Processing Logic**
```tsx
// Helper function to get video URL from episode
const getVideoUrl = (episode: Episode): string | null => {
  const url = episode.video_url || episode.uri;
  if (!url) return null;
  
  // If it's already a valid URL, return it
  if (isValidVideoUrl(url)) {
    return url;
  }
  
  // If it's a relative path, we know it's not a real video
  console.log('⚠️ [VideoPlayer] Invalid video URL detected:', url);
  return null;
};
```

#### 3. **User-Friendly Placeholder**
```tsx
// No valid video URL available
if (!videoUrl) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <View style={styles.placeholderContainer}>
          <Ionicons name="videocam-off" size={64} color="#666" />
          <Text style={styles.placeholderTitle}>Video đang được cập nhật</Text>
          <Text style={styles.placeholderSubtitle}>
            Tập phim này sẽ sớm có sẵn. Vui lòng quay lại sau.
          </Text>
        </View>
      </View>
    </View>
  );
}
```

#### 4. **Retry Mechanism**
```tsx
const handleRetry = () => {
  console.log('🔄 [VideoPlayer] Retrying video load...');
  setIsLoading(true);
  setError(null);
  setRetryCount(prev => prev + 1);
  
  // Force video reload
  if (videoRef.current) {
    videoRef.current.unloadAsync().then(() => {
      videoRef.current?.loadAsync({ uri: videoUrl! }, {}, false);
    });
  }
};
```

## 📱 **User Experience Improvements**

### ❌ **Before (Crashes)**
```
- App crashes with technical error
- "AVPlayerItem instance has failed with error code -11850"
- Poor user experience
```

### ✅ **After (Graceful)**
```
- Clean placeholder with helpful message
- "Video đang được cập nhật - Tập phim này sẽ sớm có sẵn"
- Professional UI with retry options
```

## 🛡️ **Error States Handled**

### 1. **Invalid Video URLs**
- ✅ Relative paths like `media/movie.mp4`
- ✅ Empty or null URLs
- ✅ Malformed URLs

### 2. **Network Issues**
- ✅ Connection timeouts
- ✅ Server unavailable
- ✅ DNS resolution failures

### 3. **Server Configuration**
- ✅ CORS issues
- ✅ Authentication problems
- ✅ Rate limiting

### 4. **Video Format Issues**
- ✅ Unsupported formats
- ✅ Corrupted files
- ✅ Encoding problems

### 5. **Cloudflare Stream**
- ✅ Stream not found
- ✅ Token expired
- ✅ Geographic restrictions

## 🎨 **UI Components**

### **Placeholder Screen**
```tsx
<View style={styles.placeholderContainer}>
  <Ionicons name="videocam-off" size={64} color="#666" />
  <Text style={styles.placeholderTitle}>Video đang được cập nhật</Text>
  <Text style={styles.placeholderSubtitle}>
    Tập phim này sẽ sớm có sẵn. Vui lòng quay lại sau.
  </Text>
  {(episode.video_url || episode.uri) && (
    <Text style={styles.debugText}>
      URL: {episode.video_url || episode.uri}
    </Text>
  )}
</View>
```

### **Error Screen with Retry**
```tsx
<View style={styles.errorOverlay}>
  <Ionicons name="warning" size={48} color="#ff6b6b" />
  <Text style={styles.errorText}>Không thể phát video</Text>
  <Text style={styles.errorSubText}>
    Máy chủ video chưa được cấu hình đúng cách
  </Text>
  <TouchableOpacity 
    style={styles.retryButton}
    onPress={handleRetry}
    disabled={retryCount >= 3}
  >
    <Ionicons name="refresh" size={20} color="#fff" />
    <Text style={styles.retryButtonText}>
      {retryCount >= 3 ? 'Đã thử tối đa' : 'Thử lại'}
    </Text>
  </TouchableOpacity>
</View>
```

## 🧪 **Testing Scenarios**

### 1. **Invalid URL Testing**
```tsx
// Test cases
const testCases = [
  'media/movie.mp4',           // Relative path
  'invalid-url',               // Malformed
  '',                          // Empty
  null,                        // Null
  'ftp://example.com/video',   // Wrong protocol
];
```

### 2. **Network Error Testing**
- Disconnect internet
- Block domain in hosts file
- Use invalid server URL
- Test with slow connection

### 3. **Edge Cases**
- Very long URLs
- Special characters in URLs
- Unicode characters
- URLs with query parameters

## 📊 **Monitoring & Analytics**

### **Error Logging**
```tsx
console.log('⚠️ [VideoPlayer] Invalid video URL detected:', url);
console.error('❌ [VideoPlayer] Playback error:', error);
```

### **User Analytics**
- Track video load failures
- Monitor retry attempts
- Measure error recovery rates
- Identify problematic content

## 🔄 **Future Improvements**

1. **Automatic URL Conversion**
   - Convert relative paths to absolute URLs
   - Add CDN prefix automatically

2. **Fallback Sources**
   - Multiple video quality options
   - Alternative CDN endpoints

3. **Offline Support**
   - Cache video metadata
   - Download for offline viewing

4. **Smart Retry**
   - Exponential backoff
   - Different retry strategies per error type

---
**Last Updated**: 2025-01-27  
**Status**: ✅ Production Ready 