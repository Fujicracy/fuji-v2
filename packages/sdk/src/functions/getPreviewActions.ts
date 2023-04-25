import { BigNumber } from '@ethersproject/bignumber';
import { AddressZero } from '@ethersproject/constants';

import { CONNEXT_ROUTER_ADDRESS } from '../constants/addresses';
import { CHAIN } from '../constants/chains';
import { DEFAULT_SLIPPAGE } from '../constants/common';
import { Address } from '../entities/Address';
import { BorrowingVault } from '../entities/BorrowingVault';
import { Token } from '../entities/Token';
import {
  ChainId,
  ConnextDomain,
  OperationType,
  PreviewName,
  RouterAction,
} from '../enums';
import {
  BorrowPreviewParams,
  DepositAndBorrowPreviewParams,
  DepositPreviewParams,
  PaybackAndWithdrawPreviewParams,
  PaybackPreviewParams,
  PreviewParams,
  WithdrawPreviewParams,
} from '../types';
import {
  BorrowParams,
  DepositParams,
  PaybackParams,
  PermitParams,
  RouterActionParams,
  WithdrawParams,
  XTransferParams,
  XTransferWithCallParams,
} from '../types/RouterActionParams';

function _depositOrPayback(
  action: RouterAction.DEPOSIT | RouterAction.PAYBACK,
  vault: BorrowingVault,
  amount: BigNumber,
  receiver: Address,
  sender: Address
): DepositParams | PaybackParams {
  return {
    action,
    vault: vault.address,
    amount,
    receiver,
    sender,
  };
}

function _borrowOrWithdraw(
  action: RouterAction.BORROW | RouterAction.WITHDRAW,
  vault: BorrowingVault,
  amount: BigNumber,
  receiver: Address,
  owner: Address
): BorrowParams | WithdrawParams {
  return {
    action,
    vault: vault.address,
    amount,
    receiver,
    owner,
  };
}

function _permit(
  action: RouterAction.BORROW | RouterAction.WITHDRAW,
  vault: BorrowingVault,
  amount: BigNumber,
  receiver: Address,
  owner: Address,
  deadline?: number
): PermitParams {
  // set deadline to approx. 24h
  const oneDayLater: number = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
  return {
    action:
      action === RouterAction.BORROW
        ? RouterAction.PERMIT_BORROW
        : RouterAction.PERMIT_WITHDRAW,
    vault: vault.address,
    amount,
    receiver,
    owner,
    deadline: deadline ?? oneDayLater,
  };
}

function _xTransfer(
  destChainId: ChainId,
  asset: Token,
  amount: BigNumber,
  receiver: Address,
  sender: Address,
  slippage?: number
): XTransferParams {
  const destDomain = CHAIN[destChainId].connextDomain as ConnextDomain;
  return {
    action: RouterAction.X_TRANSFER,
    destDomain,
    slippage: slippage ?? DEFAULT_SLIPPAGE,
    amount,
    asset: asset.address,
    receiver: receiver,
    sender,
  };
}

function _xTransferWithCall(
  destChainId: ChainId,
  asset: Token,
  amount: BigNumber,
  innerActions: RouterActionParams[],
  slippage?: number
): XTransferWithCallParams {
  const destDomain = CHAIN[destChainId].connextDomain as ConnextDomain;
  return {
    action: RouterAction.X_TRANSFER_WITH_CALL,
    destDomain,
    amount,
    asset: asset.address,
    slippage: slippage ?? DEFAULT_SLIPPAGE,
    innerActions,
  };
}

function depositOrPayback(
  action: RouterAction.DEPOSIT | RouterAction.PAYBACK,
  op: OperationType,
  params: DepositPreviewParams | PaybackPreviewParams
): RouterActionParams[] {
  const { vault, tokenIn, amountIn, account, slippage } = params;

  if (op === OperationType.ONE_CHAIN) {
    // everything happens on the same chain
    return [_depositOrPayback(action, vault, amountIn, account, account)];
  } else {
    // transfer from chain A and deposit/payback on chain B
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];
    return [
      _xTransferWithCall(
        vault.chainId,
        tokenIn,
        amountIn,
        [_depositOrPayback(action, vault, amountIn, account, connextRouter)],
        slippage
      ),
    ];
  }
}

function borrowOrWithdraw(
  action: RouterAction.BORROW | RouterAction.WITHDRAW,
  op: OperationType,
  params: BorrowPreviewParams | WithdrawPreviewParams
): RouterActionParams[] {
  const { vault, tokenOut, amountOut, account, deadline, slippage } = params;
  if (op === OperationType.ONE_CHAIN) {
    // everything happens on the same chain
    return [
      _permit(action, vault, amountOut, account, account, deadline),
      _borrowOrWithdraw(action, vault, amountOut, account, account),
    ];
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_SRC) {
    // start from chain A, borrow on chain A and transfer to chain B
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];

    return [
      _permit(action, vault, amountOut, connextRouter, account, deadline),
      _borrowOrWithdraw(action, vault, amountOut, connextRouter, account),
      _xTransfer(
        tokenOut.chainId,
        vault.debt,
        amountOut,
        account,
        connextRouter,
        slippage
      ),
    ];
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_DEST) {
    // start from chain A and borrow on chain B where's also the position
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];
    const innerActions = [
      _permit(action, vault, amountOut, connextRouter, account, deadline),
      _borrowOrWithdraw(action, vault, amountOut, connextRouter, account),
    ];
    return [
      _xTransferWithCall(
        vault.chainId,
        { address: Address.from(AddressZero) } as Token,
        BigNumber.from(0),
        innerActions,
        0
      ),
    ];
  } else {
    // start from chain A, borrow on chain B where's also the position and transfer to chain C
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];
    const innerActions = [
      _permit(action, vault, amountOut, connextRouter, account, deadline),
      _borrowOrWithdraw(action, vault, amountOut, connextRouter, account),
      _xTransfer(
        tokenOut.chainId,
        vault.debt,
        amountOut,
        account,
        connextRouter,
        slippage
      ),
    ];
    return [
      _xTransferWithCall(
        vault.chainId,
        { address: Address.from(AddressZero) } as Token,
        BigNumber.from(0),
        innerActions,
        0
      ),
    ];
  }
}

/********** Combo Previews ***********/

function depositAndBorrow(
  op: OperationType,
  params: DepositAndBorrowPreviewParams
): RouterActionParams[] {
  const {
    vault,
    srcChainId,
    amountIn,
    tokenIn,
    tokenOut,
    amountOut,
    account,
    deadline,
    slippage,
  } = params;

  const destChainId = tokenOut.chainId;
  const DEPOSIT = RouterAction.DEPOSIT;
  const BORROW = RouterAction.BORROW;

  if (op === OperationType.ONE_CHAIN) {
    // everything happens on the same chain
    return [
      _depositOrPayback(DEPOSIT, vault, amountIn, account, account),
      _permit(BORROW, vault, amountOut, account, account, deadline),
      _borrowOrWithdraw(BORROW, vault, amountOut, account, account),
    ];
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_SRC) {
    // deposit and borrow on chain A and transfer to chain B
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[srcChainId];
    return [
      _depositOrPayback(DEPOSIT, vault, amountIn, account, account),
      _permit(BORROW, vault, amountOut, connextRouter, account, deadline),
      _borrowOrWithdraw(BORROW, vault, amountOut, connextRouter, account),
      _xTransfer(
        destChainId,
        vault.debt,
        amountOut,
        account,
        connextRouter,
        slippage
      ),
    ];
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_DEST) {
    // transfer from chain A and deposit and borrow on chain B
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[destChainId];
    const innerActions = [
      _depositOrPayback(DEPOSIT, vault, amountIn, account, connextRouter),
      _permit(BORROW, vault, amountOut, account, account, deadline),
      _borrowOrWithdraw(BORROW, vault, amountOut, account, account),
    ];
    return [
      _xTransferWithCall(
        destChainId,
        tokenIn,
        amountIn,
        innerActions,
        slippage
      ),
    ];
  } else {
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];
    const innerActions = [
      _depositOrPayback(DEPOSIT, vault, amountIn, account, connextRouter),
      _permit(BORROW, vault, amountOut, connextRouter, account, deadline),
      _borrowOrWithdraw(BORROW, vault, amountOut, connextRouter, account),
      _xTransfer(
        destChainId,
        vault.debt,
        amountOut,
        account,
        connextRouter,
        slippage
      ),
    ];
    return [
      _xTransferWithCall(
        vault.chainId,
        tokenIn,
        amountIn,
        innerActions,
        slippage
      ),
    ];
  }
}

function paybackAndWithdraw(
  op: OperationType,
  params: PaybackAndWithdrawPreviewParams
): RouterActionParams[] {
  const {
    vault,
    srcChainId,
    amountIn,
    tokenIn,
    tokenOut,
    amountOut,
    account,
    deadline,
    slippage,
  } = params;

  const destChainId = tokenOut.chainId;
  const PAYBACK = RouterAction.PAYBACK;
  const WITHDRAW = RouterAction.WITHDRAW;

  if (op === OperationType.ONE_CHAIN) {
    // everything happens on the same chain
    return [
      _depositOrPayback(PAYBACK, vault, amountIn, account, account),
      _permit(WITHDRAW, vault, amountOut, account, account, deadline),
      _borrowOrWithdraw(WITHDRAW, vault, amountOut, account, account),
    ];
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_SRC) {
    // payback and withdraw on chain A and transfer to chain B
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[srcChainId];
    return [
      _depositOrPayback(PAYBACK, vault, amountIn, account, account),
      _permit(WITHDRAW, vault, amountOut, connextRouter, account, deadline),
      _borrowOrWithdraw(WITHDRAW, vault, amountOut, connextRouter, account),
      _xTransfer(
        destChainId,
        vault.collateral,
        amountOut,
        account,
        connextRouter,
        slippage
      ),
    ];
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_DEST) {
    // transfer from chain A and payback and withdraw on chain B
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[destChainId];
    const innerActions = [
      _depositOrPayback(PAYBACK, vault, amountIn, account, connextRouter),
      _permit(WITHDRAW, vault, amountOut, account, account, deadline),
      _borrowOrWithdraw(WITHDRAW, vault, amountOut, account, account),
    ];
    return [
      _xTransferWithCall(
        destChainId,
        tokenIn,
        amountIn,
        innerActions,
        slippage
      ),
    ];
  } else {
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];
    const innerActions = [
      _depositOrPayback(PAYBACK, vault, amountIn, account, connextRouter),
      _permit(WITHDRAW, vault, amountOut, connextRouter, account, deadline),
      _borrowOrWithdraw(WITHDRAW, vault, amountOut, connextRouter, account),
      _xTransfer(
        destChainId,
        vault.collateral,
        amountOut,
        account,
        connextRouter,
        slippage
      ),
    ];
    return [
      _xTransferWithCall(
        vault.chainId,
        tokenIn,
        amountIn,
        innerActions,
        slippage
      ),
    ];
  }
}

export function getPreviewActions(
  operation: OperationType,
  params: PreviewParams
): RouterActionParams[] {
  const { name } = params;

  if (name === PreviewName.DEPOSIT) {
    return depositOrPayback(RouterAction.DEPOSIT, operation, params);
  } else if (name === PreviewName.BORROW) {
    return borrowOrWithdraw(RouterAction.BORROW, operation, params);
  } else if (name === PreviewName.PAYBACK) {
    return depositOrPayback(RouterAction.PAYBACK, operation, params);
  } else if (name === PreviewName.WITHDRAW) {
    return borrowOrWithdraw(RouterAction.WITHDRAW, operation, params);
  } else if (name === PreviewName.DEPOSIT_AND_BORROW) {
    return depositAndBorrow(operation, params);
  } else {
    return paybackAndWithdraw(operation, params);
  }
}
