import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

// Local IP configuration for development
const API_BASE_URL = 'https://backend-app-lou3.onrender.com';

export interface ShareResult {
  success: boolean;
  error?: string;
}

/**
 * Get the appropriate deeplink URL based on environment
 */
const getDeeplinkUrl = (movieId: string): string => {
  // Check if we're in Expo Go development
  const isExpoGo = Constants.appOwnership === 'expo';
  
  if (isExpoGo) {
    // Use Expo Go deeplink format for development
    const expoUrl = Constants.expoConfig?.hostUri;
    if (expoUrl) {
      return `exp://${expoUrl}/--/movie/${movieId}`;
    }
    // Fallback - let Expo handle the URL automatically
    return `exp://localhost:8081/--/movie/${movieId}`;
  }
  
  // Production deeplink using app scheme
  return `movieapp://movie/${movieId}`;
};

/**
 * Generate share URL for movie with deeplink
 */
const getShareUrl = (movieId: string): string => {
  const deeplinkUrl = getDeeplinkUrl(movieId);
  
  // Create a shareable URL that includes both deeplink and web fallback
  const shareUrl = `${API_BASE_URL}/movie/${movieId}`;
  
  return `${shareUrl}?deeplink=${encodeURIComponent(deeplinkUrl)}`;
};

/**
 * Share movie with deeplink support
 */
export const shareMovie = async (movieId: string): Promise<ShareResult> => {
  try {
    const shareUrl = getShareUrl(movieId);
    const deeplinkUrl = getDeeplinkUrl(movieId);
    
    console.log('📤 [ShareService] Sharing URL:', shareUrl);
    console.log('📤 [ShareService] Deeplink URL:', deeplinkUrl);
    
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
    const url = `${API_BASE_URL}${shareEndpoint}`;
    
    console.log('🔗 [ShareService] Fetching share link from:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('🔗 [ShareService] Generate link response:', data);
    
    if (data.success) {
      // Add deeplink to the share URL
      const deeplinkUrl = getDeeplinkUrl(movieId);
      const shareUrl = data.data.shareUrl;
      return `${shareUrl}?deeplink=${encodeURIComponent(deeplinkUrl)}`;
    }
    throw new Error('Failed to generate share link');
  } catch (error) {
    console.error('❌ [ShareService] Error generating share link:', error);
    // Fallback to simple URL with deeplink
    const fallbackUrl = getShareUrl(movieId);
    console.log('🔄 [ShareService] Using fallback URL:', fallbackUrl);
    return fallbackUrl;
  }
};

/**
 * Share movie with enhanced metadata and deeplink
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

/**
 * Create a deeplink URL for testing
 */
export const createDeeplinkUrl = (movieId: string): string => {
  return getDeeplinkUrl(movieId);
};

/**
 * Test if deeplink can be opened
 */
export const testDeeplink = async (movieId: string): Promise<boolean> => {
  try {
    const deeplinkUrl = getDeeplinkUrl(movieId);
    const canOpen = await Linking.canOpenURL(deeplinkUrl);
    console.log('🔗 [ShareService] Can open deeplink:', canOpen, deeplinkUrl);
    return canOpen;
  } catch (error) {
    console.error('❌ [ShareService] Error testing deeplink:', error);
    return false;
  }
}; 