import { Box, Card, CardContent } from '@mui/material';
import { VaultType } from '@x-fuji/sdk';
import { debounce } from 'debounce';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { DUST_AMOUNT_IN_WEI } from '../../constants';
import {
  ActionType,
  AssetType,
  FetchStatus,
  ltvMeta,
  needsAllowance,
} from '../../helpers/assets';
import { chainName, isSupported } from '../../helpers/chains';
import { borrowingModeForContext } from '../../helpers/mode';
import { showBorrow, showPosition } from '../../helpers/navigation';
import { notify } from '../../helpers/notifications';
import { PositionData } from '../../helpers/positions';
import { useAuth } from '../../store/auth.store';
import { useBorrow } from '../../store/borrow.store';
import { BorrowingPosition } from '../../store/models/Position';
import ConfirmTransactionModal from '../Shared/ConfirmTransaction/ConfirmTransactionModal';
import Fees from '../Shared/Fees';
import FormAssetBox from '../Shared/FormAssetBox/Box';
import { SignTooltip } from '../Shared/Tooltips';
import WarningInfo from '../Shared/WarningInfo';
import BorrowButton from './Button';
import ConnextFooter from './ConnextFooter';
import BorrowHeader from './Header/Header';

type BorrowProps = {
  isEditing: boolean;
  positionData?: PositionData;
};
function BorrowForm({ isEditing, positionData }: BorrowProps) {
  const router = useRouter();

  const address = useAuth((state) => state.address);
  const walletChainId = useAuth((state) => state.chainId);
  const changeChain = useAuth((state) => state.changeChain);
  const changeAssetCurrency = useBorrow((state) => state.changeAssetCurrency);
  const changeAssetValue = useBorrow((state) => state.changeAssetValue);
  const login = useAuth((state) => state.login);

  const collateral = useBorrow((state) => state.collateral);
  const debt = useBorrow((state) => state.debt);
  const needsSignature = useBorrow((state) => state.needsSignature);
  const isSigning = useBorrow((state) => state.isSigning);
  const isExecuting = useBorrow((state) => state.isExecuting);
  const transactionMeta = useBorrow((state) => state.transactionMeta);
  const availableVaultStatus = useBorrow(
    (state) => state.availableVaultsStatus
  );
  const availableVaults = useBorrow((state) => state.availableVaults);
  const availableRoutes = useBorrow((state) => state.availableRoutes);
  const vault = useBorrow((state) => state.activeVault);
  const mode = useBorrow((state) => state.mode);
  const changeMode = useBorrow((state) => state.changeMode);
  const changeAssetChain = useBorrow((state) => state.changeAssetChain);
  const clearInputValues = useBorrow((state) => state.clearInputValues);
  const updateAll = useBorrow((state) => state.updateAll);
  const allow = useBorrow((state) => state.allow);
  const updateCurrencyPrice = useBorrow((state) => state.updateCurrencyPrice);
  const signAndExecute = useBorrow((state) => state.signAndExecute);

  const position = positionData
    ? (positionData.position as BorrowingPosition)
    : undefined;
  const dynamicLtvMeta = ltvMeta(positionData);
  const metaStatus = transactionMeta.status;

  const [actionType, setActionType] = useState(ActionType.ADD);
  const [hasBalanceInVault, setHasBalanceInVault] = useState(false);
  const [isConfirmationModalShown, setIsConfirmationModalShown] =
    useState(false);
  const [confirmationModalAction, setConfirmationModalAction] = useState(
    () => () => {
      notify({ message: 'Invalid function called', type: 'error' });
    }
  );

  const prevAddress = useRef<string | undefined>(undefined);
  const prevActionType = useRef<ActionType>(ActionType.ADD);

  const shouldSignTooltipBeShown = useMemo(() => {
    if (!debt) return false;
    const collateralAmount = parseFloat(collateral.input);
    const debtAmount = parseFloat(debt.input);
    const collateralAllowance = needsAllowance(
      mode,
      AssetType.Collateral,
      collateral,
      collateralAmount
    );
    const debtNeedsAllowance = needsAllowance(
      mode,
      AssetType.Debt,
      debt,
      debtAmount
    );

    const startChainId = transactionMeta.steps[0]?.chainId;
    return (
      (collateralAmount || debtAmount) &&
      !(collateralAllowance || debtNeedsAllowance) &&
      availableVaultStatus === FetchStatus.Ready &&
      !(!isEditing && hasBalanceInVault) &&
      startChainId === walletChainId &&
      needsSignature
    );
  }, [
    availableVaultStatus,
    needsSignature,
    hasBalanceInVault,
    transactionMeta.steps,
    walletChainId,
    isEditing,
    collateral,
    debt,
    mode,
  ]);

  useEffect(() => {
    if (address) {
      if (!vault) {
        debounce(() => {
          if (
            walletChainId &&
            walletChainId !== collateral.chainId &&
            isSupported(walletChainId)
          ) {
            changeAssetChain(AssetType.Collateral, walletChainId, true);
            changeAssetChain(AssetType.Debt, walletChainId, false);
          } else {
            updateAll();
          }
        }, 500);
      }
    }
  }, [address, collateral, walletChainId, vault, changeAssetChain, updateAll]);

  useEffect(() => {
    updateCurrencyPrice(AssetType.Collateral);
    updateCurrencyPrice(AssetType.Debt);
  }, [updateCurrencyPrice]);

  useEffect(() => {
    if (prevActionType.current !== actionType) {
      clearInputValues();
      prevActionType.current = actionType;
    }
  }, [actionType, clearInputValues]);

  useEffect(() => {
    (async () => {
      if (prevAddress.current !== address) {
        if (prevAddress.current !== undefined) {
          await updateAll(vault?.address.value);
        }
        prevAddress.current = address;
      }
      if (address && vault) {
        const current = availableVaults.find((v) =>
          v.vault.address.equals(vault.address)
        );
        if (current) {
          setHasBalanceInVault(current.depositBalance.gt(DUST_AMOUNT_IN_WEI));
        }
      }
    })();
  }, [address, vault, availableVaults, updateAll]);

  useEffect(() => {
    const mode = borrowingModeForContext(
      isEditing,
      actionType,
      Number(collateral.input),
      debt && Number(debt.input)
    );
    changeMode(mode);
  }, [changeMode, isEditing, collateral.input, debt, actionType]);

  const proceedWithConfirmation = (action?: () => void) => {
    setConfirmationModalAction(() => action);
    setIsConfirmationModalShown(true);
  };

  const warningContent = useMemo(() => {
    return (
      <>
        {`Based on your selection, we\'ve noticed that you have an open ${
          vault?.collateral?.symbol
        }/${vault?.debt?.symbol}
        position on ${chainName(
          vault?.chainId
        )}. You may proceed to manage it. `}
        {availableRoutes.length > 1 && (
          <>
            {
              "If you're trying to open a similar position on another chain, please select a different route."
            }
          </>
        )}
      </>
    );
  }, [availableRoutes, vault]);

  const shouldWarningBeDisplayed =
    !isEditing &&
    debt &&
    availableVaultStatus === FetchStatus.Ready &&
    transactionMeta.status === FetchStatus.Ready &&
    hasBalanceInVault;

  return (
    <>
      <Card sx={{ maxWidth: '500px', margin: 'auto' }}>
        <CardContent sx={{ width: '100%', p: '1.5rem' }}>
          <BorrowHeader
            chainName={chainName(vault?.chainId)}
            isEditing={isEditing}
            actionType={actionType}
            onActionTypeChange={(type) => setActionType(type)}
            isCrossChainOperation={
              debt ? collateral.chainId !== debt.chainId : false
            }
          />
          {(actionType === ActionType.ADD
            ? [collateral, debt]
            : [debt, collateral]
          ).map((assetChange, index) => {
            const collateralIndex = actionType === ActionType.ADD ? 0 : 1;
            const type =
              index === collateralIndex ? AssetType.Collateral : AssetType.Debt;
            const balance = assetChange
              ? assetChange.balances[assetChange.currency.symbol]
              : 0;
            const debtAmount = position?.debt?.amount;
            const maxAmount =
              type === AssetType.Debt && debtAmount && debtAmount < balance
                ? debtAmount
                : balance;
            const showLtv =
              type === AssetType.Debt && actionType === ActionType.ADD;
            return (
              <FormAssetBox
                key={type}
                index={index}
                type={type}
                showMax={!showLtv}
                maxAmount={maxAmount}
                assetChange={assetChange}
                isEditing={isEditing}
                actionType={actionType}
                chainId={assetChange?.chainId}
                isExecuting={isExecuting}
                value={assetChange?.input}
                ltvMeta={dynamicLtvMeta}
                positionData={positionData}
                changeAssetChain={changeAssetChain}
                changeAssetCurrency={changeAssetCurrency}
                changeAssetValue={changeAssetValue}
              />
            );
          })}

          <Box m="1rem 0">{debt && <Fees />}</Box>

          {shouldSignTooltipBeShown ? <SignTooltip /> : <></>}

          {shouldWarningBeDisplayed && (
            <Box mb={2}>
              <WarningInfo text={warningContent} />
            </Box>
          )}

          <BorrowButton
            address={address}
            collateral={collateral}
            debt={debt}
            position={position}
            walletChainId={walletChainId}
            ltvMeta={dynamicLtvMeta}
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
            onRedirectClick={(borrow) => {
              if (borrow) {
                showBorrow(router);
              } else {
                showPosition(
                  VaultType.BORROW,
                  router,
                  false,
                  vault,
                  walletChainId
                );
              }
            }}
            onClick={signAndExecute}
            withConfirmation={proceedWithConfirmation}
          />

          <ConnextFooter />
        </CardContent>
      </Card>
      <ConfirmTransactionModal
        open={isConfirmationModalShown}
        onClose={() => setIsConfirmationModalShown(false)}
        positionData={positionData}
        transactionMeta={transactionMeta}
        actionType={actionType}
        action={() => {
          setIsConfirmationModalShown(false);
          confirmationModalAction && confirmationModalAction();
        }}
      />
    </>
  );
}

export default BorrowForm;