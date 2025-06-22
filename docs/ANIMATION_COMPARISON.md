# 🎬 SCROLL ANIMATION COMPARISON

## 📊 **SO SÁNH HAI APPROACHES**

### 🎯 **COMMIT APPROACH** (useCommitStyleAnimation)
```typescript
// From original commit
const {
  headerOpacity,
  onScroll: onScrollCommit,
} = useCommitStyleAnimation({
  sensitivity: 2,       // Very sensitive
  hideDelay: 0,         // Immediate hide
  animationDuration: 200,
});
```

**✅ PROS:**
- **Responsive**: Phản ứng ngay với scroll nhỏ (2px)
- **Simple**: Chỉ opacity animation, ít phức tạp
- **Immediate**: Hide ngay lập tức khi scroll down
- **Performance**: Ít animation layers hơn

**❌ CONS:**
- **Jittery**: Có thể nhấp nháy khi scroll chậm
- **Harsh**: Không có delay, UX kém mượt
- **Limited**: Thiếu translateY animation

### 🎬 **NETFLIX APPROACH** (useScrollHeaderAnimation)
```typescript
// Professional approach
const {
  headerOpacity,
  headerTranslateY,
  onScroll: onScrollNetflix,
} = useScrollHeaderAnimation({
  threshold: 60,
  hideDelay: 150,
  animationDuration: 300,
});
```

**✅ PROS:**
- **Smooth**: Delay và animation mượt mà
- **Professional**: Giống Netflix, FPT Play
- **Rich**: Có cả opacity + translateY
- **Smart**: Threshold cao hơn, ít false triggers

**❌ CONS:**
- **Slower**: Cần scroll nhiều hơn để trigger
- **Complex**: Nhiều animation layers hơn

## 🔧 **CÁCH CHUYỂN ĐỔI**

Trong `app/(tabs)/index.tsx`:

```typescript
// Toggle between approaches
const useCommitApproach = true; // Change này

// Commit: Immediate, sensitive
const useCommitApproach = true;

// Netflix: Smooth, professional  
const useCommitApproach = false;
```

## 🎯 **RECOMMENDATION**

**Dùng COMMIT APPROACH khi:**
- Muốn responsive cao
- Content scrolls nhiều
- Prefer simple animation

**Dùng NETFLIX APPROACH khi:**
- Muốn UX professional
- Content có banner lớn
- Prefer smooth experience

## 📱 **TEST BOTH**

1. Set `useCommitApproach = true` → Test commit style
2. Set `useCommitApproach = false` → Test Netflix style
3. Chọn approach phù hợp với UX requirements 