import { RouterAction } from '../enums/RouterAction';
import { PermitParams, RouterActionParams } from '../types/RouterActionParams';

/**
 * Function to find PERMIT_BORROW or PERMIT_WITHDRAW action.
 *
 * @param params - array of actions
 */
export function findPermitAction(
  params: RouterActionParams[]
): PermitParams | undefined {
  for (const p of params) {
    if (
      p.action === RouterAction.PERMIT_BORROW ||
      p.action === RouterAction.PERMIT_WITHDRAW
    )
      return p;
    if (p.action === RouterAction.X_TRANSFER_WITH_CALL) {
      return findPermitAction(p.innerActions);
    }
  }

  return undefined;
}
