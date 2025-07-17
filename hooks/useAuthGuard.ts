import { useState, useCallback } from 'react';
import { useAppSelector } from '../store/hooks';

interface UseAuthGuardReturn {
  isLoggedIn: boolean;
  userId: string | null;
  user: any | null;
  showLoginModal: (featureName?: string) => void;
  hideLoginModal: () => void;
  loginModalVisible: boolean;
  currentFeatureName: string | null;
}

/**
 * Hook để quản lý authentication guard
 * 
 * MÔ TẢ:
 * - Kiểm tra trạng thái đăng nhập từ Redux store
 * - Quản lý modal hiển thị khi user chưa đăng nhập
 * - Cung cấp các helper functions để check auth và show modal
 * 
 * SỬ DỤNG:
 * const { isLoggedIn, showLoginModal } = useAuthGuard();
 * 
 * if (!isLoggedIn) {
 *   showLoginModal('Thuê phim');
 *   return;
 * }
 */
export const useAuthGuard = (): UseAuthGuardReturn => {
  const { isLoggedIn, userId, user } = useAppSelector((state) => state.auth);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [currentFeatureName, setCurrentFeatureName] = useState<string | null>(null);

  const showLoginModal = useCallback((featureName?: string) => {
    setCurrentFeatureName(featureName || null);
    setLoginModalVisible(true);
  }, []);

  const hideLoginModal = useCallback(() => {
    setLoginModalVisible(false);
    setCurrentFeatureName(null);
  }, []);

  return {
    isLoggedIn,
    userId,
    user,
    showLoginModal,
    hideLoginModal,
    loginModalVisible,
    currentFeatureName,
  };
};

export default useAuthGuard; 