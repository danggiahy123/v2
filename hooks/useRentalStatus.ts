import { useState, useEffect, useCallback } from 'react';
import { rentalService } from '../services/rentalService';
import {
  UseRentalStatusResult,
  RentalInfo,
  RentalTimeFormatting,
} from '../types/rental';

export const useRentalStatus = (
  userId: string | null,
  movieId: string | null
): UseRentalStatusResult => {
  const [hasAccess, setHasAccess] = useState(false);
  const [rental, setRental] = useState<RentalInfo | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [remainingHours, setRemainingHours] = useState<number | null>(null);
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const checkAccess = useCallback(async () => {
    if (!userId || !movieId) {
      setHasAccess(false);
      setRental(null);
      setRemainingTime(null);
      setRemainingHours(null);
      setRemainingDays(null);
      setMessage('Thông tin không đầy đủ');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await rentalService.checkRentalAccess(userId, movieId);
      const data = response.data;

      console.log('🎫 [DEBUG] Rental Status Response:', {
        userId,
        movieId,
        hasAccess: data.hasAccess,
        rental: data.rental,
        message: data.message
      });

      setHasAccess(data.hasAccess);
      setRental(data.rental || null);
      setRemainingTime(data.remainingTime || null);
      setRemainingHours(data.remainingHours || null);
      setRemainingDays(data.remainingDays || null);
      setMessage(data.message);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      setError(errorMessage);
      setHasAccess(false);
      setRental(null);
      setMessage('Không thể kiểm tra quyền xem');
    } finally {
      setIsLoading(false);
    }
  }, [userId, movieId]);

  // Auto check on mount and when dependencies change
  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // Auto refresh mỗi 30 giây nếu có active rental
  useEffect(() => {
    if (!hasAccess || !rental) return;

    const interval = setInterval(() => {
      checkAccess();
    }, 30000); // 30 seconds

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
    message,
  };
}; 