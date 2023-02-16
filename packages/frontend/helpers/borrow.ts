export enum PositionAction {
  ADD = 0,
  REMOVE = 1,
}

export enum Mode {
  DEPOSIT_AND_BORROW, // addPosition: both collateral and debt
  PAYBACK_AND_WITHDRAW, // removePosition: both collateral and debt
  DEPOSIT, // addPosition: collateral
  BORROW, //addPosition: debt
  WITHDRAW, // removePosition: collateral
  REPAY, // removePosition: debt
}

export function modeForContext(
  managing: boolean,
  action: PositionAction,
  collateral: number,
  debt: number
): Mode {
  if (!managing) return Mode.DEPOSIT_AND_BORROW
  if ((collateral > 0 && debt > 0) || (collateral === 0 && debt === 0)) {
    return PositionAction.ADD === action
      ? Mode.DEPOSIT_AND_BORROW
      : Mode.PAYBACK_AND_WITHDRAW
  } else if (collateral > 0) {
    return PositionAction.ADD === action ? Mode.DEPOSIT : Mode.WITHDRAW
  } else if (debt > 0) {
    return PositionAction.ADD === action ? Mode.BORROW : Mode.REPAY
  }
  return Mode.DEPOSIT_AND_BORROW
}
