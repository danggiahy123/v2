/**
 * NOTIFICATION COMPONENT - Component hiển thị thông báo toast
 * MÔ TẢ: Toast notification với animation slide từ trên xuống
 * TÍNH NĂNG:
 * - 2 loại: success (xanh) và error (đỏ)
 * - Auto close sau duration (mặc định 3s)
 * - Manual close bằng button "Đóng"
 * - Smooth animation với Animated API
 * - Responsive design
 * - Modal overlay với shadow
 * SỬ DỤNG: Hiển thị feedback cho user actions (login, API calls, etc.)
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Dimensions } from 'react-native';

interface NotificationProps {
  visible: boolean;
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  autoClose?: boolean;
  duration?: number; 
}

const { width } = Dimensions.get('window'); 

const Notification: React.FC<NotificationProps> = ({
  visible,
  message,
  type,
  onClose,
  autoClose = true,
  duration = 3000, 
}) => {
  // ANIMATION VALUES - Giá trị cho animation (sử dụng useRef để stable)
  const translateAnim = useRef(new Animated.Value(-100)).current;  // Slide từ trên xuống
  const opacityAnim = useRef(new Animated.Value(0)).current;       // Fade in/out

  /**
   * ANIMATION EFFECT - Xử lý animation khi notification hiển thị
   * FLOW: Show -> Slide down + Fade in -> Auto close (nếu enabled)
   */
  useEffect(() => {
    if (visible) {
      // SHOW ANIMATION - Slide down và fade in đồng thời
      Animated.parallel([
        Animated.timing(translateAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // AUTO CLOSE - Tự động đóng sau duration
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [visible, autoClose, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * CLOSE HANDLER - Xử lý đóng notification với animation
   * FLOW: Slide up + Fade out -> Callback onClose
   */
  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateAnim, {
        toValue: -100,    // Slide lên trên
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,       // Fade out
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();          // Gọi callback sau khi animation hoàn thành
    });
  };

  /**
   * ICON HELPER - Trả về icon tương ứng với type
   */
  const getIcon = () => {
    return type === 'success' ? '✔' : '✘'; 
  };

  return (
    <Modal animationType="none" transparent={true} visible={visible} onRequestClose={handleClose}>
      <Animated.View
        style={[
          styles.overlay,
          { opacity: opacityAnim },
          { transform: [{ translateY: translateAnim }] }, 
        ]}
      >
        <Animated.View
          style={[
            styles.container,
            type === 'success' ? styles.success : styles.error,
            { transform: [{ translateY: translateAnim }] },
          ]}
        >
          <View style={styles.content}>
            <View
              style={[
                styles.iconContainer,
                type === 'success' ? styles.successIcon : styles.errorIcon,
              ]}
            >
              <Text style={styles.icon}>{getIcon()}</Text>
            </View>
            <Text style={styles.message} numberOfLines={2}>{message}</Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleClose} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Đóng</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 50,
    zIndex: 9999,
  },
  container: {
    width: Math.min(width - 40, 350),
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#1c1c1e',
    marginHorizontal: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  success: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  error: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  successIcon: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  errorIcon: {
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
  },
  icon: {
    fontSize: 18,
    color: '#ffffff',
  },
  message: {
    fontSize: 15,
    color: '#ffffff',
    flex: 1,
    lineHeight: 20,
  },
  button: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#D11030',
    borderRadius: 20,
  },
  buttonText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default Notification;
