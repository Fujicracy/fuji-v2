import { Address, FujiError, VaultWithFinancials } from '@x-fuji/sdk';

import { sdk } from '../services/sdk';
import { ActionType, Mode } from './assets';
import { chains } from './chains';

export function modeForContext(
  isEditing: boolean,
  actionType: ActionType,
  collateral: number,
  debt: number
): Mode {
  if (!isEditing) return Mode.DEPOSIT_AND_BORROW;
  if ((collateral > 0 && debt > 0) || (collateral === 0 && debt === 0)) {
    return ActionType.ADD === actionType
      ? Mode.DEPOSIT_AND_BORROW
      : Mode.PAYBACK_AND_WITHDRAW;
  } else if (collateral > 0) {
    return ActionType.ADD === actionType ? Mode.DEPOSIT : Mode.WITHDRAW;
  } else if (debt > 0) {
    return ActionType.ADD === actionType ? Mode.BORROW : Mode.PAYBACK;
  }
  return Mode.DEPOSIT_AND_BORROW;
}

export const failureForMode = (
  mode: Mode,
  collateral: string | undefined,
  debt: string | undefined
): boolean => {
  return (
    ((mode === Mode.DEPOSIT_AND_BORROW || mode === Mode.PAYBACK_AND_WITHDRAW) &&
      (!collateral || !debt)) ||
    ((mode === Mode.DEPOSIT || mode === Mode.WITHDRAW) && !collateral) ||
    ((mode === Mode.BORROW || mode === Mode.PAYBACK) && !debt)
  );
};

/*
  Convenience function that calls the SDK to get all the vaults with 
  financials and returns both the data and errors.
*/
export const getAllBorrowingVaultFinancials = async (
  address: Address | undefined
): Promise<{ data: VaultWithFinancials[]; errors: FujiError[] }> => {
  const data: VaultWithFinancials[] = [];
  const errors: FujiError[] = [];

  for (let index = 0; index < chains.length; index++) {
    const chain = chains[index];
    const result = await sdk.getBorrowingVaultsFinancials(
      chain.chainId,
      address
    );
    if (result.success) {
      data.push(...result.data);
    } else {
      errors.push(result.error);
    }
  }

  return { data, errors };
};
