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
import { Address } from '@x-fuji/sdk';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';

import { PATH } from '../../constants';
import { DUST_AMOUNT_IN_WEI } from '../../constants';
import { ActionType } from '../../helpers/assets';
import { modeForContext } from '../../helpers/borrow';
import { chainName } from '../../helpers/chains';
import { showPosition } from '../../helpers/navigation';
import { notify } from '../../helpers/notifications';
import { BasePosition } from '../../helpers/positions';
import { useAuth } from '../../store/auth.store';
import { useBorrow } from '../../store/borrow.store';
import ConfirmTransactionModal from '../Shared/ConfirmTransactionModal';
import SignTooltip from '../Shared/Tooltips/SignTooltip';
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
  const walletChain = useAuth((state) => state.chain);
  const changeChain = useAuth((state) => state.changeChain);
  const login = useAuth((state) => state.login);

  const collateral = useBorrow((state) => state.collateral);
  const debt = useBorrow((state) => state.debt);
  const needsSignature = useBorrow((state) => state.needsSignature);
  const isSigning = useBorrow((state) => state.isSigning);
  const isExecuting = useBorrow((state) => state.isExecuting);
  const transactionMeta = useBorrow((state) => state.transactionMeta);
  const metaStatus = useBorrow((state) => state.transactionMeta.status);
  const availableVaultStatus = useBorrow(
    (state) => state.availableVaultsStatus
  );
  const availableRoutes = useBorrow((state) => state.availableRoutes);
  const vault = useBorrow((state) => state.activeVault);
  const mode = useBorrow((state) => state.mode);
  const changeMode = useBorrow((state) => state.changeMode);
  const changeInputValues = useBorrow((state) => state.changeInputValues);
  const updateBalances = useBorrow((state) => state.updateBalances);
  const updateVault = useBorrow((state) => state.updateVault);
  const allow = useBorrow((state) => state.allow);
  const updateAllowance = useBorrow((state) => state.updateAllowance);
  const updateTokenPrice = useBorrow((state) => state.updateTokenPrice);
  const signAndExecute = useBorrow((state) => state.signAndExecute);

  const { position, editedPosition } = basePosition;

  const dynamicLtvMeta = {
    ltv: editedPosition ? editedPosition.ltv : position.ltv,
    ltvMax: editedPosition ? editedPosition.ltvMax * 100 : position.ltvMax, // TODO: Shouldn't have to do this
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

  const shouldSignTooltipBeShown = useMemo(() => {
    return (
      availableVaultStatus === 'ready' &&
      !(!isEditing && hasBalanceInVault) &&
      needsSignature
    );
  }, [availableVaultStatus, needsSignature, hasBalanceInVault, isEditing]);

  useEffect(() => {
    if (address) {
      updateBalances('collateral');
      updateBalances('debt');
      updateAllowance('collateral');
      updateAllowance('debt');
      updateVault();
    }
  }, [address, updateBalances, updateAllowance, updateVault]);

  useEffect(() => {
    updateTokenPrice('collateral');
    updateTokenPrice('debt');
  }, [updateTokenPrice]);

  useEffect(() => {
    changeInputValues('', '');
  }, [actionType, changeInputValues]);

  useEffect(() => {
    (async () => {
      if (address && vault) {
        // Should probably pair/replace this with the position object?
        const balance = await vault.getBalances(Address.from(address));

        const hasBalance = balance.deposit.gt(DUST_AMOUNT_IN_WEI);
        setHasBalanceInVault(hasBalance);
      }
    })();
  }, [address, vault]);

  useEffect(() => {
    const mode = modeForContext(
      isEditing,
      actionType,
      Number(collateral.input),
      Number(debt.input)
    );
    changeMode(mode);
  }, [changeMode, isEditing, collateral.input, debt.input, actionType]);

  const proceedWithConfirmation = (action: () => void) => {
    setConfirmationModalAction(() => action);
    setIsConfirmationModalShown(true);
  };

  return (
    <>
      <Card sx={{ maxWidth: '500px', margin: 'auto' }}>
        <CardContent sx={{ width: '100%', p: '1.5rem 2rem' }}>
          <BorrowHeader
            chainName={chainName(debt.chainId)}
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
            const type = index === collateralIndex ? 'collateral' : 'debt';
            const balance = assetChange.balances[assetChange.token.symbol];
            const debtAmount = position.debt.amount;
            const maxAmount =
              type === 'debt' && debtAmount && debtAmount < balance
                ? debtAmount
                : balance;
            const showLtv = type === 'debt' && actionType === ActionType.ADD;
            return (
              <BorrowBox
                key={type}
                type={type}
                mode={mode}
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

          {!isEditing &&
            hasBalanceInVault &&
            (collateral.input || debt.input) && (
              <Box mb={2}>
                <WarningInfo
                  text={
                    "Note: We've noticed that you have an open position based on your selection. You may proceed to manage it. But if you're trying to open a similar position on a different network, please select an alternate route."
                  }
                />
              </Box>
            )}

          <BorrowButton
            address={address}
            collateral={collateral}
            debt={debt}
            position={position}
            walletChain={walletChain}
            ltvMeta={dynamicLtvMeta}
            metaStatus={metaStatus}
            needsSignature={needsSignature}
            isSigning={isSigning}
            isExecuting={isExecuting}
            availableVaultStatus={availableVaultStatus}
            mode={mode}
            isEditing={isEditing}
            actionType={actionType}
            hasBalanceInVault={hasBalanceInVault}
            onLoginClick={() => login()}
            onChainChangeClick={(chainId) => changeChain(chainId)}
            onApproveClick={(type) => allow(type)}
            onRedirectClick={(borrow) => {
              if (borrow) {
                router.push(PATH.BORROW);
              } else {
                showPosition(router, walletChain?.id, vault, false);
              }
            }}
            onClick={signAndExecute}
            withConfirmation={proceedWithConfirmation}
          />

          <ConnextFooter />
        </CardContent>
      </Card>
      <RoutingModal
        open={showRoutingModal}
        handleClose={() => setShowRoutingModal(false)}
      />
      <ConfirmTransactionModal
        open={isConfirmationModalShown}
        onClose={() => setIsConfirmationModalShown(false)}
        collateral={collateral}
        debt={debt}
        basePosition={basePosition}
        transactionMeta={transactionMeta}
        action={() => {
          setIsConfirmationModalShown(false);
          confirmationModalAction();
        }}
      />
    </>
  );
}

export default Borrow;

Borrow.defaultProps = {
  position: false,
};
