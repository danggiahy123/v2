import { Linking } from 'react-native';
import { router } from 'expo-router';
import { NotificationData } from './notificationService';

export class DeepLinkService {
  private static instance: DeepLinkService;
  private navigationReady = false;

  static getInstance(): DeepLinkService {
    if (!DeepLinkService.instance) {
      DeepLinkService.instance = new DeepLinkService();
    }
    return DeepLinkService.instance;
  }

  initialize() {
    // Handle deep links when app is opened via URL
    Linking.addEventListener('url', this.handleDeepLink);

    // Handle deep link when app is opened from cold start
    this.handleInitialURL();
    
    // Mark navigation as ready after a short delay
    setTimeout(() => {
      this.navigationReady = true;
    }, 1000);
  }

  private handleDeepLink = (event: { url: string }) => {
    this.processURL(event.url);
  };

  private async handleInitialURL() {
    try {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        this.processURL(initialUrl);
      }
    } catch (error) {
      console.error('Error handling initial URL:', error);
    }
  }

  private processURL(url: string) {
    console.log('Processing deep link:', url);
  
    try {
      const parsedUrl = new URL(url);
      const path = parsedUrl.pathname;
      const params = parsedUrl.searchParams;
    
      // Handle different deep link patterns
      if (path.startsWith('/movie/')) {
        const movieId = path.split('/movie/')[1];
        this.navigateToMovie(movieId);
      } else if (path.startsWith('/series/')) {
        const seriesId = path.split('/series/')[1];
        const episode = params.get('episode');
        this.navigateToSeries(seriesId, episode || undefined);
      } else if (path === '/watch-later') {
        this.navigateToWatchLater();
      } else {
        console.log('Unknown deep link path:', path);
      }
    } catch (error) {
      console.error('Error processing URL:', error);
    }
  }
    
  // Handle notification tap navigation
  handleNotificationTap(notificationData: NotificationData) {
    console.log('🎯 [DeepLinkService] Handling notification tap:', notificationData);

    try {
      switch (notificationData.type) {
        case 'NEW_MOVIE':
          if (notificationData.movieId) {
            console.log('🎬 [DeepLinkService] Navigating to movie:', notificationData.movieId);
            this.navigateToMovie(notificationData.movieId);
          } else {
            console.warn('⚠️ [DeepLinkService] NEW_MOVIE notification missing movieId');
          }
          break;

        case 'NEW_EPISODE':
          if (notificationData.seriesId) {
            console.log('📺 [DeepLinkService] Navigating to series:', notificationData.seriesId, 'episode:', notificationData.episodeNumber);
            this.navigateToSeries(
              notificationData.seriesId, 
              notificationData.episodeNumber?.toString()
            );
          } else {
            console.warn('⚠️ [DeepLinkService] NEW_EPISODE notification missing seriesId');
          }
          break;

        case 'REMINDER':
          console.log('⏰ [DeepLinkService] Navigating to watch later');
          this.navigateToWatchLater();
          break;

        default:
          console.log('❓ [DeepLinkService] Unknown notification type:', notificationData.type);
          
          // Fallback: try to extract movieId from deep_link if available
          if (notificationData.deep_link && notificationData.deep_link.startsWith('movie/')) {
            const movieId = notificationData.deep_link.split('/')[1];
            console.log('🔄 [DeepLinkService] Fallback navigation to movie:', movieId);
            this.navigateToMovie(movieId);
          }
      }
    } catch (error) {
      console.error('💥 [DeepLinkService] Error handling notification tap:', error);
    }
  }

  // Navigation methods with improved error handling
  private navigateToMovie(movieId: string) {
    try {
      console.log('Navigating to movie:', movieId);
      
      // Use a safe navigation approach
      this.safeNavigate(() => {
        router.push(`/movie/${movieId}`);
      });
    } catch (error) {
      console.error('Error navigating to movie:', error);
    }
  }

  private navigateToSeries(seriesId: string, episode?: string) {
    try {
      console.log('Navigating to series:', seriesId, 'episode:', episode);
      
      this.safeNavigate(() => {
        if (episode) {
          // Navigate to specific episode
          router.push(`/movie/${seriesId}?episode=${episode}&autoPlay=true`);
        } else {
          // Navigate to series details
          router.push(`/movie/${seriesId}`);
        }
      });
    } catch (error) {
      console.error('Error navigating to series:', error);
    }
  }

  private navigateToWatchLater() {
    try {
      console.log('Navigating to watch later');
      
      this.safeNavigate(() => {
        router.push('/watch-later');
      });
    } catch (error) {
      console.error('Error navigating to watch later:', error);
    }
  }

  // Safe navigation method that handles navigation stack properly
  private safeNavigate(navigateFunction: () => void) {
    try {
      // If navigation is not ready yet, wait and try again
      if (!this.navigationReady) {
        console.log('Navigation not ready, retrying in 500ms...');
        setTimeout(() => this.safeNavigate(navigateFunction), 500);
        return;
      }

      // Check if we can navigate safely
      if (router.canGoBack()) {
        // We have a navigation stack, safe to navigate
        navigateFunction();
      } else {
        // No navigation stack, ensure we have a base screen first
        console.log('No navigation stack, ensuring base screen is loaded...');
        
        // Navigate to tabs first, then to the target after a delay
        router.replace('/(tabs)');
        
        // Wait for tabs to load, then navigate to target
        setTimeout(() => {
          try {
            navigateFunction();
          } catch (error) {
            console.error('Error in delayed navigation:', error);
          }
        }, 300);
      }
    } catch (error) {
      console.error('Error in safe navigation:', error);
      
      // Fallback: try to go to home
      try {
        router.replace('/(tabs)');
      } catch (fallbackError) {
        console.error('Fallback navigation also failed:', fallbackError);
      }
    }
  }

  // Helper method to create deep links
  createMovieLink(movieId: string): string {
    return `movieapp://movie/${movieId}`;
  }

  createSeriesLink(seriesId: string, episode?: number): string {
    const baseUrl = `movieapp://series/${seriesId}`;
    return episode ? `${baseUrl}?episode=${episode}` : baseUrl;
  }

  createWatchLaterLink(): string {
    return 'movieapp://watch-later';
  }

  // Cleanup
  cleanup() {
    Linking.removeAllListeners('url');
    this.navigationReady = false;
  }
} 