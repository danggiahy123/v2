/**
 * AUTHENTICATION TYPES - Định nghĩa types cho authentication system
 * MÔ TẢ: Chứa tất cả interfaces và types liên quan đến auth
 * BAO GỒM:
 * - User model và auth state
 * - API request/response types
 * - Redux state management types
 * SỬ DỤNG: Import vào các file cần type safety cho auth
 */

/**
 * USER MODEL - Thông tin user từ database
 */
export interface User {
  _id: string;                    // MongoDB ObjectId
  uid: string;                    // Unique identifier
  full_name: string;              // Họ và tên
  email: string;                  // Email address
  phone: string;                  // Số điện thoại
  gender: string;                 // Giới tính (male/female/other)
  avatar: string;                 // URL avatar image
  is_phone_verified: boolean;     // Trạng thái xác thực phone
}

/**
 * AUTH DATA - Dữ liệu auth được lưu trong AsyncStorage
 */
export interface AuthData {
  userId: string;                 // User ID
  user: User;                     // User object
}

/**
 * AUTH STATE - Redux state cho authentication
 */
export interface AuthState {
  userId: string | null;          // Current user ID
  user: User | null;              // Current user data
  phone: string | null;           // Phone number đang xử lý
  isLoggedIn: boolean;            // Login status
  loading: boolean;               // Loading state cho API calls
  error: string | null;           // Error message
  message: string | null;         // Success message từ API
}

/**
 * API RESPONSE TYPES - Định nghĩa response từ backend APIs
 */

// Response khi gửi OTP
export interface SendOTPResponse {
  status: string;                 // API status
  message: string;                // Response message
  data: {
    phone: string;                // Phone number đã gửi OTP
    isExistingUser: boolean;      // User đã tồn tại hay chưa
  };
}

// Response khi verify OTP
export interface VerifyOTPResponse {
  status: string;                 // API status
  message: string;                // Response message
  data: {
    needsRegistration: boolean;   // Cần đăng ký thông tin thêm không
    userId?: string;              // User ID (nếu đã có account)
    user?: User;                  // User data (nếu đã có account)
  };
}

// Response khi hoàn thành đăng ký
export interface CompleteRegistrationResponse {
  status: string;                 // API status
  message: string;                // Response message
  data: {
    userId: string;               // User ID mới tạo
    user: User;                   // User data mới tạo
  };
}

/**
 * API REQUEST TYPES - Định nghĩa request payload gửi lên backend
 */

// Request gửi OTP
export interface SendOTPRequest {
  phone: string;                  // Số điện thoại cần gửi OTP
}

// Request verify OTP
export interface VerifyOTPRequest {
  phone: string;                  // Số điện thoại
  otp: string;                    // Mã OTP nhập vào
}

// Request hoàn thành đăng ký (cho user mới)
export interface CompleteRegistrationRequest {
  full_name: string;              // Họ và tên
  email: string;                  // Email address
  gender: 'male' | 'female';      // Giới tính
}

/**
 * PROFILE API TYPES - Types cho profile management
 */

// Response khi get profile
export interface GetProfileResponse {
  status: string;                 // API status
  message: string;                // Response message
  data: {
    user: User;                   // User data
  };
}

// Request update profile
export interface UpdateProfileRequest {
  full_name?: string;             // Họ và tên (optional)
  gender?: 'male' | 'female' | 'other';  // Giới tính (optional)
  avatar?: any;                   // File object cho multipart upload (optional)
}

// Response khi update profile
export interface UpdateProfileResponse {
  status: string;                 // API status
  message: string;                // Response message
  data: {
    user: User;                   // User data đã update
  };
} 