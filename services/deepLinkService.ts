import * as Linking from 'expo-linking';
import { API_CONFIG, getShareUrl, getDeepLinkUrl } from '../config/api';

export interface DeepLinkData {
  movieId?: string;
  screen?: string;
  params?: Record<string, any>;
}

export interface DeepLinkHandler {
  (data: DeepLinkData): void;
}

// Local development configuration
const LOCAL_BACKEND_URL = 'http://192.168.5.146:3003';
const IS_DEV = __DEV__;

/**
 * Parse deep link URL to extract data
 */
export const parseDeepLink = (url: string): DeepLinkData => {
  console.log('🔍 [DeepLink] Parsing deep link:', url);
  console.log('🔍 [DeepLink] Environment:', API_CONFIG.IS_DEVELOPMENT ? 'DEV' : 'PROD');
  
  try {
    const parsed = Linking.parse(url);
    console.log('🔍 [DeepLink] Parsed URL:', parsed);
    
    // Handle different URL formats:
    // tech5://movie/123
    // https://backend-app-lou3.onrender.com/movie/123
    // http://192.168.5.146:3003/movie/123 (local)
    
    let movieId: string | undefined;
    
    if (parsed.path) {
      const pathParts = parsed.path.split('/').filter(Boolean);
      if (pathParts[0] === 'movie' && pathParts[1]) {
        movieId = pathParts[1];
      }
    }
    
    // Fallback to query params
    if (!movieId && parsed.queryParams?.movieId) {
      movieId = String(parsed.queryParams.movieId);
    }
    
    console.log('🔍 [DeepLink] Extracted movieId:', movieId);
    
    return {
      movieId,
      screen: movieId ? 'Movie' : undefined,
      params: movieId ? { id: movieId } : undefined
    };
  } catch (error) {
    console.error('❌ [DeepLink] Error parsing deep link:', error);
    return {};
  }
};

/**
 * Handle initial URL when app is launched from deep link
 */
export const handleInitialURL = async (handler: DeepLinkHandler): Promise<void> => {
  try {
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      console.log('🚀 [DeepLink] Initial URL:', initialUrl);
      const data = parseDeepLink(initialUrl);
      handler(data);
    }
  } catch (error) {
    console.error('❌ [DeepLink] Error handling initial URL:', error);
  }
};

/**
 * Set up deep link listener
 */
export const setupDeepLinkListener = (handler: DeepLinkHandler) => {
  const subscription = Linking.addEventListener('url', ({ url }) => {
    console.log('📨 [DeepLink] Received deep link:', url);
    const data = parseDeepLink(url);
    handler(data);
  });
  
  return subscription;
};

/**
 * Validate if movieId is valid format
 */
export const isValidMovieId = (movieId?: string): boolean => {
  if (!movieId) return false;
  
  // Basic validation - should be non-empty string
  // You can add more specific validation based on your movie ID format
  const isValid = movieId.length > 0 && /^[a-zA-Z0-9]+$/.test(movieId);
  console.log('✅ [DeepLink] MovieId validation:', { movieId, isValid });
  return isValid;
};

/**
 * Create deep link URL
 */
export const createDeepLink = (movieId: string): string => {
  return getDeepLinkUrl(movieId);
};

/**
 * Create web URL (local or production)
 */
export const createWebUrl = (movieId: string): string => {
  const url = getShareUrl(movieId);
  console.log('🌐 [DeepLink] Created web URL:', url);
  return url;
}; 