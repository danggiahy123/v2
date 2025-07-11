import { Linking } from 'react-native';
import { router } from 'expo-router';
import { NotificationData } from './notificationService';

export class DeepLinkService {
  private static instance: DeepLinkService;

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
    console.log('Handling notification tap:', notificationData);

    switch (notificationData.type) {
      case 'NEW_MOVIE':
        if (notificationData.movieId) {
          this.navigateToMovie(notificationData.movieId);
        }
        break;

      case 'NEW_EPISODE':
        if (notificationData.seriesId) {
          this.navigateToSeries(
            notificationData.seriesId, 
            notificationData.episodeNumber?.toString()
          );
        }
        break;

      case 'REMINDER':
        this.navigateToWatchLater();
        break;

      default:
        console.log('Unknown notification type:', notificationData.type);
    }
  }

  // Navigation methods
  private navigateToMovie(movieId: string) {
    try {
      console.log('Navigating to movie:', movieId);
      router.push(`/movie/${movieId}`);
    } catch (error) {
      console.error('Error navigating to movie:', error);
    }
  }

  private navigateToSeries(seriesId: string, episode?: string) {
    try {
      console.log('Navigating to series:', seriesId, 'episode:', episode);
      
      if (episode) {
        // Navigate to specific episode
        router.push(`/movie/${seriesId}?episode=${episode}&autoPlay=true`);
      } else {
        // Navigate to series details
        router.push(`/movie/${seriesId}`);
      }
  } catch (error) {
      console.error('Error navigating to series:', error);
    }
  }

  private navigateToWatchLater() {
  try {
      console.log('Navigating to watch later');
      router.push('/watch-later');
  } catch (error) {
      console.error('Error navigating to watch later:', error);
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
  }
} 