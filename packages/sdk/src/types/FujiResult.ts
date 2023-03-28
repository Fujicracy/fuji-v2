import { FujiError } from '../entities/FujiError';

export type FujiResult<T> =
  | { success: true; data: T }
  | { success: false; error: FujiError };
