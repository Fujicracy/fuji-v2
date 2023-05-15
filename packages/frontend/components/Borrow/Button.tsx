import LoadingButton from '@mui/lab/LoadingButton';
import { Button } from '@mui/material';
import { ChainId, RoutingStep } from '@x-fuji/sdk';
import React from 'react';

import { MINIMUM_DEBT_AMOUNT } from '../../constants';
import {
  AllowanceStatus,
  AssetChange,
  AssetType,
  FetchStatus,
  LtvMeta,
  Mode,
  needsAllowance,
} from '../../helpers/assets';
import { chainName } from '../../helpers/chains';
import { isBridgeable } from '../../helpers/currencies';
import { TransactionMeta } from '../../helpers/transactions';
import { Position } from '../../store/models/Position';

type BorrowButtonProps = {
  address: string | undefined;
  collateral: AssetChange;
  debt: AssetChange;
  position: Position;
  walletChainId: ChainId | undefined;
  ltvMeta: LtvMeta;
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
};

function BorrowButton({
  address,
  collateral,
  debt,
  position,
  walletChainId,
  ltvMeta,
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
}: BorrowButtonProps) {
  const collateralAmount = parseFloat(collateral.input);
  const debtAmount = parseFloat(debt.input);
  const collateralBalance = collateral.balances[collateral.currency.symbol];
  const debtBalance = debt.balances[debt.currency.symbol];

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
    (collateral.allowance.status === AllowanceStatus.Approving &&
      'Approving...') ||
    (debt.allowance.status === AllowanceStatus.Approving && 'Approving...') ||
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

  const firstStep = transactionMeta.steps[0];
  const bridgeStep = transactionMeta.steps.find(
    (s) => s.step === RoutingStep.X_TRANSFER
  );
  if (!address) {
    return regularButton('Connect wallet', onLoginClick, 'borrow-login');
  } else if (
    collateral.allowance.status === AllowanceStatus.Approving ||
    debt.allowance.status === AllowanceStatus.Approving
  ) {
    return loadingButton(false, true);
  } else if (firstStep && firstStep.chainId !== walletChainId) {
    return regularButton(
      `Switch to ${chainName(firstStep.chainId)} Network`,
      () => onChainChangeClick(firstStep?.chainId)
    );
  } else if (availableVaultStatus === FetchStatus.Error) {
    return disabledButton('Unsupported pair');
  } else if (bridgeStep?.token && !isBridgeable(bridgeStep.token)) {
    return disabledButton(
      `${bridgeStep.token.symbol}: not supported cross-chain`
    );
  } else if (
    !isEditing &&
    hasBalanceInVault &&
    availableVaultStatus === FetchStatus.Ready &&
    transactionMeta.status === FetchStatus.Ready
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
    return disabledButton(`Insufficient ${collateral.currency.symbol} balance`);
  } else if (
    (mode === Mode.PAYBACK || mode === Mode.PAYBACK_AND_WITHDRAW) &&
    debtAmount > 0 &&
    debtAmount > debtBalance
  ) {
    return disabledButton(`Insufficient ${debt.currency.symbol} balance`);
  } else if (ltvMeta.ltv > ltvMeta.ltvMax) {
    return disabledButton('Not enough collateral');
  } else if (
    (mode === Mode.PAYBACK || mode === Mode.PAYBACK_AND_WITHDRAW) &&
    debtAmount > position.debt.amount
  ) {
    return disabledButton('Payback more than amount due');
  } else if (
    (mode === Mode.DEPOSIT_AND_BORROW || mode === Mode.BORROW) &&
    debtAmount !== 0 &&
    debtAmount <= MINIMUM_DEBT_AMOUNT
  ) {
    return disabledButton('Need to borrow more than 1 USD');
  } else if (
    (mode === Mode.WITHDRAW || mode === Mode.PAYBACK_AND_WITHDRAW) &&
    collateralAmount > position.collateral.amount
  ) {
    return disabledButton('Withdraw more than allowed');
  } else if (
    needsAllowance(mode, AssetType.Collateral, collateral, collateralAmount)
  ) {
    return regularButton('Approve', () => onApproveClick(AssetType.Collateral));
  } else if (needsAllowance(mode, AssetType.Debt, debt, debtAmount)) {
    return regularButton('Approve', () => onApproveClick(AssetType.Debt));
  } else {
    return loadingButton(
      !(
        (metaStatus === FetchStatus.Ready &&
          (mode === Mode.DEPOSIT_AND_BORROW ||
            mode === Mode.PAYBACK_AND_WITHDRAW) &&
          collateralAmount > 0 &&
          debtAmount > 0) ||
        ((mode === Mode.DEPOSIT || mode === Mode.WITHDRAW) &&
          collateralAmount > 0) ||
        ((mode === Mode.BORROW || mode === Mode.PAYBACK) && debtAmount > 0)
      ),
      isSigning || isExecuting || availableVaultStatus === FetchStatus.Loading
    );
  }
}

export default BorrowButton;
