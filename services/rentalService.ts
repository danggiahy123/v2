import { Linking } from 'react-native';
import { API_CONFIG } from '../config/api';
import {
  CreateRentalRequest,
  CreateRentalResponse,
  ConfirmPaymentRequest,
  ConfirmPaymentResponse,
  RentalAccessResponse,
  RentalHistoryResponse,
  CancelRentalRequest,
  RentalInfo,
  RentalPricingCalculation,
  RentalTimeFormatting,
  RENTAL_TYPES,
} from '../types/rental';

class RentalService {
  private baseURL = `${API_CONFIG.BASE_URL}/api/rentals`;

  /**
   * 🎬 Tạo order thuê phim
   */
  async createRentalOrder(request: CreateRentalRequest): Promise<CreateRentalResponse> {
    try {
      const response = await fetch(`${this.baseURL}/rent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể tạo order thuê phim');
      }

      return data;
    } catch (error) {
      console.error('Error creating rental order:', error);
      throw error;
    }
  }

  /**
   * 🔐 Xác nhận thanh toán
   */
  async confirmRentalPayment(request: ConfirmPaymentRequest): Promise<ConfirmPaymentResponse> {
    try {
      const response = await fetch(`${this.baseURL}/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể xác nhận thanh toán');
      }

      return data;
    } catch (error) {
      console.error('Error confirming rental payment:', error);
      throw error;
    }
  }

  /**
   * 📱 Kiểm tra quyền xem phim
   */
  async checkRentalAccess(userId: string, movieId: string): Promise<RentalAccessResponse> {
    try {
      const response = await fetch(
        `${this.baseURL}/status/${movieId}?userId=${userId}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể kiểm tra quyền xem');
      }

      return data;
    } catch (error) {
      console.error('Error checking rental access:', error);
      throw error;
    }
  }

  /**
   * 📜 Lấy lịch sử thuê phim
   */
  async getRentalHistory(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: 'active' | 'expired' | 'cancelled';
      rentalType?: '48h' | '30d';
    } = {}
  ): Promise<RentalHistoryResponse> {
    try {
      const params = new URLSearchParams({
        userId,
        page: (options.page || 1).toString(),
        limit: (options.limit || 10).toString(),
        ...(options.status && { status: options.status }),
        ...(options.rentalType && { rentalType: options.rentalType }),
      });

      const response = await fetch(`${this.baseURL}/history?${params}`);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể lấy lịch sử thuê phim');
      }

      return data;
    } catch (error) {
      console.error('Error getting rental history:', error);
      throw error;
    }
  }

  /**
   * ❌ Hủy rental
   */
  async cancelRental(rentalId: string, request: CancelRentalRequest): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/${rentalId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể hủy rental');
      }
    } catch (error) {
      console.error('Error cancelling rental:', error);
      throw error;
    }
  }

  /**
   * 🌐 Mở PayOS checkout
   */
  async openPayOSCheckout(checkoutUrl: string): Promise<void> {
    try {
      const supported = await Linking.canOpenURL(checkoutUrl);

      if (supported) {
        await Linking.openURL(checkoutUrl);
      } else {
        throw new Error('Không thể mở trang thanh toán');
      }
    } catch (error) {
      console.error('Error opening PayOS checkout:', error);
      throw error;
    }
  }

  /**
   * 💰 Tính giá thuê dựa trên giá phim
   */
  calculateRentalPricing(moviePrice: number): RentalPricingCalculation {
    const rentalPrice48h = Math.round(moviePrice * RENTAL_TYPES['48h'].multiplier);
    const rentalPrice30d = Math.round(moviePrice * RENTAL_TYPES['30d'].multiplier);

    return {
      originalPrice: moviePrice,
      rentalPrice48h,
      rentalPrice30d,
      discount48h: Math.round(((moviePrice - rentalPrice48h) / moviePrice) * 100),
      discount30d: Math.round(((moviePrice - rentalPrice30d) / moviePrice) * 100),
    };
  }

  /**
   * ⏰ Format thời gian còn lại
   */
  formatRemainingTime(remainingTime: number): RentalTimeFormatting {
    const hours = Math.floor(remainingTime / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    let formatted: string;
    if (days > 0) {
      formatted = `${days} ngày ${remainingHours} giờ`;
    } else if (hours > 0) {
      formatted = `${hours} giờ`;
    } else {
      const minutes = Math.floor(remainingTime / (1000 * 60));
      formatted = minutes > 0 ? `${minutes} phút` : 'Sắp hết hạn';
    }

    return {
      remainingMs: remainingTime,
      hours,
      days,
      formatted,
      isExpiring: hours < 24, // < 24h
      isNearExpiry: hours < 2, // < 2h
    };
  }

  /**
   * 💲 Format giá tiền VNĐ
   */
  formatPrice(price: number): string {
    if (price === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  }

  /**
   * 📊 Kiểm tra rental có thể hủy không (trong vòng 24h)
   */
  canCancelRental(rental: RentalInfo): boolean {
    const startTime = new Date(rental.startTime).getTime();
    const now = Date.now();
    const timeSinceStart = now - startTime;
    const twentyFourHours = 24 * 60 * 60 * 1000;

    return (
      rental.status === 'active' &&
      timeSinceStart < twentyFourHours
    );
  }

  /**
   * 🔍 Validate rental request
   */
  validateRentalRequest(request: CreateRentalRequest): string[] {
    const errors: string[] = [];

    if (!request.userId || request.userId.trim() === '') {
      errors.push('User ID là bắt buộc');
    }

    if (!request.movieId || request.movieId.trim() === '') {
      errors.push('Movie ID là bắt buộc');
    }

    if (!request.rentalType || !['48h', '30d'].includes(request.rentalType)) {
      errors.push('Loại thuê phải là 48h hoặc 30d');
    }

    return errors;
  }

  /**
   * 🎯 Lấy rental options cho một phim
   */
  getRentalOptions(moviePrice: number, isFree: boolean = false): Array<{
    type: '48h' | '30d';
    price: number;
    originalPrice: number;
    discount: number;
    label: string;
    description: string;
    duration: string;
  }> {
    if (isFree) return [];

    const pricing = this.calculateRentalPricing(moviePrice);

    return [
      {
        type: '48h',
        price: pricing.rentalPrice48h,
        originalPrice: moviePrice,
        discount: pricing.discount48h,
        label: RENTAL_TYPES['48h'].label,
        description: RENTAL_TYPES['48h'].description,
        duration: '48 giờ',
      },
      {
        type: '30d',
        price: pricing.rentalPrice30d,
        originalPrice: moviePrice,
        discount: pricing.discount30d,
        label: RENTAL_TYPES['30d'].label,
        description: RENTAL_TYPES['30d'].description,
        duration: '30 ngày',
      },
    ];
  }

  /**
   * 🔄 Check payment status từ backend
   */
  async checkPaymentStatus(orderCode: string, userId: string): Promise<boolean> {
    try {
      // Gọi endpoint riêng để check status thay vì confirm payment
      const response = await fetch(`${this.baseURL}/check-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderCode, userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Nếu là lỗi "chưa thanh toán", return false
        if (data.message && (
          data.message.includes('chưa được thanh toán') || 
          data.message.includes('chưa thanh toán') ||
          data.message.includes('PENDING')
        )) {
          return false;
        }
        throw new Error(data.message || 'Lỗi khi kiểm tra trạng thái thanh toán');
      }

      return data.success && data.data?.isPaid === true;
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      // Nếu là network error hoặc lỗi thanh toán, return false thay vì throw
      if (errorMessage.includes('Network request failed') ||
          errorMessage.includes('chưa được thanh toán') || 
          errorMessage.includes('chưa thanh toán') ||
          errorMessage.includes('PENDING')) {
        return false;
      }
      
      // Các lỗi khác thì log và return false để tiếp tục check
      console.warn('Payment status check error:', errorMessage);
      return false;
    }
  }

  /**
   * 📱 Deep link handlers
   */
  parsePaymentReturnUrl(url: string): { orderCode?: string; status?: string } {
    try {
      const urlObj = new URL(url);
      const orderCode = urlObj.searchParams.get('orderCode');
      const status = urlObj.searchParams.get('status');

      return { orderCode: orderCode || undefined, status: status || undefined };
    } catch (error) {
      console.error('Error parsing payment return URL:', error);
      return {};
    }
  }

  /**
   * 🎬 Lấy thông tin rental cho movie detail screen
   */
  async getRentalStatusForMovie(userId: string, movieId: string): Promise<{
    hasAccess: boolean;
    rental: RentalInfo | null;
    timeInfo: RentalTimeFormatting | null;
    canWatch: boolean;
  }> {
    try {
      const response = await this.checkRentalAccess(userId, movieId);
      const data = response.data;

      let timeInfo: RentalTimeFormatting | null = null;
      if (data.remainingTime) {
        timeInfo = this.formatRemainingTime(data.remainingTime);
      }

      return {
        hasAccess: data.hasAccess,
        rental: data.rental || null,
        timeInfo,
        canWatch: Boolean(data.hasAccess && timeInfo && !timeInfo.isNearExpiry),
      };
    } catch (error) {
      console.error('Error getting rental status for movie:', error);
      return {
        hasAccess: false,
        rental: null,
        timeInfo: null,
        canWatch: false,
      };
    }
  }
}

export const rentalService = new RentalService(); 