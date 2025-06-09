// Authentication related types and interfaces

export interface User {
  _id: string;
  uid: string;
  full_name: string;
  email: string;
  phone: string;
  gender: string;
  avatar: string;
  is_phone_verified: boolean;
}

export interface AuthData {
  userId: string;
  user: User;
}

export interface AuthState {
  userId: string | null;
  user: User | null;
  phone: string | null;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
  message: string | null; // For API response messages
}

// API Response types
export interface SendOTPResponse {
  status: string;
  message: string;
  data: {
    phone: string;
    isExistingUser: boolean;
  };
}

export interface VerifyOTPResponse {
  status: string;
  message: string;
  data: {
    needsRegistration: boolean;
    userId?: string;
    user?: User;
  };
}

export interface CompleteRegistrationResponse {
  status: string;
  message: string;
  data: {
    userId: string;
    user: User;
  };
}

// Request types
export interface SendOTPRequest {
  phone: string;
}

export interface VerifyOTPRequest {
  phone: string;
  otp: string;
}

export interface CompleteRegistrationRequest {
  full_name: string;
  email: string;
  gender: 'male' | 'female';
}

// Profile API types
export interface GetProfileResponse {
  status: string;
  message: string;
  data: {
    user: User;
  };
}

export interface UpdateProfileRequest {
  full_name?: string;
  gender?: 'male' | 'female' | 'other';
  avatar?: any; // File object for multipart upload
}

export interface UpdateProfileResponse {
  status: string;
  message: string;
  data: {
    user: User;
  };
} 