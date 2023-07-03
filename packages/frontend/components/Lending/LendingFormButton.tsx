import LoadingButton from '@mui/lab/LoadingButton';
import { Button } from '@mui/material';
import { ChainId } from '@x-fuji/sdk';
import React from 'react';

import {
  AllowanceStatus,
  AssetChange,
  AssetType,
  FetchStatus,
  Mode,
  needsAllowance,
} from '../../helpers/assets';
import { chainName } from '../../helpers/chains';
import { TransactionMeta } from '../../helpers/transactions';
import { Position } from '../../store/models/Position';

type LendButtonProps = {
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

function LendButton({
  address,
  collateral,
  position,
  walletChainId,
  metaStatus,
  needsSignature,
  isSigning,
  isExecuting,
  availableVaultStatus,
  transactionMeta,
  mode,
  isEditing,
  hasBalanceInVault,
  onLoginClick,
  onChainChangeClick,
  onApproveClick,
  onRedirectClick,
  onClick,
  withConfirmation,
}: LendButtonProps) {
  const regularButton = (title: string, onClick: () => void, data?: string) => {
    return (
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
  };

  const clickWithConfirmation: (action: () => void) => void = (action) => {
    withConfirmation(action);
  };

  const disabledButton = (title: string) => (
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

  const loadingButton = (disabled: boolean, loading: boolean) => (
    <LoadingButton
      variant="gradient"
      size="large"
      loadingPosition="start"
      startIcon={<></>}
      fullWidth
      disabled={disabled}
      loading={loading}
      onClick={() => clickWithConfirmation(onClick)}
    >
      {loadingButtonTitle}
    </LoadingButton>
  );

  if (!address) {
    return regularButton('Connect wallet', onLoginClick, 'lend-login');
  }
  const collateralAmount = parseFloat(collateral.input);
  const collateralBalance = collateral.balances[collateral.currency.symbol];

  const executionStep = needsSignature ? 2 : 1;
  const actionTitle = `${needsSignature ? 'Sign & ' : ''}${
    mode === Mode.DEPOSIT ? 'Deposit' : 'Withdraw'
  }`;

  const loadingButtonTitle =
    (collateral.allowance.status === AllowanceStatus.Approving &&
      'Approving...') ||
    (isSigning && '(1/2) Signing...') ||
    (isExecuting && `(${executionStep}/${executionStep}) Processing...`) ||
    actionTitle;

  const firstStep = transactionMeta.steps[0];
  if (collateral.allowance.status === AllowanceStatus.Approving) {
    return loadingButton(false, true);
  } else if (availableVaultStatus === FetchStatus.Error) {
    return disabledButton('Unsupported pair');
  } else if (
    !isEditing &&
    hasBalanceInVault &&
    availableVaultStatus === FetchStatus.Ready &&
    transactionMeta.status === FetchStatus.Ready
  ) {
    return regularButton('Manage position', () => {
      onRedirectClick(false);
    });
  } else if (firstStep && firstStep?.chainId !== walletChainId) {
    return regularButton(
      `Switch to ${chainName(firstStep?.chainId)} Network`,
      () => onChainChangeClick(firstStep?.chainId)
    );
  } else if (
    mode === Mode.DEPOSIT &&
    collateralAmount > 0 &&
    collateralAmount > collateralBalance
  ) {
    return disabledButton(`Insufficient ${collateral.currency.symbol} balance`);
  } else if (
    mode === Mode.WITHDRAW &&
    collateralAmount > Number(position?.collateral?.amount)
  ) {
    return disabledButton('Withdraw more than allowed');
  } else if (
    needsAllowance(mode, AssetType.Collateral, collateral, collateralAmount)
  ) {
    return regularButton('Approve', () => onApproveClick(AssetType.Collateral));
  } else {
    return loadingButton(
      !(
        metaStatus === FetchStatus.Ready &&
        (mode === Mode.DEPOSIT || mode === Mode.WITHDRAW) &&
        collateralAmount > 0
      ),
      isSigning || isExecuting || availableVaultStatus === FetchStatus.Loading
    );
  }
}

export default LendButton;
