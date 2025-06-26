// ====================================
// RENTAL SYSTEM TYPES
// ====================================

export interface RentalOption {
  type: '48h' | '30d';
  price: number;
  description: string;
  discount: string;
}

// === API REQUEST TYPES ===
export interface CreateRentalRequest {
  userId: string;
  movieId: string;
  rentalType: '48h' | '30d';
}

export interface ConfirmPaymentRequest {
  orderCode: string;
  userId: string;
}

export interface CancelRentalRequest {
  userId: string;
}

// === API RESPONSE TYPES ===
export interface CreateRentalResponse {
  success: boolean;
  message: string;
  data: {
    orderCode: string;
    checkoutUrl: string;
    amount: number;
    rentalType: string;
    movieTitle: string;
    qrCode: string;
    paymentInfo: {
      bin: string;
      accountNumber: string;
      accountName: string;
    };
  };
}

export interface ConfirmPaymentResponse {
  success: boolean;
  message: string;
  data: RentalInfo;
}

export interface RentalAccessResponse {
  success: boolean;
  data: {
    hasAccess: boolean;
    rental?: RentalInfo;
    remainingTime?: number;
    remainingHours?: number;
    remainingDays?: number;
    message: string;
  };
}

export interface RentalHistoryResponse {
  success: boolean;
  message: string;
  data: {
    rentals: RentalInfo[];
    pagination: {
      currentPage: number;
      totalPages: number;
      total: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

// === CORE DATA TYPES ===
export interface RentalInfo {
  _id: string;
  userId: string;
  movieId: {
    _id: string;
    title: string;
    poster: string;
    duration: number;
  };
  paymentId: {
    _id: string;
    amount: number;
    orderCode: string;
  };
  rentalType: '48h' | '30d';
  status: 'active' | 'expired' | 'cancelled';
  startTime: string;
  endTime: string;
  accessCount: number;
  lastAccess?: string;
  createdAt: string;
  updatedAt: string;
}

// === COMPONENT PROPS TYPES ===
export interface RentalOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  movie: {
    _id: string;
    title: string;
    price: number;
    poster?: string;
    is_free?: boolean;
  };
  userId: string;
  onRentalSuccess?: (rental: RentalInfo) => void;
}

export interface QRPaymentScreenProps {
  route: {
    params: {
      orderData: CreateRentalResponse['data'];
      userId: string;
      movieId: string;
    };
  };
  navigation: any;
}

export interface RentalStatusBannerProps {
  movieId: string;
  userId: string;
  onRentalExpired?: () => void;
}

export interface RentalHistoryItemProps {
  rental: RentalInfo;
  onPress: () => void;
  onCancel?: (rentalId: string) => void;
}

// === UI STATE TYPES ===
export interface RentalState {
  isLoading: boolean;
  error: string | null;
  currentRental: RentalInfo | null;
  rentalHistory: RentalInfo[];
  rentalAccess: { [movieId: string]: RentalAccessResponse['data'] };
}

export interface PaymentState {
  isCreating: boolean;
  isConfirming: boolean;
  isChecking: boolean;
  orderData: CreateRentalResponse['data'] | null;
  countdown: number;
  status: 'pending' | 'checking' | 'success' | 'failed' | 'cancelled';
}

// === HOOK TYPES ===
export interface UseRentalStatusResult {
  hasAccess: boolean;
  rental: RentalInfo | null;
  remainingTime: number | null;
  remainingHours: number | null;
  remainingDays: number | null;
  isLoading: boolean;
  error: string | null;
  checkAccess: () => Promise<void>;
  forceRefresh: () => void;
  message: string;
}

export interface UsePaymentStatusResult {
  status: PaymentState['status'];
  countdown: number;
  isChecking: boolean;
  startChecking: (orderCode: string, userId: string) => void;
  stopChecking: () => void;
  resetStatus: () => void;
}

export interface UseRentalHistoryResult {
  rentals: RentalInfo[];
  pagination: RentalHistoryResponse['data']['pagination'];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  loadRentals: (page?: number) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

// === UTILITY TYPES ===
export interface RentalPricingCalculation {
  originalPrice: number;
  rentalPrice48h: number;
  rentalPrice30d: number;
  discount48h: number;
  discount30d: number;
}

export interface RentalTimeFormatting {
  remainingMs: number;
  hours: number;
  days: number;
  formatted: string;
  isExpiring: boolean; // < 24h
  isNearExpiry: boolean; // < 2h
}

// === NAVIGATION TYPES ===
export interface RentalNavigationParams {
  QRPayment: {
    orderData: CreateRentalResponse['data'];
    userId: string;
    movieId: string;
  };
  PaymentSuccess: {
    rental: RentalInfo;
  };
  PaymentFailed: {
    error: string;
    orderCode?: string;
  };
  RentalHistory: {
    userId: string;
  };
}

// === STATISTICS TYPES (Admin) ===
export interface RevenueStatsResponse {
  success: boolean;
  message: string;
  data: {
    summary: {
      totalRevenue: number;
      totalRentals: number;
      averageRevenuePerRental: number;
    };
    dailyStats: Array<{
      date: string;
      revenue: number;
      rentals: number;
      rentalTypes: {
        '48h': number;
        '30d': number;
      };
    }>;
  };
}

export interface PopularRentalsResponse {
  success: boolean;
  message: string;
  data: Array<{
    movieId: string;
    title: string;
    poster: string;
    totalRentals: number;
    revenue: number;
    rentalTypes: {
      '48h': number;
      '30d': number;
    };
  }>;
}

// === ERROR TYPES ===
export interface RentalError {
  code: string;
  message: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
}

// === CONSTANTS ===
export const RENTAL_TYPES = {
  '48h': {
    label: 'Thuê 48 giờ',
    multiplier: 0.3,
    description: '30% giá phim',
    duration: 48 * 60 * 60 * 1000, // 48h in ms
  },
  '30d': {
    label: 'Thuê 30 ngày',
    multiplier: 0.5,
    description: '50% giá phim',
    duration: 30 * 24 * 60 * 60 * 1000, // 30d in ms
  },
} as const;

export const RENTAL_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  CHECKING: 'checking',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const; 