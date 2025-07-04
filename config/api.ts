// API Configuration for development and production

// Development configuration
const LOCAL_IP = '192.168.5.146'; // Metro IP address
const LOCAL_PORT = 3003;
const LOCAL_BASE_URL = `http://${LOCAL_IP}:${LOCAL_PORT}`;

// Production configuration  
const PROD_BASE_URL = 'https://backend-app-lou3.onrender.com';

// Auto-detect environment
const IS_DEV = __DEV__;

// Export configuration
export const API_CONFIG = {
  BASE_URL: IS_DEV ? LOCAL_BASE_URL : PROD_BASE_URL,
  IS_DEVELOPMENT: IS_DEV,
  LOCAL_IP,
  LOCAL_PORT,
  ENDPOINTS: {
    // Auth endpoints
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    OTP: '/api/auth/otp',
    
    // Movie endpoints
    MOVIES: '/api/movies',
    MOVIE_DETAIL: (id: string) => `/api/movies/${id}`,
    MOVIE_SHARE: (id: string) => `/api/movies/share/${id}`,
    MOVIE_PREVIEW: (id: string) => `/movie/${id}`,
    
    // Series endpoints
    SERIES: '/api/series',
    ANIME: '/api/anime',
    
    // User endpoints
    USERS: '/api/users',
    FAVORITES: '/api/favorites',
    RENTALS: '/api/rentals',
    
    // Home endpoints
    HOME: '/api/home',
  }
};

// Helper functions
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

export const getShareUrl = (movieId: string): string => {
  return `${API_CONFIG.BASE_URL}/movie/${movieId}`;
};

export const getDeepLinkUrl = (movieId: string): string => {
  return `tech5://movie/${movieId}`;
};

// Log current configuration
console.log('🔧 [API Config] Environment:', {
  isDev: IS_DEV,
  baseUrl: API_CONFIG.BASE_URL,
  localIP: LOCAL_IP,
  localPort: LOCAL_PORT
}); 