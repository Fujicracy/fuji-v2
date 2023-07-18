import { Card, CardContent } from '@mui/material';
import { Address, VaultType } from '@x-fuji/sdk';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { DUST_AMOUNT_IN_WEI } from '../../constants';
import {
  ActionType,
  AssetType,
  FetchStatus,
  needsAllowance,
} from '../../helpers/assets';
import { chainName } from '../../helpers/chains';
import { lendingModeForContext } from '../../helpers/mode';
import { showLend, showPosition } from '../../helpers/navigation';
import { notify } from '../../helpers/notifications';
import { PositionData } from '../../helpers/positions';
import { useAuth } from '../../store/auth.store';
import { useLend } from '../../store/lend.store';
import FormAssetBox from '../Shared/FormAssetBox/Box';
import OperationContainer from '../Shared/OperationContainer';
import OperationHeader from '../Shared/OperationHeader/Header';
import OperationInfo from '../Shared/OperationInfo';
import VaultWarning from '../Shared/VaultWarning';
import LendingButton from './Button';

type LendingProps = {
  isEditing: boolean;
  positionData?: PositionData;
};

function LendingForm({ isEditing, positionData }: LendingProps) {
  const router = useRouter();

  const address = useAuth((state) => state.address);
  const walletChain = useAuth((state) => state.chainId);
  const changeChain = useAuth((state) => state.changeChain);
  const login = useAuth((state) => state.login);

  const collateral = useLend((state) => state.collateral);
  const needsSignature = useLend((state) => state.needsSignature);
  const isSigning = useLend((state) => state.isSigning);
  const isExecuting = useLend((state) => state.isExecuting);
  const transactionMeta = useLend((state) => state.transactionMeta);
  const metaStatus = useLend((state) => state.transactionMeta.status);
  const availableVaultStatus = useLend((state) => state.availableVaultsStatus);
  const availableRoutes = useLend((state) => state.availableRoutes);
  const vault = useLend((state) => state.activeVault);
  const mode = useLend((state) => state.mode);

  const changeMode = useLend((state) => state.changeMode);
  const clearInputValues = useLend((state) => state.clearInputValues);
  const changeAssetCurrency = useLend((state) => state.changeAssetCurrency);
  const changeAssetValue = useLend((state) => state.changeAssetValue);
  const changeAssetChain = useLend((state) => state.changeAssetChain);
  const updateBalances = useLend((state) => state.updateBalances);
  const updateVault = useLend((state) => state.updateVault);
  const allow = useLend((state) => state.allow);
  const updateAllowance = useLend((state) => state.updateAllowance);
  const updateCurrencyPrice = useLend((state) => state.updateCurrencyPrice);
  const signAndExecute = useLend((state) => state.signAndExecute);

  const [actionType, setActionType] = useState(ActionType.ADD);
  const [hasBalanceInVault, setHasBalanceInVault] = useState(false);
  const [isConfirmationModalShown, setIsConfirmationModalShown] =
    useState(false);
  const [confirmationModalAction, setConfirmationModalAction] = useState(
    () => () => {
      notify({ message: 'Invalid function called', type: 'error' });
    }
  );

  const prevActionType = useRef<ActionType>(ActionType.ADD);

  const shouldSignTooltipBeShown = useMemo(() => {
    const collateralAmount = parseFloat(collateral.input);
    const collateralAllowance = needsAllowance(
      mode,
      AssetType.Collateral,
      collateral,
      collateralAmount
    );

    const startChainId = transactionMeta.steps[0]?.chainId;
    const value =
      collateralAmount &&
      !collateralAllowance &&
      availableVaultStatus === FetchStatus.Ready &&
      !(!isEditing && hasBalanceInVault) &&
      startChainId === walletChain &&
      needsSignature;
    return value === true;
  }, [
    availableVaultStatus,
    needsSignature,
    hasBalanceInVault,
    transactionMeta.steps,
    walletChain,
    isEditing,
    collateral,
    mode,
  ]);

  const onConfirm = () => {
    setIsConfirmationModalShown(false);
    confirmationModalAction && confirmationModalAction();
  };

  useEffect(() => {
    if (address) {
      updateBalances(AssetType.Collateral);
      updateAllowance(AssetType.Collateral);
      if (!vault) {
        updateVault();
      }
    }
  }, [address, vault, updateBalances, updateAllowance, updateVault]);

  useEffect(() => {
    updateCurrencyPrice(AssetType.Collateral);
  }, [updateCurrencyPrice]);

  useEffect(() => {
    if (prevActionType.current !== actionType) {
      clearInputValues();
      prevActionType.current = actionType;
    }
  }, [actionType, clearInputValues]);

  useEffect(() => {
    (async () => {
      if (address && vault) {
        const balance = await vault.getBalances(Address.from(address));
        const currentActiveVault = useLend.getState().activeVault;
        if (
          currentActiveVault &&
          currentActiveVault.address.value === vault.address.value
        ) {
          const hasBalance = balance.deposit.gt(DUST_AMOUNT_IN_WEI);
          setHasBalanceInVault(hasBalance);
        }
      }
    })();
  }, [address, vault]);

  useEffect(() => {
    const mode = lendingModeForContext(actionType);
    changeMode(mode);
  }, [changeMode, actionType]);

  const proceedWithConfirmation = (action?: () => void) => {
    setConfirmationModalAction(() => action);
    setIsConfirmationModalShown(true);
  };

  const warningContent = useMemo(() => {
    return <VaultWarning availableRoutes={availableRoutes} vault={vault} />;
  }, [availableRoutes, vault]);

  const shouldWarningBeDisplayed =
    !isEditing &&
    availableVaultStatus === FetchStatus.Ready &&
    transactionMeta.status === FetchStatus.Ready &&
    hasBalanceInVault;

  const maxAmount =
    actionType === ActionType.ADD
      ? collateral.balances[collateral.currency.symbol]
      : collateral.amount;

  return (
    <OperationContainer
      positionData={positionData}
      transactionMeta={transactionMeta}
      actionType={actionType}
      handler={() => {
        if (confirmationModalAction) {
          confirmationModalAction();
        }
      }}
    >
      <Card sx={{ maxWidth: '500px', margin: 'auto' }}>
        <CardContent
          sx={{
            width: '100%',
            p: '1.5rem 2rem 1.5rem 2rem',
            mb: '2rem',
          }}
        >
          <OperationHeader
            type={VaultType.LEND}
            chainName={chainName(vault?.chainId)}
            collateral={collateral}
            isEditing={isEditing}
            actionType={actionType}
            onActionTypeChange={(type) => setActionType(type)}
            isCrossChainOperation={
              vault !== undefined && vault.chainId === collateral.chainId
            }
          />
          <FormAssetBox
            index={0}
            type={AssetType.Collateral}
            showMax
            maxAmount={maxAmount}
            assetChange={collateral}
            isEditing={isEditing}
            actionType={actionType}
            chainId={collateral.chainId}
            isExecuting={isExecuting}
            value={collateral.input}
            positionData={positionData}
            changeAssetValue={changeAssetValue}
            changeAssetChain={changeAssetChain}
            changeAssetCurrency={changeAssetCurrency}
            vaultType={VaultType.LEND}
          />
          <OperationInfo
            shouldShowFees
            shouldSignTooltipBeShown={shouldSignTooltipBeShown}
            shouldWarningBeDisplayed={shouldWarningBeDisplayed}
            warningContent={warningContent}
          />
          <LendingButton
            address={address}
            collateral={collateral}
            walletChainId={walletChain}
            metaStatus={metaStatus}
            needsSignature={needsSignature}
            isSigning={isSigning}
            isExecuting={isExecuting}
            availableVaultStatus={availableVaultStatus}
            transactionMeta={transactionMeta}
            mode={mode}
            isEditing={isEditing}
            hasBalanceInVault={hasBalanceInVault}
            onLoginClick={login}
            onChainChangeClick={(chainId) => changeChain(chainId)}
            onApproveClick={(type) => allow(type)}
            onRedirectClick={(lend) => {
              if (lend) {
                showLend(router);
              } else {
                showPosition(VaultType.LEND, router, false, vault, walletChain);
              }
            }}
            onClick={signAndExecute}
            withConfirmation={proceedWithConfirmation}
          />
        </CardContent>
      </Card>
    </OperationContainer>
  );
}

export default LendingForm;
