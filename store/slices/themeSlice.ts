/**
 * THEME SLICE - Redux slice quản lý theme/appearance
 * MÔ TẢ: Quản lý color scheme và theme preferences
 * TÍNH NĂNG:
 * - Light/Dark mode switching
 * - Color scheme persistence
 * - Theme state management
 * SỬ DỤNG: Cho theme switching và styled components
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ColorSchemeName } from 'react-native';

/**
 * THEME STATE - Redux state cho theme
 */
interface ThemeState {
  colorScheme: ColorSchemeName;     // 'light' | 'dark' | null
}

// Initial state - mặc định light mode
const initialState: ThemeState = {
  colorScheme: 'light'
};

/**
 * THEME SLICE - Redux slice definition
 */
export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    /**
     * SET COLOR SCHEME - Thay đổi color scheme
     * @param action.payload - 'light' | 'dark' | null
     */
    setColorScheme: (state, action: PayloadAction<ColorSchemeName>) => {
      state.colorScheme = action.payload;
    }
  }
});

// Export actions
export const { setColorScheme } = themeSlice.actions;

// Export reducer
export default themeSlice.reducer; 