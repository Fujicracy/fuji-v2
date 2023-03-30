import { BorrowingVault, Token, VaultWithFinancials } from '@x-fuji/sdk';
import { NextRouter } from 'next/router';

import { sdk } from '../services/sdk';
import { useBorrow } from '../store/borrow.store';
import { usePositions } from '../store/positions.store';
import { chainName, hexToChainId } from './chains';

type Page = {
  title: string;
  path: string;
};
export const topLevelPages: Page[] = [
  { title: 'Markets', path: '/markets' },
  { title: 'Borrow', path: '/borrow' },
  { title: 'Lend', path: '/lend' },
  { title: 'My positions', path: '/my-positions' },
];
if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
  topLevelPages.push({ title: 'Theming', path: '/theming' }); // Design testing
}

export const myPositionPage: Page = {
  title: 'Position',
  path: '/my-positions/[pid]',
};

export const isTopLevelUrl = (url: string) =>
  topLevelPages.find((p) => p.path === url);

export const showPosition = async (
  router: NextRouter,
  walletChainId: string | undefined,
  entity?: BorrowingVault | VaultWithFinancials,
  reset = true
) => {
  const vault = entity instanceof BorrowingVault ? entity : entity?.vault;
  if (!vault) return;

  const changeAll = useBorrow.getState().changeAll;
  const isSupported =
    walletChainId && chainName(hexToChainId(walletChainId)) !== '';
  if (isSupported) {
    const collaterals = sdk.getCollateralForChain(Number(walletChainId));
    const collateralToken = collaterals.find(
      (t: Token) => t.symbol === vault.collateral.symbol
    );
    changeAll(collateralToken ?? vault.collateral, vault.debt, vault);
  } else {
    changeAll(vault.collateral, vault.debt, vault);
  }

  if (reset) {
    useBorrow.getState().changeInputValues('', '');
  }

  const positions = usePositions.getState().positions;
  if (positions?.find((p) => p.vault?.address.value === vault.address.value)) {
    router.push(`/my-positions/${vault.address.value}-${vault.chainId}`);
  } else {
    router.push(`/borrow`);
  }
};
