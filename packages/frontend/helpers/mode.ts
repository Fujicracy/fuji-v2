import { ActionType, Mode } from './assets';

export const lendingModeForContext = (actionType: ActionType) => {
  if (actionType === ActionType.REMOVE) {
    return Mode.WITHDRAW;
  }
  return Mode.DEPOSIT;
};

export const borrowingModeForContext = (
  isEditing: boolean,
  actionType: ActionType,
  collateral: number,
  debt?: number
) => {
  if (!isEditing || debt === undefined) return Mode.DEPOSIT_AND_BORROW;
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
};
