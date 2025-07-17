/**
 * UI COMPONENTS BARREL EXPORT
 * 
 * MÔ TẢ: 
 * Centralized export cho tất cả UI primitives và reusable components.
 * Enables clean imports: import { TabHeader, Notification } from '../../components/ui'
 * 
 * COMPONENTS:
 * - Notification: Toast/alert notifications với type support
 * - TabHeader: Specialized header cho tab screens (absolute positioning với animation)
 * - MovieDescriptionPreview: Hiển thị nội dung phim rút gọn với nút "xem thêm"
 * - MovieDescriptionInline: Hiển thị nội dung phim rút gọn và mở rộng inline
 * - LoginRequiredModal: Modal hiển thị khi user chưa đăng nhập muốn dùng tính năng cần auth
 * 
 * ARCHITECTURE:
 * Barrel pattern giúp:
 * - Clean import syntax
 * - Centralized component discovery
 * - Easy refactoring và maintenance
 * - Future component additions
 */

export { default as AnimatedElements } from './AnimatedElements';
export { default as DebugHighlight } from './DebugHighlight';
export { default as LoginRequiredModal } from './LoginRequiredModal';
export { default as MovieDescriptionInline } from './MovieDescriptionInline';
export { default as MovieDescriptionPreview } from './MovieDescriptionPreview';
export { default as Notification } from './Notification';
export { default as RegisteredMovieSearchModal } from './RegisteredMovieSearchModal';
export { default as SearchModal } from './SearchModal';
export { default as TabHeader } from './TabHeader';
export { default as ViewAllModal } from './ViewAllModal'; 