import { useState, useEffect, useCallback, useRef } from 'react';
import { rentalService } from '../services/rentalService';
import {
  UseRentalStatusResult,
  RentalInfo,
  RentalTimeFormatting,
} from '../types/rental';

// Simple cache for rental status (1 minute TTL)
const rentalCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 1 * 60 * 1000; // 1 minute

// Function to clear cache for specific user-movie combination
export const clearRentalCache = (userId: string, movieId: string) => {
  const cacheKey = `${userId}-${movieId}`;
  rentalCache.delete(cacheKey);
  console.log('🗑️ [useRentalStatus] Cache cleared for:', { userId, movieId });
};

// Function to clear all rental cache
export const clearAllRentalCache = () => {
  rentalCache.clear();
  console.log('🗑️ [useRentalStatus] All rental cache cleared');
};

export const useRentalStatus = (
  userId: string | null,
  movieId: string | null,
  initialRentalAccess?: boolean
): UseRentalStatusResult => {
  const [hasAccess, setHasAccess] = useState(initialRentalAccess || false);
  const [rental, setRental] = useState<RentalInfo | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [remainingHours, setRemainingHours] = useState<number | null>(null);
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const initialAccessChecked = useRef(false);

  const checkAccess = useCallback(async (forceRefresh: boolean = false) => {
    // Skip initial check if we have initialRentalAccess
    if (initialRentalAccess && !initialAccessChecked.current && !forceRefresh) {
      console.log('🎫 [useRentalStatus] Using initialRentalAccess:', { initialRentalAccess });
      initialAccessChecked.current = true;
      return;
    }

    if (!userId || !movieId || movieId === 'undefined' || typeof movieId !== 'string') {
      console.log('⚠️ [useRentalStatus] Invalid params:', { userId, movieId, movieIdType: typeof movieId });
      setHasAccess(false);
      setRental(null);
      setRemainingTime(null);
      setRemainingHours(null);
      setRemainingDays(null);
      setMessage('Thông tin không đầy đủ');
      setError(null);
      return;
    }

    const cacheKey = `${userId}-${movieId}`;
    const startTime = Date.now();
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = rentalCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
        console.log('🎫 [useRentalStatus] Using cached rental data:', { 
          cacheAge: Date.now() - cached.timestamp,
          userId, 
          movieId 
        });
        const data = cached.data;
        setHasAccess(data.hasAccess);
        setRental(data.rental || null);
        setRemainingTime(data.remainingTime || null);
        setRemainingHours(data.remainingHours || null);
        setRemainingDays(data.remainingDays || null);
        setMessage(data.message);
        setError(null);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🎫 [useRentalStatus] Starting rental access check:', { userId, movieId, startTime, forceRefresh });
      const response = await rentalService.checkRentalAccess(userId, movieId);
      const endTime = Date.now();
      const data = response.data;
      
      // Cache the response
      rentalCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl: CACHE_TTL
      });

      console.log('🎫 [DEBUG] Rental Status Response:', {
        userId,
        movieId,
        hasAccess: data.hasAccess,
        rental: data.rental,
        message: data.message,
        responseTime: endTime - startTime
      });

      setHasAccess(data.hasAccess);
      setRental(data.rental || null);
      setRemainingTime(data.remainingTime || null);
      setRemainingHours(data.remainingHours || null);
      setRemainingDays(data.remainingDays || null);
      setMessage(data.message);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      console.error('❌ [useRentalStatus] Error checking rental access:', err);
      setError(errorMessage);
      setHasAccess(false);
      setRental(null);
      setRemainingTime(null);
      setRemainingHours(null);
      setRemainingDays(null);
      setMessage('Không thể kiểm tra quyền xem');
    } finally {
      setIsLoading(false);
    }
  }, [userId, movieId, initialRentalAccess]);

  // Function to force refresh (clear cache and refetch)
  const forceRefresh = useCallback(() => {
    if (userId && movieId) {
      clearRentalCache(userId, movieId);
      checkAccess(true);
    }
  }, [userId, movieId, checkAccess]);

  // Auto check on mount and when dependencies change
  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // Auto refresh mỗi 1 phút nếu có active rental
  useEffect(() => {
    if (!hasAccess || !rental) return;

    const interval = setInterval(() => {
      console.log('🔄 [useRentalStatus] Auto-refreshing rental status (1min interval)');
      checkAccess(true); // Force refresh on interval
    }, 1 * 60 * 1000); // 1 minute

    return () => clearInterval(interval);
  }, [hasAccess, rental, checkAccess]);

  return {
    hasAccess,
    rental,
    remainingTime,
    remainingHours,
    remainingDays,
    isLoading,
    error,
    checkAccess,
    forceRefresh, // Export force refresh function
    message,
  };
}; 