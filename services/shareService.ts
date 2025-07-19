import * as Sharing from 'expo-sharing';

// Local IP configuration for development
const API_BASE_URL = 'http://192.168.9.83:3003';

export interface ShareResult {
  success: boolean;
  error?: string;
}

/**
 * Generate share URL for movie
 */
const getShareUrl = (movieId: string): string => {
  return `${API_BASE_URL}/movie/${movieId}`;
};

/**
 * Generate API URL
 */
const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

/**
 * Share movie with simple URL
 */
export const shareMovie = async (movieId: string): Promise<ShareResult> => {
  try {
    const shareUrl = getShareUrl(movieId);
    
    console.log('📤 [ShareService] Sharing URL:', shareUrl);
    console.log('📤 [ShareService] Using local development server');
    
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
    const shareEndpoint = `/api/movies/${movieId}/share`;
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