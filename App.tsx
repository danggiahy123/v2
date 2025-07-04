import { Provider } from 'react-redux';
import { store } from './store/store';
import { Slot, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { handleInitialURL, setupDeepLinkListener, DeepLinkData, isValidMovieId } from './services/deepLinkService';

function AppContent() {
  const router = useRouter();

  const handleDeepLink = (data: DeepLinkData) => {
    console.log('Handling deep link data:', data);
    
    if (data.movieId && isValidMovieId(data.movieId)) {
      // Navigate to movie detail screen
      router.push(`/movie/${data.movieId}`);
    } else if (data.movieId) {
      console.warn('Invalid movie ID:', data.movieId);
      // Optionally navigate to error screen or home
      router.push('/');
    }
  };

  useEffect(() => {
    // Handle initial URL when app is launched from deep link
    handleInitialURL(handleDeepLink);

    // Set up listener for subsequent deep links
    const subscription = setupDeepLinkListener(handleDeepLink);

    return () => {
      subscription?.remove();
    };
  }, []);

  return <Slot />;
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
} 