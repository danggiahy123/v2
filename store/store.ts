/**
 * REDUX STORE CONFIGURATION - Cấu hình Redux store chính
 * MÔ TẢ: Setup Redux Toolkit store với tất cả slices
 * SLICES:
 * - auth: Authentication state management
 * - movies: Movie data và UI state
 * - theme: Theme và UI preferences
 * - rental: Rental system state management
 * EXPORTS: RootState và AppDispatch types cho TypeScript
 */
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import movieReducer from './slices/movieSlice';
import themeReducer from './slices/themeSlice';
import rentalReducer from './slices/rentalSlice';

// Configure Redux store với tất cả reducers
export const store = configureStore({
  reducer: {
    auth: authReducer,        // Authentication slice
    movies: movieReducer,     // Movies slice
    theme: themeReducer,      // Theme slice
    rental: rentalReducer,    // Rental slice
  },
});

// TypeScript types cho store
export type RootState = ReturnType<typeof store.getState>;    // Root state type
export type AppDispatch = typeof store.dispatch;             // Dispatch type 