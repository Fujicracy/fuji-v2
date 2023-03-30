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

import { DUST_AMOUNT } from '../../constants/borrow';
import { ActionType } from '../../helpers/assets';
import { modeForContext } from '../../helpers/borrow';
import { chainName } from '../../helpers/chains';
import { showPosition } from '../../helpers/navigation';
import { BasePosition } from '../../helpers/positions';
import { useAuth } from '../../store/auth.store';
import { useBorrow } from '../../store/borrow.store';
import LTVWarningModal from '../Shared/LTVWarningModal';
import SignTooltip from '../Shared/Tooltips/SignTooltip';
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

  const { position, futurePosition } = basePosition;

  const dynamicLtvMeta = {
    ltv: futurePosition ? futurePosition.ltv : position.ltv,
    ltvMax: futurePosition ? futurePosition.ltvMax * 100 : position.ltvMax, // TODO: Shouldn't have to do this
    ltvThreshold: futurePosition
      ? futurePosition.ltvThreshold
      : position.ltvThreshold,
  };

  const [showRoutingModal, setShowRoutingModal] = useState(false);
  const [actionType, setActionType] = useState(ActionType.ADD);
  const [hasBalanceInVault, setHasBalanceInVault] = useState(false);
  const [isLTVModalShown, setIsLTVModalShown] = useState(false);
  const [ltvModalAction, setLTVModalAction] = useState(() => () => {
    console.error('Invalid function called');
  });

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
        const hasBalance =
          balance.deposit.gt(DUST_AMOUNT) || balance.borrow.gt(DUST_AMOUNT);
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

  const proceedWithLTVCheck = (action: () => void) => {
    setLTVModalAction(() => action);
    // Checks if ltv close to max ltv
    dynamicLtvMeta.ltv >= dynamicLtvMeta.ltvMax - 5
      ? setIsLTVModalShown(true)
      : action();
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
                showMax={!showLtv}
                maxAmount={maxAmount}
                assetChange={assetChange}
                isEditing={isEditing}
                actionType={actionType}
                chainId={assetChange.chainId}
                isExecuting={isExecuting}
                value={assetChange.input}
                ltvMeta={dynamicLtvMeta}
              />
            );
          })}

          <Stack
            direction="row"
            m="1rem 0"
            justifyContent="space-between"
            onClick={() => {
              !isEditing &&
                !onMobile &&
                address &&
                availableRoutes.length > 0 &&
                setShowRoutingModal(true);
            }}
            sx={{ cursor: address && 'pointer' }}
          >
            <Typography variant="small">Route</Typography>
            <Typography variant="small">
              <u>
                {actionType === ActionType.ADD
                  ? `${chainName(collateral.chainId)} > ${chainName(
                      debt.chainId
                    )}`
                  : `${chainName(debt.chainId)} > ${chainName(
                      collateral.chainId
                    )}`}
              </u>
            </Typography>
          </Stack>
          <Box mb="1rem">
            <Fees />
          </Box>

          {shouldSignTooltipBeShown ? <SignTooltip /> : <></>}

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
                router.push('/borrow');
              } else {
                showPosition(router, walletChain?.id, vault, false);
              }
            }}
            onClick={signAndExecute}
            ltvCheck={proceedWithLTVCheck}
          />

          <ConnextFooter />
        </CardContent>
      </Card>
      <RoutingModal
        open={showRoutingModal}
        handleClose={() => setShowRoutingModal(false)}
      />
      <LTVWarningModal
        open={isLTVModalShown}
        ltv={dynamicLtvMeta.ltv}
        onClose={() => setIsLTVModalShown(false)}
        action={() => {
          setIsLTVModalShown(false);
          ltvModalAction();
        }}
      />
    </>
  );
}

export default Borrow;

Borrow.defaultProps = {
  position: false,
};
