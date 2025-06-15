import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { movieService } from '../../services/movieService';

export interface Episode {
  episode_title: string;
  episode_number: number;
  uri: string | null;
}

export interface Movie {
  _id: string;
  movie_title: string;
  description: string;
  production_time: string;
  producer: string;
  movie_type: string;
  price: number;
  is_free: boolean;
  price_display: string;
  genres: Array<{ name: string }>;
  episodes?: Episode[];
  total_episodes?: number;
  uri?: string | null;
  episode_description?: string;
  poster?: string;
  image?: string;
}

export interface MovieState {
  loading: boolean;
  error: string | null;
}

const initialState: MovieState = {
  loading: false,
  error: null,
};

// ✅ Slice quản lý state
const movieSlice = createSlice({
  name: 'movies',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Add other reducers here if needed
  },
});

export default movieSlice.reducer;
