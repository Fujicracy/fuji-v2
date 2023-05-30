import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { debounce } from 'debounce';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { DUST_AMOUNT_IN_WEI } from '../../constants';
import {
  ActionType,
  AssetType,
  FetchStatus,
  needsAllowance,
} from '../../helpers/assets';
import { modeForContext } from '../../helpers/borrow';
import { chainName, isSupported } from '../../helpers/chains';
import { showBorrow, showPosition } from '../../helpers/navigation';
import { notify } from '../../helpers/notifications';
import { BasePosition } from '../../helpers/positions';
import { useAuth } from '../../store/auth.store';
import { useBorrow } from '../../store/borrow.store';
import ConfirmTransactionModal from '../Shared/ConfirmTransactionModal';
import { SignTooltip } from '../Shared/Tooltips';
import WarningInfo from '../Shared/WarningInfo';
import BorrowBox from './Box/Box';
import BorrowButton from './Button';
import ConnextFooter from './ConnextFooter';
import Fees from './Fees';
import BorrowHeader from './Header';
import RoutingModal from './Routing/RoutingModal';

type BorrowProps = {
  isEditing: boolean;
  basePosition: BasePosition;
};
function Borrow({ isEditing, basePosition }: BorrowProps) {
  const router = useRouter();
  const theme = useTheme();
  const onMobile = useMediaQuery(theme.breakpoints.down('md'));

  const address = useAuth((state) => state.address);
  const walletChainId = useAuth((state) => state.chainId);
  const changeChain = useAuth((state) => state.changeChain);
  const showDisclaimer = useAuth((state) => state.showDisclaimer);

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
  const changeInputValues = useBorrow((state) => state.changeInputValues);
  const updateBalances = useBorrow((state) => state.updateBalances);
  const updateVault = useBorrow((state) => state.updateVault);
  const allow = useBorrow((state) => state.allow);
  const updateAllowance = useBorrow((state) => state.updateAllowance);
  const updateCurrencyPrice = useBorrow((state) => state.updateCurrencyPrice);
  const signAndExecute = useBorrow((state) => state.signAndExecute);

  const { position, editedPosition } = basePosition;

  const metaStatus = transactionMeta.status;
  const dynamicLtvMeta = {
    ltv: editedPosition ? editedPosition.ltv : position.ltv,
    ltvMax: position.ltvMax,
    ltvThreshold: editedPosition
      ? editedPosition.ltvThreshold
      : position.ltvThreshold,
  };

  const [showRoutingModal, setShowRoutingModal] = useState(false);
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
            updateBalances(AssetType.Collateral);
            updateBalances(AssetType.Debt);
            updateAllowance(AssetType.Collateral);
            updateAllowance(AssetType.Debt);
            updateVault();
          }
        }, 500);
      }
    }
  }, [
    address,
    collateral,
    walletChainId,
    vault,
    changeAssetChain,
    updateBalances,
    updateAllowance,
    updateVault,
  ]);

  useEffect(() => {
    updateCurrencyPrice(AssetType.Collateral);
    updateCurrencyPrice(AssetType.Debt);
  }, [updateCurrencyPrice]);

  useEffect(() => {
    if (prevActionType.current !== actionType) {
      changeInputValues('', '');
      prevActionType.current = actionType;
    }
  }, [actionType, changeInputValues]);

  useEffect(() => {
    if (address && vault) {
      const current = availableVaults.find((v) =>
        v.vault.address.equals(vault.address)
      );
      if (current) {
        setHasBalanceInVault(current.depositBalance.gt(DUST_AMOUNT_IN_WEI));
      }
    }
  }, [address, vault, availableVaults]);

  useEffect(() => {
    const mode = modeForContext(
      isEditing,
      actionType,
      Number(collateral.input),
      Number(debt.input)
    );
    changeMode(mode);
  }, [changeMode, isEditing, collateral.input, debt.input, actionType]);

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
              "If you're trying to open a similar position on another chain, please "
            }
            <Typography
              variant="xsmall"
              lineHeight="160%"
              textAlign="left"
              onClick={() => {
                !onMobile && address && setShowRoutingModal(true);
              }}
              style={
                !onMobile
                  ? { textDecoration: 'underline', cursor: 'pointer' }
                  : {}
              }
            >
              select a different route.
            </Typography>
          </>
        )}
      </>
    );
  }, [availableRoutes, onMobile, address, vault]);

  const shouldWarningBeDisplayed =
    !isEditing &&
    availableVaultStatus === FetchStatus.Ready &&
    transactionMeta.status === FetchStatus.Ready &&
    hasBalanceInVault;

  return (
    <>
      <Card sx={{ maxWidth: '500px', margin: 'auto' }}>
        <CardContent sx={{ width: '100%', p: '1.5rem 2rem' }}>
          <BorrowHeader
            chainName={chainName(vault?.chainId)}
            isEditing={isEditing}
            actionType={actionType}
            onActionTypeChange={(type) => setActionType(type)}
            isCrossChainOperation={collateral.chainId !== debt.chainId}
          />
          {(actionType === ActionType.ADD
            ? [collateral, debt]
            : [debt, collateral]
          ).map((assetChange, index) => {
            const collateralIndex = actionType === ActionType.ADD ? 0 : 1;
            const type =
              index === collateralIndex ? AssetType.Collateral : AssetType.Debt;
            const balance = assetChange.balances[assetChange.currency.symbol];
            const debtAmount = position.debt.amount;
            const maxAmount =
              type === AssetType.Debt && debtAmount && debtAmount < balance
                ? debtAmount
                : balance;
            const showLtv =
              type === AssetType.Debt && actionType === ActionType.ADD;
            return (
              <BorrowBox
                key={type}
                index={index}
                type={type}
                showMax={!showLtv}
                maxAmount={maxAmount}
                assetChange={assetChange}
                isEditing={isEditing}
                actionType={actionType}
                chainId={assetChange.chainId}
                isExecuting={isExecuting}
                value={assetChange.input}
                ltvMeta={dynamicLtvMeta}
                basePosition={basePosition}
              />
            );
          })}

          {availableRoutes.length > 1 ? (
            <Stack
              data-cy="borrow-routes-button"
              direction="row"
              mt="1rem"
              justifyContent="space-between"
              onClick={() => {
                !isEditing && !onMobile && address && setShowRoutingModal(true);
              }}
              sx={{ cursor: address && 'pointer' }}
            >
              <Typography variant="smallDark">Routes</Typography>
              <Stack direction="row">
                <Typography variant="h6" sx={{ fontSize: '0.875rem' }}>
                  View all Routes
                </Typography>
                <ArrowForwardIosIcon
                  viewBox="0 0 24 24"
                  sx={{
                    fontSize: 24,
                    p: '5px',
                  }}
                />
              </Stack>
            </Stack>
          ) : (
            <></>
          )}

          <Box m="1rem 0">
            <Fees />
          </Box>

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
            onLoginClick={() => showDisclaimer()}
            onChainChangeClick={(chainId) => changeChain(chainId)}
            onApproveClick={(type) => allow(type)}
            onRedirectClick={(borrow) => {
              if (borrow) {
                showBorrow(router);
              } else {
                showPosition(router, walletChainId, vault, false);
              }
            }}
            onClick={signAndExecute}
            withConfirmation={proceedWithConfirmation}
          />

          <ConnextFooter />
        </CardContent>
      </Card>
      <RoutingModal
        isEditing={isEditing}
        open={showRoutingModal}
        handleClose={() => setShowRoutingModal(false)}
      />
      <ConfirmTransactionModal
        open={isConfirmationModalShown}
        onClose={() => setIsConfirmationModalShown(false)}
        basePosition={basePosition}
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

export default Borrow;
