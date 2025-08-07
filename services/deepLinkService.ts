import { Linking } from 'react-native';
import { router } from 'expo-router';
import { NotificationData } from './notificationService';
import eventBus from '../utils/eventBus';

export class DeepLinkService {
  private lastProcessedPathAndQuery?: string;
  private static instance: DeepLinkService;
  private navigationReady = false;
  private homeReady = false;
  private pendingDeepLink?: string;
  private retryCount = 0;
  private maxRetries = 3;
  private OnBeforeNavigateCallBack?: () => void | Promise<void>;
  private isNavigating = false; // Flag to prevent duplicate navigation
  private initialUrlProcessed = false; // Flag to prevent processing initial URL multiple times
  private coldStartUrl?: string; // Store cold start URL to prevent duplicates
  private isAppInForegroundState = false; // Track actual app state
  private coldStartProcessed = false; // Prevent cold start from being processed multiple times

  // Private constructor to enforce singleton pattern
  public setOnBeforeNavigate(callback: (() => void | Promise<void>) | undefined) {
    this.OnBeforeNavigateCallBack = callback;
  }

  static getInstance(): DeepLinkService {
    if (!DeepLinkService.instance) {
      DeepLinkService.instance = new DeepLinkService();
    }
    return DeepLinkService.instance;
  }

  initialize() {
    console.log('🔗 [DeepLinkService] Initializing...');
    
    // Reset navigation state on app start
    this.isNavigating = false;
    this.isAppInForegroundState = false; // Start with cold start state
    
    // Only reset lastProcessedPathAndQuery if this is a fresh initialization
    if (!this.initialUrlProcessed) {
      this.lastProcessedPathAndQuery = undefined;
      this.coldStartProcessed = false;
    }
    
    // Handle deep links when app is opened via URL
    Linking.addEventListener('url', this.handleDeepLink);

    // Handle deep link when app is opened from cold start
    this.handleInitialURL();

    // Mark navigation as ready after a short delay
    setTimeout(() => {
      this.navigationReady = true;
      console.log('🔗 [DeepLinkService] Navigation ready');
      
      // Process pending deep link if any
      if (this.pendingDeepLink && !this.coldStartProcessed) {
        console.log('🔗 [DeepLinkService] Processing pending deep link:', this.pendingDeepLink);
        const urlToProcess = this.pendingDeepLink;
        this.pendingDeepLink = undefined;
        this.coldStartProcessed = true; // Mark as processed to prevent duplicates
        this.processURL(urlToProcess);
      }
    }, 1000);
  }

  // Called when Home screen is ready
  setHomeReady(ready: boolean) {
    this.homeReady = ready;
    console.log('🏠 [DeepLinkService] Home ready status:', ready);
    
    // Mark app as in foreground state when home is ready
    if (ready) {
      this.isAppInForegroundState = true;
    }
    
    // If home is ready and we have a pending deep link, process it
    if (ready && this.pendingDeepLink && !this.coldStartProcessed) {
      console.log('🔗 [DeepLinkService] Home ready, processing pending deep link:', this.pendingDeepLink);
      
      setTimeout(() => {
        if (this.pendingDeepLink && !this.coldStartProcessed) {
          // Store the URL to prevent duplicate processing
          const urlToProcess = this.pendingDeepLink;
          this.pendingDeepLink = undefined;
          this.coldStartProcessed = true; // Mark as processed
          this.processURL(urlToProcess);
        }
      }, 500); // Small delay to ensure home is fully rendered
    }
  }

  // Retry mechanism for failed deep links
  retryPendingDeepLink() {
    if (this.pendingDeepLink && this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`🔄 [DeepLinkService] Retrying deep link (${this.retryCount}/${this.maxRetries}):`, this.pendingDeepLink);
      
      setTimeout(() => {
        if (this.pendingDeepLink) {
          this.processURL(this.pendingDeepLink);
        }
      }, 1000 * this.retryCount); // Exponential backoff
    } else if (this.retryCount >= this.maxRetries) {
      console.warn('⚠️ [DeepLinkService] Max retries reached, clearing pending deep link');
      this.pendingDeepLink = undefined;
      this.retryCount = 0;
    }
  }

  private handleDeepLink = (event: { url: string }) => {
    console.log('🔗 [DeepLinkService] Handling deep link event:', event.url);
    
    // For foreground app, allow navigation to new deep links
    if (this.isAppInForegroundState) {
      console.log('🔗 [DeepLinkService] Foreground deep link - allowing navigation');
      // Reset navigation flags for foreground navigation
      this.isNavigating = false;
      this.lastProcessedPathAndQuery = undefined; // Allow duplicate navigation in foreground
    } else {
      console.log('🔗 [DeepLinkService] Cold start deep link - maintaining duplicate protection');
      // For cold start, maintain all protections
    }
    
    this.processURL(event.url);
  };

  private async handleInitialURL() {
    try {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl && !this.initialUrlProcessed) {
        console.log('🔗 [DeepLinkService] Processing initial URL:', initialUrl);
        this.initialUrlProcessed = true;
        this.coldStartUrl = initialUrl; // Store cold start URL
        // Don't reset navigation state for initial URL to maintain duplicate protection
        this.processURL(initialUrl);
      }
    } catch (error) {
      console.error('Error handling initial URL:', error);
    }
  }

  private processURL(url: string) {
    try {
      const parsedUrl = new URL(url);
      const pathAndQuery = parsedUrl.pathname + parsedUrl.search;
      
      console.log('🔗 [DeepLinkService] Processing deep link:', url);
      console.log('🔗 [DeepLinkService] Navigation ready:', this.navigationReady, 'Home ready:', this.homeReady);
      console.log('🔗 [DeepLinkService] App state - Foreground:', this.isAppInForegroundState, 'Cold start processed:', this.coldStartProcessed);

      // Enhanced duplicate detection for cold start
      if (!this.isAppInForegroundState) {
        // During cold start, strict duplicate protection
        if (this.coldStartProcessed) {
          console.log('🔗 [DeepLinkService] Cold start already processed, skipping:', url);
          return;
        }
        
        if (this.coldStartUrl && this.coldStartUrl === url) {
          console.log('🔗 [DeepLinkService] Cold start duplicate URL detected, skipping:', url);
          return;
        }
        
        if (this.lastProcessedPathAndQuery === pathAndQuery) {
          console.log('🔗 [DeepLinkService] Cold start duplicate path detected, skipping:', pathAndQuery);
          return;
        }
      } else {
        // Foreground: allow navigation even if duplicate
        console.log('🔗 [DeepLinkService] Foreground navigation - allowing duplicate if any');
      }

      // If navigation is not ready or home is not ready for cold start, store the URL
      if (!this.navigationReady || (!this.homeReady && !this.isAppInForegroundState)) {
        console.log('🔗 [DeepLinkService] App not ready, storing pending deep link');
        this.pendingDeepLink = url;
        return;
      }

      // Reset navigation flag for new deep link
      this.isNavigating = false;
      
      // Mark as processed BEFORE processing to prevent duplicate navigation
      if (!this.isAppInForegroundState) {
        this.coldStartProcessed = true;
      }
      this.lastProcessedPathAndQuery = pathAndQuery;

      const path = parsedUrl.pathname;
      const params = parsedUrl.searchParams;

      // Handle different deep link patterns
      if (path.startsWith('/movie/')) {
        const movieId = path.split('/movie/')[1];
        this.navigateToMovie(movieId);
      } else if (path.startsWith('/--/movie/')) {
        // Expo Go deeplink: /--/movie/:id
        const movieId = path.split('/--/movie/')[1];
        this.navigateToMovie(movieId);
      } else if (path.startsWith('/series/')) {
        const seriesId = path.split('/series/')[1];
        const episode = params.get('episode');
        this.navigateToSeries(seriesId, episode || undefined);
      } else if (path === '/watch-later') {
        this.navigateToWatchLater();
      } else {
        console.log('🔗 [DeepLinkService] Unknown deep link path:', path);
      }
    } catch (error) {
      console.error('❌ [DeepLinkService] Error processing URL:', error);
    }
  }

  // Check if app is currently in foreground (has existing navigation state)
  private isAppInForeground(): boolean {
    // Use the tracked state instead of unreliable router checks
    return this.isAppInForegroundState;
  }

  // Reset navigation state when app comes to foreground
  public resetNavigationState() {
    this.isNavigating = false;
    
    if (this.isAppInForegroundState) {
      // Only clear duplicate protection when truly in foreground
      this.lastProcessedPathAndQuery = undefined;
      this.coldStartUrl = undefined; // Clear cold start URL in foreground
      this.coldStartProcessed = false; // Reset for potential new cold starts
      console.log('🔗 [DeepLinkService] Navigation state reset (foreground app)');
    } else {
      // During cold start, never clear duplicate protection
      console.log('🔗 [DeepLinkService] Navigation flag reset only (cold start - preserving duplicate protection)');
    }
  }

  // Mark app as in foreground state (call this when user navigates within app)
  public setAppInForeground(inForeground: boolean = true) {
    this.isAppInForegroundState = inForeground;
    console.log('🔗 [DeepLinkService] App foreground state updated:', inForeground);
  }

  // Handle notification tap navigation
  handleNotificationTap(notificationData: NotificationData) {
    console.log('🎯 [DeepLinkService] Handling notification tap:', notificationData);

    // Reset navigation state for new notification tap
    this.resetNavigationState();

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
      console.log('🎬 [DeepLinkService] Navigating to movie:', movieId);

      // Prevent duplicate navigation
      if (this.isNavigating) {
        console.log('🔗 [DeepLinkService] Navigation already in progress, skipping');
        return;
      }

      // Check if we're already on the same movie detail screen only during cold start
      // Allow navigation in foreground for better user experience
      if (!this.isAppInForegroundState && this.lastProcessedPathAndQuery?.includes(`/movie/${movieId}`)) {
        console.log('🔗 [DeepLinkService] Cold start - already on movie detail screen for:', movieId);
        return;
      }

      // Use a safe navigation approach
      this.safeNavigate(() => {
        // Always use push for movie navigation to ensure proper stack
        router.push(`/movie/${movieId}`);
      });
    } catch (error) {
      console.error('❌ [DeepLinkService] Error navigating to movie:', error);
      this.retryPendingDeepLink();
    }
  }

  private navigateToSeries(seriesId: string, episode?: string) {
    try {
      console.log('📺 [DeepLinkService] Navigating to series:', seriesId, 'episode:', episode);

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
      console.error('❌ [DeepLinkService] Error navigating to series:', error);
      this.retryPendingDeepLink();
    }
  }

  private navigateToWatchLater() {
    try {
      console.log('📋 [DeepLinkService] Navigating to watch later');

      this.safeNavigate(() => {
        router.push('/watch-later');
      });
    } catch (error) {
      console.error('❌ [DeepLinkService] Error navigating to watch later:', error);
      this.retryPendingDeepLink();
    }
  }

  // Safe navigation method that handles navigation stack properly
  private async safeNavigate(navigateFunction: () => void) {
    try {
      // Prevent duplicate navigation
      if (this.isNavigating) {
        console.log('🔗 [DeepLinkService] Navigation already in progress, skipping');
        return;
      }

      this.isNavigating = true;
      console.log('🔗 [DeepLinkService] Safe navigate - stopping videos and preparing navigation...');
      
      // Call callback to stop video (if any) before navigation
      if (this.OnBeforeNavigateCallBack) {
        try {
          const result = this.OnBeforeNavigateCallBack();
          if (result instanceof Promise) {
            await result;
          }
        } catch (e) {
          console.error('❌ [DeepLinkService] Error in OnBeforeNavigateCallBack:', e);
        }
      }

      if (!this.navigationReady) {
        console.log('🔗 [DeepLinkService] Navigation not ready, retrying...');
        this.isNavigating = false; // Reset flag before retry
        setTimeout(() => this.safeNavigate(navigateFunction), 500);
        return;
      }

      // For foreground navigation, check if we're already on tabs      
      if (this.isAppInForegroundState) {
        console.log('🔗 [DeepLinkService] App in foreground - direct navigation');
        // Direct navigation for foreground app
        try {
          navigateFunction();
        } catch (error) {
          console.error('❌ [DeepLinkService] Direct navigation failed:', error);
        } finally {
          this.isNavigating = false; // Reset flag after navigation
        }
      } else {
        console.log('🔗 [DeepLinkService] Cold start - ensuring tabs first');
        // For cold start, ensure we're on tabs first
        router.replace('/(tabs)');

        // Wait for tabs to be ready - single event listener approach
        const onTabsReady = () => {
          eventBus.off('tabsReady', onTabsReady);
          try {
            // Small delay to ensure tabs are fully mounted
            setTimeout(() => {
              navigateFunction();
              this.isNavigating = false; // Reset flag after navigation
            }, 300);
          } catch (error) {
            console.error('❌ [DeepLinkService] Navigation failed:', error);
            this.isNavigating = false; // Reset flag on error
          }
        };
        
        // Register listener
        eventBus.on('tabsReady', onTabsReady);
        
        // Fallback timeout in case event doesn't fire
        setTimeout(() => {
          if (this.isNavigating) {
            console.log('🔗 [DeepLinkService] Fallback navigation after timeout');
            eventBus.off('tabsReady', onTabsReady);
            try {
              navigateFunction();
            } catch (error) {
              console.error('❌ [DeepLinkService] Fallback navigation failed:', error);
            } finally {
              this.isNavigating = false;
            }
          }
        }, 2000); // 2 second fallback
      }
    } catch (error) {
      console.error('❌ [DeepLinkService] Error in safe navigation:', error);
      this.isNavigating = false; // Reset flag on error
      try {
        // Fallback to tabs
        router.replace('/(tabs)');
      } catch (fallbackError) {
        console.error('❌ [DeepLinkService] Fallback navigation also failed:', fallbackError);
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
    console.log('🔗 [DeepLinkService] Cleaning up...');
    Linking.removeAllListeners('url');
    this.navigationReady = false;
    this.homeReady = false;
    this.lastProcessedPathAndQuery = undefined;
    this.pendingDeepLink = undefined;
    this.retryCount = 0;
    this.initialUrlProcessed = false;
    this.coldStartUrl = undefined;
    this.isAppInForegroundState = false;
    this.coldStartProcessed = false;
  }
}