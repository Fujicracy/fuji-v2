import { ActionType, Mode } from "./assets"

export function modeForContext(
  isEditing: boolean,
  actionType: ActionType,
  collateral: number,
  debt: number
): Mode {
  if (!isEditing) return Mode.DEPOSIT_AND_BORROW
  if ((collateral > 0 && debt > 0) || (collateral === 0 && debt === 0)) {
    return ActionType.ADD === actionType
      ? Mode.DEPOSIT_AND_BORROW
      : Mode.PAYBACK_AND_WITHDRAW
  } else if (collateral > 0) {
    return ActionType.ADD === actionType ? Mode.DEPOSIT : Mode.WITHDRAW
  } else if (debt > 0) {
    return ActionType.ADD === actionType ? Mode.BORROW : Mode.PAYBACK
  }
  return Mode.DEPOSIT_AND_BORROW
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
  )
}
