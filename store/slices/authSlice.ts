import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UpdateProfileRequest } from '../../types/auth';
import {
  AuthData,
  AuthState,
  CompleteRegistrationRequest,
  CompleteRegistrationResponse,
  SendOTPRequest,
  SendOTPResponse,
  VerifyOTPRequest,
  VerifyOTPResponse
} from '../../types/auth';
import { clearAuthData, getAuthData, saveAuthData } from '../../utils/storage';

const API_BASE_URL = 'https://backend-app-lou3.onrender.com';

const initialState: AuthState = {
  userId: null,
  user: null,
  phone: null,
  isLoggedIn: false,
  loading: false,
  error: null,
  message: null,
};

// Async thunk for saving auth data - separate from login logic
export const saveAuthDataThunk = createAsyncThunk(
  'auth/saveAuthData',
  async (authData: AuthData, { rejectWithValue }) => {
    try {
      await saveAuthData(authData);
      return authData;
    } catch (error) {
      return rejectWithValue('Failed to save auth data');
    }
  }
);

// Async thunk for sending OTP
export const sendOTP = createAsyncThunk(
  'auth/sendOTP',
  async (phone: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone } as SendOTPRequest),
      });
      
      if (!response.ok) {
        throw new Error('Không gửi được OTP');
      }
      
      const data: SendOTPResponse = await response.json();
      return { phone, ...data };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// Async thunk for verifying OTP
export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async ({ phone, otp }: VerifyOTPRequest, { rejectWithValue, dispatch }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, otp }),
      });
      
      if (!response.ok) {
        throw new Error('Không gửi được OTP');
      }
      
      const data: VerifyOTPResponse = await response.json();
      
      // If user already exists, save auth data separately
      if (!data.data.needsRegistration && data.data.userId && data.data.user) {
        const authData: AuthData = {
          userId: data.data.userId,
          user: data.data.user
        };
        
        // Dispatch save auth data as separate action
        dispatch(saveAuthDataThunk(authData)).unwrap();
      }
      
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// Async thunk for completing registration
export const completeRegistration = createAsyncThunk(
  'auth/completeRegistration',
  async (
    registrationData: CompleteRegistrationRequest,
    { rejectWithValue, dispatch }
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/complete-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });
      
      if (!response.ok) {
        throw new Error('Không thể hoàn tất đăng ký');
      }
      
      const data: CompleteRegistrationResponse = await response.json();
      
      // Save auth data after successful registration separately
      if (data.data.userId && data.data.user) {
        const authData: AuthData = {
          userId: data.data.userId,
          user: data.data.user
        };
        
        // Dispatch save auth data as separate action
        dispatch(saveAuthDataThunk(authData)).unwrap();
      }
      
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// Async thunk for restoring auth state
export const restoreAuthState = createAsyncThunk(
  'auth/restoreAuthState',
  async (_, { rejectWithValue }) => {
    try {
      const authData = await getAuthData();
      return authData;
    } catch (error) {
      return rejectWithValue('Không khôi phục được trạng thái xác thực');
    }
  }
);

// Async thunk for logout
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await clearAuthData();
      console.log('🚪 User logged out successfully');
      return true;
    } catch (error) {
      return rejectWithValue('Không thể đăng xuất');
    }
  }
);

// Async thunk for getting user profile
export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/profile?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Không lấy được hồ sơ');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// Async thunk for updating user profile
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async ({ userId, profileData }: { userId: string; profileData: UpdateProfileRequest }, { rejectWithValue, dispatch }) => {
    try {
      console.log('🔄 updateProfile called with:', { userId, profileData });
      
      const formData = new FormData();
      
      // Add text fields
      if (profileData.full_name) {
        formData.append('full_name', profileData.full_name);
        console.log('📝 Added full_name:', profileData.full_name);
      }
      if (profileData.gender) {
        formData.append('gender', profileData.gender);
        console.log('📝 Added gender:', profileData.gender);
      }
      
      // Add avatar if present
      if (profileData.avatar) {
        formData.append('avatar', profileData.avatar);
        console.log('📸 Added avatar:', profileData.avatar);
      }

      const url = `${API_BASE_URL}/api/users/profile?userId=${userId}`;
      console.log('🌐 Making request to:', url);

      const response = await fetch(url, {
        method: 'PUT',
        body: formData, 
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Failed to update profile: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Response data:', data);
      
      if (data.data.user) {
        const authData = {
          userId,
          user: data.data.user
        };
        dispatch(saveAuthDataThunk(authData)).unwrap();
      }
      
      return data;
    } catch (error) {
      console.error('❌ updateProfile error:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setPhone(state, action: PayloadAction<string>) {
      state.phone = action.payload;
      state.error = null;
      state.message = null;
    },
    clearError(state) {
      state.error = null;
    },
    clearMessage(state) {
      state.message = null;
    },

    loginSuccess(state, action: PayloadAction<AuthData>) {
      state.userId = action.payload.userId;
      state.user = action.payload.user;
      state.phone = action.payload.user.phone;
      state.isLoggedIn = true;
    },
  },
  extraReducers: (builder) => {
    // Save Auth Data - separate thunk
    builder
      .addCase(saveAuthDataThunk.pending, (state) => {
        // Don't show loading for this background operation
      })
      .addCase(saveAuthDataThunk.fulfilled, (state, action) => {
        // After saving to storage, update login state
        state.userId = action.payload.userId;
        state.user = action.payload.user;
        state.phone = action.payload.user.phone;
        state.isLoggedIn = true;
        console.log('✅ Auth data saved and login state updated');
      })
      .addCase(saveAuthDataThunk.rejected, (state, action) => {
        state.error = action.payload as string;
        console.error('❌ Failed to save auth data:', action.payload);
      });

    // Send OTP
    builder
      .addCase(sendOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(sendOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.phone = action.payload.phone;
        state.message = action.payload.message || 'OTP sent successfully';
      })
      .addCase(sendOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Verify OTP
    builder
      .addCase(verifyOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message || 'OTP verified successfully';
        
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(completeRegistration.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(completeRegistration.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message || 'Registration completed successfully';
        

      })
      .addCase(completeRegistration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Restore Auth State
    builder
      .addCase(restoreAuthState.pending, (state) => {
        state.loading = true;
      })
      .addCase(restoreAuthState.fulfilled, (state, action) => {
        state.loading = false;
        
        if (action.payload) {
          state.userId = action.payload.userId;
          state.user = action.payload.user;
          state.phone = action.payload.user.phone;
          state.isLoggedIn = true;
        }
      })
      .addCase(restoreAuthState.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.userId = null;
        state.user = null;
        state.phone = null;
        state.isLoggedIn = false;
        state.error = null;
        state.message = 'Đăng xuất thành công';
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Get Profile
    builder
      .addCase(getProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message || 'Cập nhật hồ sơ thành công';
        // Update user data if available
        if (action.payload.data?.user) {
          state.user = action.payload.data.user;
        }
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update Profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message || 'Cập nhật hồ sơ thành công';
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setPhone, clearError, clearMessage, loginSuccess } = authSlice.actions;
export default authSlice.reducer;
