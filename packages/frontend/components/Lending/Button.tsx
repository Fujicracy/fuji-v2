import React from 'react';

import {
  AllowanceStatus,
  AssetType,
  FetchStatus,
  Mode,
  needsAllowance,
} from '../../helpers/assets';
import { chainName } from '../../helpers/chains';
import { LendingPosition } from '../../store/models/Position';
import {
  ActionButtonProps,
  DisabledButton,
  LoadingButton,
  RegularButton,
} from '../Shared/ActionButton';

type LendingButtonProps = Omit<ActionButtonProps, 'position'> & {
  position?: LendingPosition;
};

function LendingButton({
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
}: LendingButtonProps) {
  const clickWithConfirmation: (action: () => void) => void = (action) => {
    withConfirmation(action);
  };

  const regularButton = (title: string, onClick: () => void, data?: string) => {
    return <RegularButton title={title} onClick={onClick} data={data} />;
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
    return disabledButton('Problem fetching on-chain data');
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

export default LendingButton;
