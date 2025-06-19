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
 * 
 * ARCHITECTURE:
 * Barrel pattern giúp:
 * - Clean import syntax
 * - Centralized component discovery
 * - Easy refactoring và maintenance
 * - Future component additions
 */

export { default as Notification } from './Notification';
export { default as SearchModal } from './SearchModal';
export { default as TabHeader } from './TabHeader';
export { default as ViewAllModal } from './ViewAllModal'; 