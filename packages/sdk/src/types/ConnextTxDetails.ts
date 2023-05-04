import { ConnextTxStatus } from '../enums';

export type ConnextTxDetails = {
  connextTransferId: string;
  status: ConnextTxStatus;
  destTxHash?: string;
};
