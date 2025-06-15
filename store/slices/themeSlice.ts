import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ColorSchemeName } from 'react-native';

interface ThemeState {
  colorScheme: ColorSchemeName;
}

const initialState: ThemeState = {
  colorScheme: 'light'
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setColorScheme: (state, action: PayloadAction<ColorSchemeName>) => {
      state.colorScheme = action.payload;
    }
  }
});

export const { setColorScheme } = themeSlice.actions;

export default themeSlice.reducer; 