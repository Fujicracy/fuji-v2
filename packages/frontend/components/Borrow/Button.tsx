import LoadingButton from '@mui/lab/LoadingButton';
import { Button } from '@mui/material';
import { ConnectedChain } from '@web3-onboard/core';
import { ChainId } from '@x-fuji/sdk';
import React from 'react';

import { MINIMUM_DEBT_AMOUNT } from '../../constants';
import {
  ActionType,
  AssetChange,
  AssetType,
  LtvMeta,
  Mode,
  needsAllowance,
} from '../../helpers/assets';
import { chainName, hexToChainId } from '../../helpers/chains';
import { TransactionMeta } from '../../helpers/transactions';
import { FetchStatus } from '../../store/borrow.store';
import { Position } from '../../store/models/Position';

type BorrowButtonProps = {
  address: string | undefined;
  collateral: AssetChange;
  debt: AssetChange;
  position: Position;
  walletChain: ConnectedChain | undefined;
  ltvMeta: LtvMeta;
  metaStatus: FetchStatus;
  needsSignature: boolean;
  isSigning: boolean;
  isExecuting: boolean;
  availableVaultStatus: FetchStatus;
  transactionMeta: TransactionMeta;
  mode: Mode;
  isEditing: boolean;
  actionType: ActionType;
  hasBalanceInVault: boolean;
  onLoginClick: () => void;
  onChainChangeClick: (chainId: ChainId) => void;
  onApproveClick: (type: AssetType) => void;
  onRedirectClick: (position: boolean) => void;
  onClick: () => void;
  withConfirmation: (action?: () => void) => void;
};

function BorrowButton({
  address,
  collateral,
  debt,
  position,
  walletChain,
  ltvMeta,
  metaStatus,
  needsSignature,
  isSigning,
  isExecuting,
  availableVaultStatus,
  transactionMeta,
  mode,
  isEditing,
  actionType,
  hasBalanceInVault,
  onLoginClick,
  onChainChangeClick,
  onApproveClick,
  onRedirectClick,
  onClick,
  withConfirmation,
}: BorrowButtonProps) {
  const collateralAmount = parseFloat(collateral.input);
  const debtAmount = parseFloat(debt.input);
  const collateralBalance = collateral.balances[collateral.token.symbol];
  const debtBalance = debt.balances[debt.token.symbol];

  const executionStep = needsSignature ? 2 : 1;
  const actionTitle = `${needsSignature ? 'Sign & ' : ''}${
    mode === Mode.DEPOSIT_AND_BORROW
      ? `${needsSignature ? '' : 'Deposit & '}Borrow`
      : mode === Mode.BORROW
      ? 'Borrow'
      : mode === Mode.DEPOSIT
      ? 'Deposit'
      : mode === Mode.PAYBACK_AND_WITHDRAW
      ? 'Payback & Withdraw'
      : mode === Mode.WITHDRAW
      ? 'Withdraw'
      : 'Payback'
  }`;

  const loadingButtonTitle =
    (collateral.allowance.status === 'allowing' && 'Approving...') ||
    (debt.allowance.status === 'allowing' && 'Approving...') ||
    (isSigning && '(1/2) Signing...') ||
    (isExecuting && `(${executionStep}/${executionStep}) Processing...`) ||
    actionTitle;

  const regularButton = (
    title: string,
    onClick: () => void,
    data: string | undefined = undefined
  ) => {
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
    <Button variant="gradient" size="large" fullWidth disabled>
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
    return regularButton('Connect wallet', onLoginClick, 'borrow-login');
  } else if (
    collateral.allowance.status === 'allowing' ||
    debt.allowance.status === 'allowing'
  ) {
    return loadingButton(false, true);
  } else if (
    (actionType === ActionType.ADD ? collateral.chainId : debt.chainId) !==
    hexToChainId(walletChain?.id)
  ) {
    return regularButton(
      `Switch to ${chainName(collateral.chainId)} Network`,
      () => {
        onChainChangeClick(
          actionType === ActionType.ADD ? collateral.chainId : debt.chainId
        );
      }
    );
  } else if (availableVaultStatus === 'error') {
    return disabledButton('Error fetching on-chain data');
  } else if (
    collateral.chainId !== debt.chainId &&
    debt.token.symbol === 'DAI'
  ) {
    return disabledButton('Cross-chain DAI not supported');
  } else if (
    !isEditing &&
    hasBalanceInVault &&
    availableVaultStatus === 'ready' &&
    transactionMeta.status === 'ready'
  ) {
    return regularButton('Manage position', () => {
      onRedirectClick(false);
    });
  } else if (isEditing && !hasBalanceInVault) {
    return regularButton('Borrow', () =>
      clickWithConfirmation(() => {
        onRedirectClick(true);
      })
    );
  } else if (
    (mode === Mode.DEPOSIT || mode === Mode.DEPOSIT_AND_BORROW) &&
    collateralAmount > 0 &&
    collateralAmount > collateralBalance
  ) {
    return disabledButton(`Insufficient ${collateral.token.symbol} balance`);
  } else if (
    (mode === Mode.PAYBACK || mode === Mode.PAYBACK_AND_WITHDRAW) &&
    debtAmount > 0 &&
    debtAmount > debtBalance
  ) {
    return disabledButton(`Insufficient ${debt.token.symbol} balance`);
  } else if (ltvMeta.ltv > ltvMeta.ltvMax) {
    return disabledButton('Not enough collateral');
  } else if (
    (mode === Mode.PAYBACK || mode === Mode.PAYBACK_AND_WITHDRAW) &&
    debtAmount > position.debt.amount
  ) {
    return disabledButton('Payback more than amount due');
  } else if (
    mode === Mode.DEPOSIT_AND_BORROW &&
    debtAmount !== 0 &&
    debtAmount <= MINIMUM_DEBT_AMOUNT
  ) {
    return disabledButton('Need to borrow more than 1 USD');
  } else if (
    (mode === Mode.WITHDRAW || mode === Mode.PAYBACK_AND_WITHDRAW) &&
    collateralAmount > position.collateral.amount
  ) {
    return disabledButton('Withdraw more than allowed');
  } else if (needsAllowance(mode, 'collateral', collateral, collateralAmount)) {
    return regularButton('Approve', () => onApproveClick('collateral'));
  } else if (needsAllowance(mode, 'debt', debt, debtAmount)) {
    return regularButton('Approve', () => onApproveClick('debt'));
  } else {
    return loadingButton(
      !(
        (metaStatus === 'ready' &&
          (mode === Mode.DEPOSIT_AND_BORROW ||
            mode === Mode.PAYBACK_AND_WITHDRAW) &&
          collateralAmount > 0 &&
          debtAmount > 0) ||
        ((mode === Mode.DEPOSIT || mode === Mode.WITHDRAW) &&
          collateralAmount > 0) ||
        ((mode === Mode.BORROW || mode === Mode.PAYBACK) && debtAmount > 0)
      ),
      isSigning || isExecuting || availableVaultStatus === 'fetching'
    );
  }
}

export default BorrowButton;
