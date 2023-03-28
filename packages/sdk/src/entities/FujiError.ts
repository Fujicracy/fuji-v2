import { FujiErrorCode } from '../constants';

type ErrorInfo = Record<string, string>;

export class FujiError extends Error {
  readonly code: FujiErrorCode;
  readonly info?: ErrorInfo;

  constructor(code: FujiErrorCode, message: string, info?: ErrorInfo) {
    super(message);

    this.code = code;
    this.info = info;
  }
}
