import { FujiErrorCode } from '../constants/errors';

type ErrorInfo = Record<string, string | number | undefined>;

export class FujiError extends Error {
  readonly code: FujiErrorCode;
  readonly info?: ErrorInfo;

  constructor(message: string, code: FujiErrorCode, info?: ErrorInfo) {
    super(message);

    this.code = code;
    this.info = info;
  }

  static messageFromUnknownError(e: unknown): string {
    return e instanceof Error ? e.message : String(e);
  }
}

export class FujiResultError {
  readonly success = false;
  readonly error: FujiError;
  constructor(message: string, code?: FujiErrorCode, info?: ErrorInfo) {
    this.error = new FujiError(message, code ?? FujiErrorCode.SDK, info);
  }
}

export class FujiResultSuccess<T> {
  readonly success = true;
  readonly data: T;
  constructor(data: T) {
    this.data = data;
  }
}
