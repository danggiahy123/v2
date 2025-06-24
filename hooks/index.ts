/**
 * HOOKS BARREL EXPORT
 * 
 * MÔ TẢ:
 * Centralized export cho tất cả custom hooks trong project.
 * Enables clean imports và easy hook discovery.
 * 
 * CUSTOM HOOKS:
 * - useOptimizedScrollAnimation: Scroll header animation với perfect UX behavior
 * - useRentalStatus: Manage rental access status checking
 * - usePaymentStatus: Payment status tracking during QR payments
 * 
 * FUTURE HOOKS:
 * - useMovieWatchlist: Manage user watchlist
 * - useVideoPlayer: Video player controls
 * - useOfflineDownload: Download management
 * - useSearchHistory: Search history management
 */
export { useOptimizedScrollAnimation } from './useOptimizedScrollAnimation';
export { useRentalStatus } from './useRentalStatus';
export { usePaymentStatus } from './usePaymentStatus'; 