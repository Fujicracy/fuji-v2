import { defaultAbiCoder } from '@ethersproject/abi';
import invariant from 'tiny-invariant';

import { RouterAction } from '../enums';
import { RouterActionParams } from '../types';

export function encodeActionArgs(params: RouterActionParams): string {
  if (params.action === RouterAction.DEPOSIT) {
    return defaultAbiCoder.encode(
      ['address', 'uint256', 'address', 'address'],
      [
        params.vault.value,
        params.amount.toString(),
        params.receiver.value,
        params.sender.value,
      ]
    );
  } else if (params.action === RouterAction.PERMIT_BORROW) {
    invariant(
      params.deadline && params.v && params.r && params.s,
      'Missing args in PERMIT_BORROW!'
    );
    return defaultAbiCoder.encode(
      [
        'address',
        'address',
        'address',
        'uint256',
        'uint256',
        'uint8',
        'bytes32',
        'bytes32',
      ],
      [
        params.vault.value,
        params.owner.value,
        params.spender.value,
        params.amount.toString(),
        params.deadline.toString(),
        params.v.toString(),
        params.r,
        params.s,
      ]
    );
  } else if (params.action === RouterAction.BORROW) {
    return defaultAbiCoder.encode(
      ['address', 'uint256', 'address', 'address'],
      [
        params.vault.value,
        params.amount.toString(),
        params.receiver.value,
        params.owner.value,
      ]
    );
  } else if (params.action === RouterAction.X_TRANSFER) {
    return defaultAbiCoder.encode(
      ['uint256', 'address', 'uint256', 'address'],
      [
        params.destDomain,
        params.asset.value,
        params.amount.toString(),
        params.receiver.value,
      ]
    );
  } else if (params.action === RouterAction.X_TRANSFER_WITH_CALL) {
    const innerActions = params.innerActions.map(({ action }) => action);
    const innerArgs = params.innerActions.map(encodeActionArgs);
    const callData = defaultAbiCoder.encode(
      ['uint256[]', 'bytes[]'],
      [innerActions, innerArgs]
    );
    return defaultAbiCoder.encode(
      ['uint256', 'address', 'uint256', 'bytes'],
      [
        params.destDomain,
        params.asset.value,
        params.amount.toString(),
        callData,
      ]
    );
  }
  // TODO other actions
  return '';
}
