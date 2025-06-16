/**
 * REDUX HOOKS - Typed hooks cho Redux store
 * MÔ TẢ: Pre-typed hooks để sử dụng Redux với TypeScript
 * HOOKS:
 * - useAppDispatch: Typed dispatch hook
 * - useAppSelector: Typed selector hook với RootState
 * SỬ DỤNG: Import thay vì useDispatch/useSelector gốc để có type safety
 */
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

// Typed dispatch hook - sử dụng thay vì useDispatch
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Typed selector hook - sử dụng thay vì useSelector
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
