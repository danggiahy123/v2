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
          <View
            style={[
              styles.iconContainer,
              type === 'success' ? styles.successIcon : styles.errorIcon,
            ]}
          >
            <Text style={styles.icon}>{getIcon()}</Text>
          </View>
          <Text style={styles.message}>{message}</Text>
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#1c1c1e', 
    flexDirection: 'row',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  success: {
    borderWidth: 1,
  },
  error: {
    borderWidth: 1,
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#444',
  },
  successIcon: {
    backgroundColor: '#4CAF50', 
  },
  errorIcon: {
    backgroundColor: '#F44336',
  },
  icon: {
    fontSize: 20,
    color: '#ffffff',
  },
  message: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'left',
    marginRight: 10,
    flex: 1,
    lineHeight: 22,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#D11030',
    borderRadius: 25,
    marginLeft: 12,
  },
  buttonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default Notification;
