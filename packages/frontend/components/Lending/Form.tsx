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
import { LendingPosition } from '../../store/models/Position';
import Fees from '../Borrow/Fees';
import ConfirmTransactionModal from '../Shared/ConfirmTransaction/ConfirmTransactionModal';
import FormAssetBox from '../Shared/FormAssetBox/Box';
import TabSwitch from '../Shared/TabSwitch/TabSwitch';
import { SignTooltip } from '../Shared/Tooltips';
import WarningInfo from '../Shared/WarningInfo';
import LendingButton from './Button';

type BorrowProps = {
  isEditing: boolean;
  positionData?: PositionData;
};
function LendingForm({ isEditing, positionData }: BorrowProps) {
  const theme = useTheme();
  const onMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();

  // TODO: replace data from borrow and get it from useLend
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

  const position = positionData
    ? (positionData.position as LendingPosition)
    : undefined;

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
    const collateralAllowance = needsAllowance(
      mode,
      AssetType.Collateral,
      collateral,
      collateralAmount
    );

    const startChainId = transactionMeta.steps[0]?.chainId;
    return (
      collateralAmount &&
      !collateralAllowance &&
      availableVaultStatus === FetchStatus.Ready &&
      !(!isEditing && hasBalanceInVault) &&
      startChainId === walletChain &&
      needsSignature
    );
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
    return (
      <>
        {`Based on your selection, we\'ve noticed that you have an open ${
          vault?.collateral?.symbol
        } lending position on ${chainName(
          vault?.chainId
        )}. You may proceed to manage it. `}
        {availableRoutes.length > 1 &&
          "If you're trying to open a similar position on another chain, please select a different route."}
      </>
    );
  }, [availableRoutes, vault]);

  const shouldWarningBeDisplayed =
    !isEditing &&
    availableVaultStatus === FetchStatus.Ready &&
    transactionMeta.status === FetchStatus.Ready &&
    hasBalanceInVault;

  const maxAmount = collateral.balances[collateral.currency.symbol];

  return (
    <>
      <Card sx={{ maxWidth: '500px', margin: 'auto' }}>
        <CardContent
          sx={{
            width: '100%',
            p: `${!isEditing ? '1.5rem' : '0'} 2rem 1.5rem 2rem`,
            mb: '2rem',
          }}
        >
          {isEditing && (
            <TabSwitch
              size="large"
              options={[
                { value: ActionType.ADD, label: 'Deposit' },
                { value: ActionType.REMOVE, label: 'Withdraw' },
              ]}
              selected={actionType}
              onChange={(type) => setActionType(type)}
            />
          )}

          <FormAssetBox
            index={0}
            type={AssetType.Collateral}
            showMax={true}
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
          />

          {availableRoutes.length > 1 ? (
            <Stack
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
          <LendingButton
            address={address}
            collateral={collateral}
            position={position}
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

export default LendingForm;
