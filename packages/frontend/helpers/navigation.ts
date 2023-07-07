import {
  AbstractVault,
  BorrowingVault,
  ChainId,
  Currency,
  LendingVault,
  VaultType,
  VaultWithFinancials,
} from '@x-fuji/sdk';
import { NextRouter } from 'next/router';

import { NAVIGATION_TASK_DELAY, PATH } from '../constants';
import { sdk } from '../services/sdk';
import { useBorrow } from '../store/borrow.store';
import { useLend } from '../store/lend.store';
import { useNavigation } from '../store/navigation.store';
import { usePositions } from '../store/positions.store';
import { isSupported } from './chains';
import { vaultFromEntity } from './vaults';

export type OperationPageNavigation = {
  shouldReset: boolean;
  willLoad: boolean;
  lock: boolean;
};

type Page = {
  title: string;
  path: string;
};

export const topLevelPages: Page[] = [
  { title: 'Markets', path: PATH.MARKETS },
  { title: 'Borrow', path: PATH.BORROW },
  { title: 'Lend', path: PATH.LEND },
  { title: 'My Positions', path: PATH.MY_POSITIONS },
];

export const myPositionPage: Page = {
  title: 'Position',
  path: PATH.POSITION,
};

export const isTopLevelUrl = (url: string) =>
  topLevelPages.some((p) => p.path === url);

const updateLendingStoreBeforeNavigation = (vault: LendingVault) => {
  useLend.getState().changeAll(vault, vault.collateral);
};

const updateBorrowingStoreBeforeNavigation = (
  vault: BorrowingVault,
  reset: boolean,
  walletChainId?: ChainId
) => {
  const changeAll = useBorrow.getState().changeAll;
  if (walletChainId && isSupported(walletChainId)) {
    const collaterals = sdk.getCollateralForChain(walletChainId);
    const collateralCurrency = collaterals.find(
      (t: Currency) => t.symbol === vault.collateral.symbol
    );
    changeAll(vault, collateralCurrency ?? vault.collateral, vault.debt);
  } else {
    changeAll(vault, vault.collateral, vault.debt);
  }

  if (reset) {
    useBorrow.getState().clearInputValues();
  }
};

export const showPosition = async (
  type: VaultType,
  router: NextRouter,
  reset = true,
  entity?: AbstractVault | VaultWithFinancials,
  walletChainId?: ChainId
) => {
  const vault = vaultFromEntity(entity);
  if (
    !vault
    // TODO: reverse comment when we will have real vaults
    // ||
    // (vault instanceof BorrowingVault && type === VaultType.LEND) ||
    // (vault instanceof LendingVault && type === VaultType.BORROW)
  )
    return;

  if (vault instanceof BorrowingVault) {
    updateBorrowingStoreBeforeNavigation(vault, reset, walletChainId);
  } else if (vault instanceof LendingVault) {
    updateLendingStoreBeforeNavigation(vault);
  }

  const positions =
    type === VaultType.BORROW
      ? usePositions.getState().borrowPositions
      : usePositions.getState().lendingPositions;
  if (
    positions?.some(
      (p) =>
        p.vault?.address.value === vault.address.value &&
        p.vault?.chainId === vault.chainId
    )
  ) {
    router.push(
      `${PATH.MY_POSITIONS}/${type === VaultType.BORROW ? 'borrow' : 'lend'}&${
        vault.address.value
      }-${vault.chainId}`
    );
  } else if (type === VaultType.BORROW) {
    showBorrow(router, false);
  } else {
    showLend(router, false);
  }
};

export const pathForVaultType = (type: VaultType) =>
  type === VaultType.BORROW ? PATH.BORROW : PATH.LEND;

export const showLend = async (router: NextRouter, override = true) => {
  showOperationPage(VaultType.LEND, router, override);
};

export const showBorrow = async (router: NextRouter, override = true) => {
  showOperationPage(VaultType.BORROW, router, override);
};

export const shouldShowStoreNotification = (type: 'markets' | 'positions') =>
  useNavigation.getState().currentPath ===
  (type === 'markets' ? PATH.MARKETS : PATH.MARKETS);

export const navigationalTaskDelay = (func: () => void) => {
  setTimeout(func, NAVIGATION_TASK_DELAY);
};

export const navigationalRunAndResetWithDelay = (
  callback: (value: boolean) => void,
  value: boolean
) => {
  callback(value);
  if (value) {
    setTimeout(() => {
      callback(false);
    }, NAVIGATION_TASK_DELAY * 2);
  }
};

const showOperationPage = (
  type: VaultType,
  router: NextRouter,
  override: boolean
) => {
  useNavigation
    .getState()
    .changePageShouldReset(type, override, !override ? true : undefined);
  router.push(pathForVaultType(type));
};
