import { LoadingButton as MUILendingButton } from '@mui/lab';
import { Button } from '@mui/material';
import { ChainId } from '@x-fuji/sdk';

import {
  AssetChange,
  AssetType,
  FetchStatus,
  Mode,
} from '../../helpers/assets';
import { TransactionMeta } from '../../helpers/transactions';
import { Position } from '../../store/models/Position';

export enum ActionButtonTitles {
  APPROVE = 'Approve',
  CONNECT = 'Connect wallet',
  DEPOSIT = 'Deposit',
  ERROR = 'Problems fetching on-chain data',
  MANAGE = 'Manage position',
  SIGN = 'Sign & ',
  WITHDRAW = 'Withdraw',
  WITHDRAW_MAX = 'Withdraw more than allowed',
}

export type ActionButtonProps = {
  collateral: AssetChange;
  metaStatus: FetchStatus;
  needsSignature: boolean;
  isSigning: boolean;
  isExecuting: boolean;
  availableVaultStatus: FetchStatus;
  transactionMeta: TransactionMeta;
  mode: Mode;
  isEditing: boolean;
  hasBalanceInVault: boolean;
  onLoginClick: () => void;
  onChainChangeClick: (chainId: ChainId) => void;
  onApproveClick: (type: AssetType) => void;
  onRedirectClick: (position: boolean) => void;
  onClick: () => void;
  withConfirmation: (action?: () => void) => void;
  position?: Position;
  walletChainId?: ChainId;
  address?: string;
};

type RegularButtonProps = {
  title: string;
  data?: string;
  onClick: () => void;
};

type DisabledButtonProps = {
  title: string;
};

type LoadingButtonProps = {
  disabled: boolean;
  loading: boolean;
  title: string;
  onClick: () => void;
};

export const RegularButton = ({ title, data, onClick }: RegularButtonProps) => (
  <Button
    variant="gradient"
    size="large"
    fullWidth
    onClick={onClick}
    data-cy={data}
  >
    {title}
  </Button>
);

export const DisabledButton = ({ title }: DisabledButtonProps) => (
  <Button
    variant="gradient"
    size="large"
    fullWidth
    disabled
    data-cy="disabled-lend-button"
  >
    {title}
  </Button>
);

export const LoadingButton = ({
  disabled,
  loading,
  title,
  onClick,
}: LoadingButtonProps) => (
  <MUILendingButton
    variant="gradient"
    size="large"
    loadingPosition="start"
    startIcon={<></>}
    fullWidth
    disabled={disabled}
    loading={loading}
    onClick={onClick}
  >
    {title}
  </MUILendingButton>
);

export const loadingTitle = (
  isAllowing: boolean,
  needsSignature: boolean,
  isSigning: boolean,
  isExecuting: boolean,
  actionTitle: string
) => {
  const executionStep = needsSignature ? 2 : 1;
  return (
    (isAllowing && 'Approving...') ||
    (isSigning && '(1/2) Signing...') ||
    (isExecuting && `(${executionStep}/${executionStep}) Processing...`) ||
    actionTitle
  );
};
