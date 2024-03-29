import { RoutingStep } from '@x-fuji/sdk';
import React from 'react';

import { MINIMUM_DEBT_AMOUNT } from '../../constants';
import {
  AllowanceStatus,
  AssetChange,
  AssetType,
  FetchStatus,
  invalidBridgingAmount,
  LtvMeta,
  Mode,
  needsAllowance,
} from '../../helpers/assets';
import { chainName } from '../../helpers/chains';
import { isBridgeable } from '../../helpers/currencies';
import { BorrowingPosition } from '../../store/models/Position';
import {
  DisabledButton,
  LoadingButton,
  loadingTitle,
  OperationButtonProps,
  OperationButtonTitles,
  RegularButton,
} from '../Shared/Operation/OperationButton';

type BorrowButtonProps = Omit<OperationButtonProps, 'position'> & {
  debt?: AssetChange;
  ltvMeta?: LtvMeta;
  position?: BorrowingPosition;
  availableVaultCount: number;
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
  availableVaultCount,
  onLoginClick,
  onChainChangeClick,
  onApproveClick,
  onRedirectClick,
  onClick,
  withConfirmation,
}: BorrowButtonProps) {
  const clickWithConfirmation: (action: () => void) => void = (action) => {
    withConfirmation(action);
  };

  const regularButton = (
    title: string,
    onClick: () => void,
    data?: string,
    variant?: 'gradient' | 'secondary'
  ) => {
    return (
      <RegularButton
        title={title}
        onClick={onClick}
        data={data}
        variant={variant}
      />
    );
  };

  const disabledButton = (title: string) => <DisabledButton title={title} />;

  const loadingButton = (disabled: boolean, loading: boolean) => (
    <LoadingButton
      disabled={disabled}
      loading={loading}
      title={loadingButtonTitle}
      onClick={() => clickWithConfirmation(onClick)}
    />
  );

  if (!address) {
    return regularButton(
      OperationButtonTitles.CONNECT,
      onLoginClick,
      'borrow-login',
      'secondary'
    );
  }
  if (!debt || !position || !ltvMeta) {
    return disabledButton('Select a network to borrow on');
  }
  const collateralAmount = parseFloat(collateral.input);
  const debtAmount = parseFloat(debt.input);
  const collateralBalance = collateral.balances[collateral.currency.symbol];
  const debtBalance = debt.balances[debt.currency.symbol];

  const actionTitle = `${needsSignature ? OperationButtonTitles.SIGN : ''}${
    mode === Mode.DEPOSIT_AND_BORROW
      ? `${needsSignature ? '' : 'Deposit & '}Borrow`
      : mode === Mode.BORROW
      ? 'Borrow'
      : mode === Mode.DEPOSIT
      ? OperationButtonTitles.DEPOSIT
      : mode === Mode.PAYBACK_AND_WITHDRAW
      ? 'Payback & Withdraw'
      : mode === Mode.WITHDRAW
      ? OperationButtonTitles.WITHDRAW
      : 'Payback'
  }`;

  const loadingButtonTitle = loadingTitle(
    collateral.allowance.status === AllowanceStatus.Approving ||
      debt.allowance.status === AllowanceStatus.Approving,
    needsSignature,
    isSigning,
    isExecuting,
    actionTitle
  );

  const firstStep = transactionMeta.steps[0];
  const bridgeStep = transactionMeta.steps.find(
    (s) => s.step === RoutingStep.X_TRANSFER
  );
  if (availableVaultStatus === FetchStatus.Ready && availableVaultCount === 0) {
    return disabledButton('No available vaults for pair');
  } else if (
    collateral.allowance.status === AllowanceStatus.Approving ||
    debt.allowance.status === AllowanceStatus.Approving
  ) {
    return loadingButton(false, true);
  } else if (availableVaultStatus === FetchStatus.Error) {
    return disabledButton(OperationButtonTitles.ERROR);
  } else if (bridgeStep?.token && !isBridgeable(bridgeStep.token)) {
    return disabledButton(
      `${bridgeStep.token.symbol}: not supported cross-chain`
    );
  } else if (invalidBridgingAmount(transactionMeta.steps, collateral, debt)) {
    return disabledButton(OperationButtonTitles.ETHEREUM_MIN);
  } else if (
    !isEditing &&
    hasBalanceInVault &&
    availableVaultStatus === FetchStatus.Ready &&
    transactionMeta.status === FetchStatus.Ready
  ) {
    return regularButton(OperationButtonTitles.MANAGE, () => {
      onRedirectClick(false);
    });
  } else if (firstStep && firstStep?.chainId !== walletChainId) {
    return regularButton(
      `Switch to ${chainName(firstStep?.chainId)} Network`,
      () => onChainChangeClick(firstStep?.chainId)
    );
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
    debtAmount * position.debt.usdPrice <= MINIMUM_DEBT_AMOUNT
  ) {
    return disabledButton('Need to borrow more than 1 USD');
  } else if (
    (mode === Mode.WITHDRAW || mode === Mode.PAYBACK_AND_WITHDRAW) &&
    collateralAmount > position.collateral.amount
  ) {
    return disabledButton(OperationButtonTitles.WITHDRAW_MAX);
  } else if (
    needsAllowance(mode, AssetType.Collateral, collateral, collateralAmount)
  ) {
    return regularButton(OperationButtonTitles.APPROVE, () =>
      onApproveClick(AssetType.Collateral)
    );
  } else if (needsAllowance(mode, AssetType.Debt, debt, debtAmount)) {
    return regularButton(OperationButtonTitles.APPROVE, () =>
      onApproveClick(AssetType.Debt)
    );
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
