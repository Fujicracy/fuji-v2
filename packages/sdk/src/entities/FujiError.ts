import { FujiErrorCode } from '../constants';

type ErrorInfo = Record<string, string | number | undefined>;

export class FujiError extends Error {
  readonly code: FujiErrorCode;
  readonly info?: ErrorInfo;

  constructor(code: FujiErrorCode, message: string, info?: ErrorInfo) {
    super(message);

    this.code = code;
    this.info = info;
  }

  static handleError(
    e: unknown,
    alternateCode: FujiErrorCode
  ): { code: FujiErrorCode; message: string } {
    return {
      code: e instanceof String ? FujiErrorCode.SDK : alternateCode,
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

export class FujiResultError {
  readonly success = false;
  readonly error: FujiError;
  constructor(code: FujiErrorCode, message: string, info?: ErrorInfo) {
    this.error = new FujiError(code, message, info);
  }
}

export class FujiResultSuccess<T> {
  readonly success = true;
  readonly data: T;
  constructor(data: T) {
    this.data = data;
  }
}
