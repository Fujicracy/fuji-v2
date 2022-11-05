import { defaultAbiCoder } from '@ethersproject/abi';
import { BigNumber } from '@ethersproject/bignumber';
import { keccak256 } from '@ethersproject/solidity';
import { arrayify, concat, toUtf8Bytes } from 'ethers/lib/utils';

import { RouterAction } from '../enums';
import { PermitParams } from '../types';

//"PermitBorrow(address owner,address spender,uint256 amount,uint256 nonce,uint256 deadline)"
const PERMIT_BORROW_TYPEHASH =
  '0xd67cb09e55b62944fd984ba5e925eef80308cef31f020a8b69ce81715dc12f93';

//"PermitWithdraw(address owner,address spender,uint256 amount,uint256 nonce,uint256 deadline)"
const PERMIT_WITHDRAW_TYPEHASH =
  '0xfdcf6aadd7cc7bc23e48366f2a276a0b759febae6efb52f5169a05e5f4595e6e';

export function getPermitDigest(
  params: PermitParams,
  nonce: BigNumber,
  domainSeparator: string
): string {
  const { action, owner, spender, amount, deadline } = params;

  const typehash =
    action === RouterAction.PERMIT_BORROW
      ? PERMIT_BORROW_TYPEHASH
      : PERMIT_WITHDRAW_TYPEHASH;

  const structHash: string = keccak256(
    ['bytes'],
    [
      defaultAbiCoder.encode(
        ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
        [
          typehash,
          owner.value,
          spender.value,
          amount.toString(),
          nonce.toString(),
          deadline?.toString(),
        ]
      ),
    ]
  );

  const encodePacked = concat([
    toUtf8Bytes('\x19\x01'),
    arrayify(domainSeparator),
    arrayify(structHash),
  ]);

  return keccak256(['bytes'], [encodePacked]);
}
