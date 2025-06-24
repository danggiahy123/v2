import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { rentalService } from '../../services/rentalService';
import {
  RentalState,
  RentalInfo,
  CreateRentalRequest,
  CreateRentalResponse,
  RentalAccessResponse,
  RentalHistoryResponse,
} from '../../types/rental';

// Async thunks
export const createRental = createAsyncThunk(
  'rental/createRental',
  async (request: CreateRentalRequest, { rejectWithValue }) => {
    try {
      const response = await rentalService.createRentalOrder(request);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Lỗi tạo order');
    }
  }
);

export const confirmPayment = createAsyncThunk(
  'rental/confirmPayment',
  async ({ orderCode, userId }: { orderCode: string; userId: string }, { rejectWithValue }) => {
    try {
      const response = await rentalService.confirmRentalPayment({ orderCode, userId });
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Lỗi xác nhận thanh toán');
    }
  }
);

export const checkRentalAccess = createAsyncThunk(
  'rental/checkAccess',
  async ({ userId, movieId }: { userId: string; movieId: string }, { rejectWithValue }) => {
    try {
      const response = await rentalService.checkRentalAccess(userId, movieId);
      return { movieId, ...response };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Lỗi kiểm tra quyền xem');
    }
  }
);

export const fetchRentalHistory = createAsyncThunk(
  'rental/fetchHistory',
  async (
    {
      userId,
      page = 1,
      limit = 10,
      status,
      rentalType,
    }: {
      userId: string;
      page?: number;
      limit?: number;
      status?: 'active' | 'expired' | 'cancelled';
      rentalType?: '48h' | '30d';
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await rentalService.getRentalHistory(userId, {
        page,
        limit,
        status,
        rentalType,
      });
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Lỗi lấy lịch sử');
    }
  }
);

export const cancelRental = createAsyncThunk(
  'rental/cancelRental',
  async ({ rentalId, userId }: { rentalId: string; userId: string }, { rejectWithValue }) => {
    try {
      await rentalService.cancelRental(rentalId, { userId });
      return rentalId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Lỗi hủy rental');
    }
  }
);

const initialState: RentalState = {
  isLoading: false,
  error: null,
  currentRental: null,
  rentalHistory: [],
  rentalAccess: {},
};

const rentalSlice = createSlice({
  name: 'rental',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentRental: (state) => {
      state.currentRental = null;
    },
    updateRentalAccess: (state, action: PayloadAction<{ movieId: string; access: RentalAccessResponse['data'] }>) => {
      const { movieId, access } = action.payload;
      state.rentalAccess[movieId] = access;
    },
    clearRentalAccess: (state, action: PayloadAction<string>) => {
      const movieId = action.payload;
      delete state.rentalAccess[movieId];
    },
    setCurrentRental: (state, action: PayloadAction<RentalInfo>) => {
      state.currentRental = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Create Rental
    builder
      .addCase(createRental.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createRental.fulfilled, (state, action) => {
        state.isLoading = false;
        // Store order data for QR payment screen
      })
      .addCase(createRental.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Confirm Payment
    builder
      .addCase(confirmPayment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(confirmPayment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentRental = action.payload.data;
        // Add to history
        state.rentalHistory.unshift(action.payload.data);
      })
      .addCase(confirmPayment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Check Rental Access
    builder
      .addCase(checkRentalAccess.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkRentalAccess.fulfilled, (state, action) => {
        state.isLoading = false;
        const { movieId, data } = action.payload;
        state.rentalAccess[movieId] = data;
      })
      .addCase(checkRentalAccess.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Rental History
    builder
      .addCase(fetchRentalHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRentalHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        const { data } = action.payload;
        
        // If page 1, replace; otherwise append
        if (data.pagination.currentPage === 1) {
          state.rentalHistory = data.rentals;
        } else {
          state.rentalHistory.push(...data.rentals);
        }
      })
      .addCase(fetchRentalHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Cancel Rental
    builder
      .addCase(cancelRental.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelRental.fulfilled, (state, action) => {
        state.isLoading = false;
        const rentalId = action.payload;
        
        // Update rental in history
        const rentalIndex = state.rentalHistory.findIndex(r => r._id === rentalId);
        if (rentalIndex !== -1) {
          state.rentalHistory[rentalIndex].status = 'cancelled';
        }
        
        // Clear current rental if it was cancelled
        if (state.currentRental?._id === rentalId) {
          state.currentRental = null;
        }
        
        // Update access info
        const movieId = state.rentalHistory[rentalIndex]?.movieId._id;
        if (movieId && state.rentalAccess[movieId]) {
          state.rentalAccess[movieId].hasAccess = false;
          state.rentalAccess[movieId].message = 'Rental đã bị hủy';
        }
      })
      .addCase(cancelRental.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearCurrentRental,
  updateRentalAccess,
  clearRentalAccess,
  setCurrentRental,
} = rentalSlice.actions;

export default rentalSlice.reducer;

// Selectors
export const selectRentalState = (state: { rental: RentalState }) => state.rental;
export const selectRentalLoading = (state: { rental: RentalState }) => state.rental.isLoading;
export const selectRentalError = (state: { rental: RentalState }) => state.rental.error;
export const selectCurrentRental = (state: { rental: RentalState }) => state.rental.currentRental;
export const selectRentalHistory = (state: { rental: RentalState }) => state.rental.rentalHistory;
export const selectRentalAccess = (movieId: string) => (state: { rental: RentalState }) => 
  state.rental.rentalAccess[movieId];

// Helper selectors
export const selectActiveRentals = (state: { rental: RentalState }) =>
  state.rental.rentalHistory.filter(rental => rental.status === 'active');

export const selectExpiredRentals = (state: { rental: RentalState }) =>
  state.rental.rentalHistory.filter(rental => rental.status === 'expired');

export const selectHasAccessToMovie = (movieId: string) => (state: { rental: RentalState }) =>
  state.rental.rentalAccess[movieId]?.hasAccess || false; 