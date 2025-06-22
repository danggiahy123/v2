# 🎬 Refactor Movie Detail Screen – Technical Task

## 📌 Mục tiêu
Tối ưu hóa và tổ chức lại code của `MovieDetailScreen.tsx` theo hướng **modular**, **dễ bảo trì**, **tái sử dụng** và **test được**. File hiện tại vượt 1500+ dòng, gây khó khăn trong review, debug và mở rộng tính năng.

---

## ✅ Deliverables

- [ ] Chia component thành các phần con: UI, logic, hooks.
- [ ] Tách riêng phần style (hoặc chuyển sang Tailwind/styled-components).
- [ ] Đảm bảo các tính năng cũ không bị thay đổi (regression-safe).
- [ ] Viết lại cấu trúc thư mục cho màn hình `MovieDetail`.
- [ ] Bổ sung test cho các module sau khi tách.

---

## 🏗️ Proposed Structure


---

## ⚙️ Refactor Checklist

### UI Components
- [ ] `<Header />` – Back navigation + title
- [ ] `<VideoSection />` – Gồm player hoặc placeholder
- [ ] `<MovieInfo />` – Thông tin phim, rating, mô tả
- [ ] `<ActionRow />` – Các nút Like/Favorite/Share/Comment
- [ ] `<EpisodesList />` – Danh sách tập phim
- [ ] Tabs:
  - [ ] `<RelatedTab />` – placeholder liên quan
  - [ ] `<CommentsTab />` – gồm `CommentInput` + `CommentsList`

### Hooks
- [ ] `useMovieInteractions()` – handle like/favorite/comment + animation
- [ ] `useEpisodePlayer()` – chọn tập, set state player
- [ ] `useComments()` – trạng thái comment input, submit

### Logic
- [ ] Tách `getDefaultEpisode()` → logic riêng
- [ ] Tách `showNotificationMessage()` thành hook hoặc util

### Styles
- [ ] Tách StyleSheet → `styles.ts`
- [ ] Đổi sang `tailwind-rn` nếu cần (optional)

---

## 🧪 Testing

- [ ] Test unit các component tách ra (`MovieInfo`, `ActionRow`, `EpisodesList`)
- [ ] Viết test cho hook `useMovieInteractions`
- [ ] Snapshot test các UI components
- [ ] Regression test MovieDetailScreen (mock toàn bộ hooks)

---

## 📆 Timeline (gợi ý)

| Giai đoạn        | Thời gian |
|------------------|-----------|
| Tách UI Components | 1 ngày     |
| Tạo hooks & logic  | 1 ngày     |
| Viết test          | 1–2 ngày   |
| Code review        | Rolling    |

---

## 👨‍💻 Ghi chú kỹ thuật

- Dùng `React.memo` cho UI đơn giản.
- Truyền props rõ ràng thay vì phụ thuộc state toàn cục.
- DebugHighlight giữ lại dưới dạng wrapper tùy biến (`__DEV__` mode).

---

## 📁 Related file
- `screens/MovieDetailScreen.tsx` (hiện tại ~1500 dòng)
- `hooks/useMovieDetail.ts`

---

> **Owner**: `@yourname`  
> **Reviewer**: `@teammate`  
> **Priority**: High – chuẩn bị cho feature “theo dõi quá trình xem phim” và nâng cao test coverage.

