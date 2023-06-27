import {
  BorrowingVault,
  ChainId,
  Currency,
  LendingVault,
  VaultWithFinancials,
} from '@x-fuji/sdk';
import { NextRouter } from 'next/router';

import { NAVIGATION_TASK_DELAY, PATH } from '../constants';
import { sdk } from '../services/sdk';
import { useBorrow } from '../store/borrow.store';
import { useNavigation } from '../store/navigation.store';
import { usePositions } from '../store/positions.store';
import { isSupported } from './chains';
import { vaultFromEntity } from './vaults';

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

export const showLendingPosition = (
  router: NextRouter,
  reset = true,
  entity?: LendingVault | VaultWithFinancials,
  walletChainId?: ChainId
) => {
  // TODO:
  console.log(router);
  console.log(reset);
  console.log(entity);
  console.log(walletChainId);
};

export const showBorrowPosition = async (
  router: NextRouter,
  reset = true,
  entity?: BorrowingVault | VaultWithFinancials,
  walletChainId?: ChainId
) => {
  const vault = vaultFromEntity(entity);
  if (!vault || !(vault instanceof BorrowingVault)) return;

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

  const positions = usePositions.getState().positions;
  if (
    positions?.some(
      (p) =>
        p.vault?.address.value === vault.address.value &&
        p.vault?.chainId === vault.chainId
    )
  ) {
    router.push(`${PATH.MY_POSITIONS}/${vault.address.value}-${vault.chainId}`);
  } else {
    showBorrow(router, false);
  }
};

export const showBorrow = async (router: NextRouter, override = true) => {
  // I'm not exactly thrilled about this solution, but it works for now
  useNavigation
    .getState()
    .changeBorrowPageShouldReset(override, !override ? true : undefined);
  router.push(PATH.BORROW);
};

export const shouldShowStoreNotification = (type: 'markets' | 'positions') =>
  useNavigation.getState().currentPath ===
  (type === 'markets' ? PATH.MARKETS : PATH.MARKETS);

export type BorrowPageNavigation = {
  shouldReset: boolean;
  willLoad: boolean;
  lock: boolean;
};

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
