import { FujiResultError, FujiResultSuccess } from '../entities/FujiError';

type FujiResult<T> = FujiResultSuccess<T> | FujiResultError;

export type FujiResultPromise<T> = Promise<FujiResult<T>>;
