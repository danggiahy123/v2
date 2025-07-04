import * as Sharing from 'expo-sharing';
import { API_CONFIG, getApiUrl, getShareUrl } from '../config/api';

export interface ShareResult {
  success: boolean;
  error?: string;
}

/**
 * Share movie with simple URL
 */
export const shareMovie = async (movieId: string): Promise<ShareResult> => {
  try {
    const shareUrl = getShareUrl(movieId);
    
    console.log('📤 [ShareService] Sharing URL:', shareUrl);
    console.log('📤 [ShareService] Environment:', API_CONFIG.IS_DEVELOPMENT ? 'DEV' : 'PROD');
    
    await Sharing.shareAsync(shareUrl, {
      dialogTitle: 'Chia sẻ phim này',
      mimeType: 'text/plain',
      UTI: 'public.plain-text'
    });
    
    return { success: true };
  } catch (error) {
    console.error('❌ [ShareService] Error sharing movie:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Generate share link with movie metadata from backend
 */
export const generateShareLink = async (movieId: string): Promise<string> => {
  try {
    const shareEndpoint = API_CONFIG.ENDPOINTS.MOVIE_SHARE(movieId);
    const url = getApiUrl(shareEndpoint);
    
    console.log('🔗 [ShareService] Fetching share link from:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('🔗 [ShareService] Generate link response:', data);
    
    if (data.success) {
      return data.data.shareUrl;
    }
    throw new Error('Failed to generate share link');
  } catch (error) {
    console.error('❌ [ShareService] Error generating share link:', error);
    // Fallback to simple URL
    const fallbackUrl = getShareUrl(movieId);
    console.log('🔄 [ShareService] Using fallback URL:', fallbackUrl);
    return fallbackUrl;
  }
};

/**
 * Share movie with enhanced metadata
 */
export const shareMovieWithMetadata = async (movieId: string): Promise<ShareResult> => {
  try {
    const shareUrl = await generateShareLink(movieId);
    
    await Sharing.shareAsync(shareUrl, {
      dialogTitle: 'Chia sẻ phim này',
      mimeType: 'text/plain',
      UTI: 'public.plain-text'
    });
    
    return { success: true };
  } catch (error) {
    console.error('❌ [ShareService] Error sharing movie with metadata:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}; 