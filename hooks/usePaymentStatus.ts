import { useState, useRef, useCallback, useEffect } from 'react';
import { rentalService } from '../services/rentalService';
import { UsePaymentStatusResult } from '../types/rental';

export const usePaymentStatus = (): UsePaymentStatusResult => {
  const [status, setStatus] = useState<'pending' | 'checking' | 'success' | 'failed' | 'cancelled'>('pending');
  const [countdown, setCountdown] = useState(900); // 15 minutes
  const [isChecking, setIsChecking] = useState(false);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const consecutiveErrorsRef = useRef(0);

  const stopChecking = useCallback(() => {
    setIsChecking(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const startChecking = useCallback((orderCode: string, userId: string) => {
    // Clear any existing intervals first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    setIsChecking(true);
    setStatus('checking');
    consecutiveErrorsRef.current = 0;

    // Start payment status checking với adaptive interval
    let checkInterval = 5000; // Bắt đầu với 5 giây
    
    const checkPayment = async () => {
      try {
        const isPaid = await rentalService.checkPaymentStatus(orderCode, userId);
        
        if (isPaid) {
          setStatus('success');
          setIsChecking(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          return;
        }
        
        // Reset consecutive errors khi thành công
        consecutiveErrorsRef.current = 0;
        
      } catch (error) {
        consecutiveErrorsRef.current++;
        console.warn(`Payment check error (${consecutiveErrorsRef.current}):`, error);
        
        // Nếu quá nhiều lỗi liên tiếp, tăng interval
        if (consecutiveErrorsRef.current >= 3) {
          checkInterval = Math.min(checkInterval * 1.5, 30000); // Max 30 giây
        }
        
        // Nếu quá nhiều lỗi, dừng check
        if (consecutiveErrorsRef.current >= 10) {
          console.error('Too many consecutive errors, stopping payment check');
          setStatus('failed');
          setIsChecking(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          return;
        }
      }
    };

    // Chạy check đầu tiên ngay
    checkPayment();

    // Setup interval với adaptive timing
    intervalRef.current = setInterval(checkPayment, checkInterval);

    // Start countdown
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setStatus('failed');
          setIsChecking(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const resetStatus = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setStatus('pending');
    setCountdown(900);
    setIsChecking(false);
    consecutiveErrorsRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  return {
    status,
    countdown,
    isChecking,
    startChecking,
    stopChecking,
    resetStatus,
  };
}; 