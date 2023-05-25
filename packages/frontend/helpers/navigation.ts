import {
  BorrowingVault,
  ChainId,
  Currency,
  VaultWithFinancials,
} from '@x-fuji/sdk';
import { NextRouter } from 'next/router';

import { PATH } from '../constants';
import { sdk } from '../services/sdk';
import { useBorrow } from '../store/borrow.store';
import { usePositions } from '../store/positions.store';
import { isSupported } from './chains';

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

export const showPosition = async (
  router: NextRouter,
  reset = true,
  entity?: BorrowingVault | VaultWithFinancials,
  walletChainId?: ChainId
) => {
  const vault = entity instanceof BorrowingVault ? entity : entity?.vault;
  if (!vault) return;

  const changeAll = useBorrow.getState().changeAll;
  if (walletChainId && isSupported(walletChainId)) {
    const collaterals = sdk.getCollateralForChain(walletChainId);
    const collateralCurrency = collaterals.find(
      (t: Currency) => t.symbol === vault.collateral.symbol
    );
    changeAll(collateralCurrency ?? vault.collateral, vault.debt, vault);
  } else {
    changeAll(vault.collateral, vault.debt, vault);
  }

  if (reset) {
    useBorrow.getState().changeInputValues('', '');
  }

  const positions = usePositions.getState().positions;
  if (positions?.some((p) => p.vault?.address.value === vault.address.value)) {
    router.push(`${PATH.MY_POSITIONS}/${vault.address.value}-${vault.chainId}`);
  } else {
    showBorrow(router, false);
  }
};

export const showBorrow = (router: NextRouter, override = true) => {
  // I'm not exactly thrilled about this solution, but it works for now
  useBorrow.getState().changeChainOverride(override);
  router.push(PATH.BORROW);
};
