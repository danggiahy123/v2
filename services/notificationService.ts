export interface NotificationItem {
  id: string;
  type: 'movie' | 'system' | 'payment' | 'reminder' | 'update';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  imageUrl?: string;
  actionType?: 'movie' | 'payment' | 'settings' | 'update';
  actionData?: any;
}

class NotificationService {
  private notifications: NotificationItem[] = [];
  private unreadCount: number = 0;
  private listeners: ((count: number) => void)[] = [];

  // Sample data
  private sampleNotifications: NotificationItem[] = [
    {
      id: '1',
      type: 'movie',
      title: '🎬 Phim mới "Spider-Man: No Way Home"',
      message: 'Bộ phim bom tấn vừa được cập nhật! Xem ngay để không bỏ lỡ những khoảnh khắc hành động đỉnh cao.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
      isRead: false,
      imageUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=300',
      actionType: 'movie',
      actionData: { movieId: '123' }
    },
    {
      id: '2',
      type: 'payment',
      title: '💳 Thanh toán thành công',
      message: 'Bạn đã thanh toán thành công gói Premium tháng. Enjoy unlimited streaming!',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 mins ago
      isRead: false,
      actionType: 'payment'
    },
    {
      id: '3',
      type: 'reminder',
      title: '⏰ Nhắc nhở xem phim',
      message: '"The Witcher S3" mà bạn đã thêm vào danh sách sẽ ra mắt vào 20:00 hôm nay.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      isRead: true,
      imageUrl: 'https://images.unsplash.com/photo-1594736797933-d0401ba1f6d6?w=300',
      actionType: 'movie',
      actionData: { movieId: '456' }
    },
    {
      id: '4',
      type: 'system',
      title: '🎯 Đề xuất cho bạn',
      message: 'Dựa trên lịch sử xem của bạn, chúng tôi nghĩ bạn sẽ thích "Stranger Things 4".',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
      isRead: true,
      imageUrl: 'https://images.unsplash.com/photo-1489599110399-b161b1555b25?w=300',
      actionType: 'movie',
      actionData: { movieId: '789' }
    },
    {
      id: '5',
      type: 'update',
      title: '🚀 Cập nhật ứng dụng',
      message: 'Phiên bản 2.1.0 đã có sẵn với giao diện mới và tính năng download offline.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      isRead: false,
      actionType: 'update'
    }
  ];

  constructor() {
    this.notifications = [...this.sampleNotifications];
    this.updateUnreadCount();
  }

  private updateUnreadCount() {
    this.unreadCount = this.notifications.filter(n => !n.isRead).length;
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.unreadCount));
  }

  // Public methods
  getNotifications(): NotificationItem[] {
    return [...this.notifications];
  }

  getUnreadCount(): number {
    return this.unreadCount;
  }

  subscribeToUnreadCount(callback: (count: number) => void): () => void {
    this.listeners.push(callback);
    callback(this.unreadCount); // Call immediately with current count
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.isRead) {
      notification.isRead = true;
      this.updateUnreadCount();
    }
  }

  markAllAsRead() {
    let hasChanges = false;
    this.notifications.forEach(notification => {
      if (!notification.isRead) {
        notification.isRead = true;
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      this.updateUnreadCount();
    }
  }

  addNotification(notification: Omit<NotificationItem, 'id' | 'timestamp'>) {
    const newNotification: NotificationItem = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    
    this.notifications.unshift(newNotification);
    this.updateUnreadCount();
  }

  // Simulate receiving new notifications
  simulateNewNotification() {
    const types: NotificationItem['type'][] = ['movie', 'system', 'payment', 'reminder'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    const samples = {
      movie: {
        title: '🎬 Phim mới cập nhật',
        message: 'Có phim mới hot vừa được thêm vào! Xem ngay.',
        actionType: 'movie' as const
      },
      payment: {
        title: '💳 Giao dịch hoàn tất',
        message: 'Thanh toán của bạn đã được xử lý thành công.',
        actionType: 'payment' as const
      },
      system: {
        title: '🔔 Thông báo hệ thống',
        message: 'Hệ thống đã được cập nhật với những tính năng mới.',
        actionType: 'settings' as const
      },
      reminder: {
        title: '⏰ Nhắc nhở',
        message: 'Đừng quên xem phim yêu thích của bạn!',
        actionType: 'movie' as const
      },
      update: {
        title: '🚀 Cập nhật mới',
        message: 'Ứng dụng có bản cập nhật mới với nhiều tính năng thú vị.',
        actionType: 'update' as const
      }
    };

    this.addNotification({
      type: randomType,
      ...samples[randomType],
      isRead: false
    });
  }
}

export const notificationService = new NotificationService(); 