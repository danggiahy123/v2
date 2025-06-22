# 🚀 Development Guide - Movie Detail Screen

## ✅ **READY TO TEST!**

Foundation đã sẵn sàng. Bạn có thể bắt đầu development ngay bây giờ.

---

## 🎯 **BƯỚC 1: TEST API (Background)**

```bash
# Test API connection trước
cd /Users/nguyenquangloc/Desktop/movie-app/fontend
node scripts/test-movie-detail.js
```

Kết quả mong đợi:
- ✅ API getMovieDetailWithInteractions hoạt động
- ✅ toggleLike API hoạt động  
- ✅ toggleFavorite API hoạt động

---

## 📱 **BƯỚC 2: TEST APP (Mobile)**

### **Development Server đang chạy:**
```bash
# Expo dev server should be running at:
http://localhost:8081
```

### **Test trên device:**
1. **Open Expo Go app** trên phone
2. **Scan QR code** từ terminal 
3. **Navigate to home screen**
4. **Tap "🎬 Test Movie Detail"** button (màu đỏ trong banner)

### **Expected Result:**
- ✅ Movie detail screen loads
- ✅ Movie info hiển thị (title, poster, description)
- ✅ Action buttons hiển thị (Play, Like, Favorite, Comment)
- ✅ Episodes list hiển thị (nếu có)
- ✅ Related movies hiển thị (nếu có)

---

## 🔧 **BƯỚC 3: TEST INTERACTIONS**

### **Test Like Button:**
1. Tap ❤️ Like button
2. Check if button changes color (white → red)
3. Check console logs for success message

### **Test Favorite Button:**
1. Tap ⭐ Favorite button  
2. Check if button changes color (gray → yellow)
3. Check console logs for success message

### **Test Comments:**
1. Tap 💬 Comment button
2. Should show alert (placeholder for now)

### **Test Episodes:**
1. If movie has episodes, tap any episode
2. Should show alert with episode title

---

## 🐛 **TROUBLESHOOTING**

### **❌ Movie Detail không load:**
```typescript
// Check console cho error messages
// Common issues:
1. Network connection
2. Invalid movieId  
3. API server down
```

### **❌ Images không hiện:**
```typescript
// Check poster_path URL in console
// Add fallback image in MovieDetailScreen:
poster_path || 'https://via.placeholder.com/300x450'
```

### **❌ Interactions không work:**
```typescript
// Check userId trong useMovieDetail hook
// Make sure userId không null/undefined
```

---

## 📊 **DEBUGGING WORKFLOW**

### **1. Check Console Logs:**
```bash
# In Metro bundler terminal, look for:
🎬 [MovieDetailService] Fetching movie detail
✅ [MovieDetailService] Movie detail fetched successfully
❤️ [UserInteractionService] Toggle like
```

### **2. React Native Debugger:**
```bash
# Open React Native Debugger
# Check network requests
# Monitor state changes
```

### **3. Manual API Test:**
```bash
# Test API directly
curl -X GET "https://backend-app-lou3.onrender.com/api/movies/67534b36244d4dc1ed50e2fe/detail-with-interactions?userId=user123"
```

---

## 🎯 **DEVELOPMENT CHECKLIST**

### **✅ Foundation (DONE):**
- [x] Types created
- [x] Services created  
- [x] Hooks created
- [x] Screen created
- [x] Routing setup
- [x] Test button added

### **🔄 Currently Testing:**
- [ ] API connection works
- [ ] Screen renders correctly
- [ ] User interactions work
- [ ] Navigation works
- [ ] Error handling works

### **⚡ Next Steps:**
- [ ] Replace test userId with real auth
- [ ] Add video player integration
- [ ] Add comment input modal
- [ ] Add offline support
- [ ] Add animations

---

## 🚀 **LIVE DEVELOPMENT COMMANDS**

```bash
# Restart with cache clear
npx expo start --clear

# iOS simulator
npx expo start --ios

# Android emulator  
npx expo start --android

# Web version
npx expo start --web

# Check for errors
npm run lint
```

---

## 📱 **TESTING MATRIX**

| Feature | iOS | Android | Web | Status |
|---------|-----|---------|-----|---------|
| Load Movie Detail | 🔄 | 🔄 | 🔄 | Testing |
| Like Button | 🔄 | 🔄 | 🔄 | Testing |
| Favorite Button | 🔄 | 🔄 | 🔄 | Testing |
| Episodes List | 🔄 | 🔄 | 🔄 | Testing |
| Comments Display | 🔄 | 🔄 | 🔄 | Testing |
| Related Movies | 🔄 | 🔄 | 🔄 | Testing |
| Error Handling | 🔄 | 🔄 | 🔄 | Testing |
| Pull to Refresh | 🔄 | 🔄 | 🔄 | Testing |

---

## 🎉 **SUCCESS CRITERIA**

### **✅ Ready to ship when:**
- [ ] All features work on real device
- [ ] No console errors
- [ ] Smooth performance
- [ ] Good error handling
- [ ] Consistent UI across devices

### **🚀 Go Live Checklist:**
- [ ] Replace test data with production
- [ ] Add analytics tracking
- [ ] Add crash reporting
- [ ] Performance optimization
- [ ] App store screenshots

---

## 🔥 **QUICK COMMANDS**

```bash
# Start development (if not running)
npx expo start

# Clear cache and restart
npx expo start --clear

# Test API
node scripts/test-movie-detail.js

# Check bundle size
npx expo export --dev

# Generate production build
npx expo build:android
npx expo build:ios
```

---

## 💡 **PRO TIPS**

1. **Keep Metro bundler terminal open** để xem real-time logs
2. **Use React Native Debugger** cho advanced debugging
3. **Test on real device** cho accurate performance
4. **Clear cache** nếu có weird issues
5. **Check backend logs** nếu API fails

---

**🎬 HAPPY CODING! Foundation đã sẵn sàng để ship! 🚀**