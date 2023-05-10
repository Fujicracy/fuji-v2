import { BigNumber } from '@ethersproject/bignumber';
import { AddressZero } from '@ethersproject/constants';
import invariant from 'tiny-invariant';

import { CONNEXT_ROUTER_ADDRESS } from '../constants/addresses';
import { CHAIN } from '../constants/chains';
import { BN_ZERO, DEFAULT_SLIPPAGE } from '../constants/common';
import { Currency } from '../entities';
import { Address } from '../entities/Address';
import { BorrowingVault } from '../entities/BorrowingVault';
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
  UnwrapNativeParams,
  WithdrawParams,
  WrapNativeParams,
  XTransferParams,
  XTransferWithCallParams,
} from '../types/RouterActionParams';

function _depositOrPayback(
  action: RouterAction.DEPOSIT | RouterAction.PAYBACK,
  vault: BorrowingVault,
  amount: BigNumber,
  receiver: Address,
  sender: Address,
  wrap: boolean
): (DepositParams | PaybackParams | WrapNativeParams)[] {
  if (wrap) {
    return [
      _wrapNative(amount),
      {
        action,
        vault: vault.address,
        amount,
        receiver,
        // when wrapping, we need to change sender to be the router address
        // because the wrapped asset is already in the router
        // so we don't need to pull it from msg.sender
        sender: CONNEXT_ROUTER_ADDRESS[vault.chainId],
      },
    ];
  }
  return [
    {
      action,
      vault: vault.address,
      amount,
      receiver,
      sender,
    },
  ];
}

function _borrowOrWithdraw(
  action: RouterAction.BORROW | RouterAction.WITHDRAW,
  vault: BorrowingVault,
  amount: BigNumber,
  receiver: Address,
  owner: Address,
  unwrap: boolean
): (BorrowParams | WithdrawParams | UnwrapNativeParams)[] {
  if (unwrap) {
    return [
      {
        action,
        vault: vault.address,
        amount,
        // when unwrapping, we need to change receiver to be the router
        // because the router has to be in possession of the unwrapped asset
        receiver: CONNEXT_ROUTER_ADDRESS[vault.chainId],
        owner,
      },
      _unwrapNative(amount, receiver),
    ];
  }
  return [
    {
      action,
      vault: vault.address,
      amount,
      receiver,
      owner,
    },
  ];
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
  srcChainId: ChainId,
  destChainId: ChainId,
  currency: Currency,
  amount: BigNumber,
  receiver: Address,
  sender: Address,
  wrap: boolean,
  slippage?: number
): (XTransferParams | WrapNativeParams)[] {
  const destDomain = CHAIN[destChainId].connextDomain as ConnextDomain;
  if (wrap) {
    invariant(currency.isNative, 'Cannot wrap non-native assets!');
    return [
      _wrapNative(amount),
      {
        action: RouterAction.X_TRANSFER,
        destDomain,
        slippage: slippage ?? DEFAULT_SLIPPAGE,
        amount,
        asset: currency.wrapped.address,
        receiver: receiver,
        // when wrapping, we need to change sender to be the router address
        // because the wrapped asset is already in the router
        // so we don't need to pull it from msg.sender
        sender: CONNEXT_ROUTER_ADDRESS[srcChainId],
      },
    ];
  }
  return [
    {
      action: RouterAction.X_TRANSFER,
      destDomain,
      slippage: slippage ?? DEFAULT_SLIPPAGE,
      amount,
      asset: currency.address,
      receiver: receiver,
      sender,
    },
  ];
}

function _xTransferWithCall(
  srcChainId: ChainId,
  destChainId: ChainId,
  currency: Currency | undefined,
  amount: BigNumber,
  innerActions: RouterActionParams[],
  wrap: boolean,
  slippage?: number
): (XTransferWithCallParams | WrapNativeParams)[] {
  // TODO: uncomment sender when the router contract gets redeployed
  srcChainId;
  const destDomain = CHAIN[destChainId].connextDomain as ConnextDomain;
  if (wrap) {
    invariant(currency?.isNative, 'Cannot wrap non-native assets!');
    return [
      _wrapNative(amount),
      {
        action: RouterAction.X_TRANSFER_WITH_CALL,
        destDomain,
        amount,
        asset: currency.wrapped.address,
        slippage: slippage ?? DEFAULT_SLIPPAGE,
        // when wrapping, we need to change sender to be the router address
        // because the wrapped asset is already in the router
        // so we don't need to pull it from msg.sender
        //sender: CONNEXT_ROUTER_ADDRESS[srcChainId],
        innerActions,
      },
    ];
  }
  return [
    {
      action: RouterAction.X_TRANSFER_WITH_CALL,
      destDomain,
      amount,
      asset: currency ? currency.address : Address.from(AddressZero),
      slippage: slippage ?? DEFAULT_SLIPPAGE,
      innerActions,
    },
  ];
}

function _wrapNative(amount: BigNumber): WrapNativeParams {
  return {
    action: RouterAction.DEPOSIT_ETH,
    amount,
  };
}

function _unwrapNative(
  amount: BigNumber,
  receiver: Address
): UnwrapNativeParams {
  return {
    action: RouterAction.WITHDRAW_ETH,
    amount,
    receiver,
  };
}

function depositOrPayback(
  action: RouterAction.DEPOSIT | RouterAction.PAYBACK,
  op: OperationType,
  params: DepositPreviewParams | PaybackPreviewParams
): RouterActionParams[] {
  const { vault, tokenIn, amountIn, account, slippage } = params;

  const wrap = tokenIn.isNative;
  if (op === OperationType.ONE_CHAIN) {
    // everything happens on the same chain
    return [
      ..._depositOrPayback(action, vault, amountIn, account, account, wrap),
    ];
  } else {
    // transfer from chain A and deposit/payback on chain B
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];
    return [
      ..._xTransferWithCall(
        tokenIn.chainId,
        vault.chainId,
        tokenIn,
        amountIn,
        [
          ..._depositOrPayback(
            action,
            vault,
            amountIn,
            account,
            connextRouter,
            false
          ),
        ],
        wrap,
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
  const {
    vault,
    srcChainId,
    tokenOut,
    amountOut,
    account,
    deadline,
    slippage,
  } = params;
  const unwrap = tokenOut.isNative;

  if (op === OperationType.ONE_CHAIN) {
    // everything happens on the same chain
    return [
      _permit(action, vault, amountOut, account, account, deadline),
      ..._borrowOrWithdraw(action, vault, amountOut, account, account, unwrap),
    ];
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_SRC) {
    // start from chain A, borrow on chain A and transfer to chain B
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];

    return [
      _permit(action, vault, amountOut, connextRouter, account, deadline),
      ..._borrowOrWithdraw(
        action,
        vault,
        amountOut,
        connextRouter,
        account,
        false
      ),
      ..._xTransfer(
        vault.chainId,
        tokenOut.chainId,
        vault.debt,
        amountOut,
        account,
        connextRouter,
        false,
        slippage
      ),
    ];
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_DEST) {
    // start from chain A and borrow/withdraw on chain B where's also the position
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];
    const innerActions = [
      _permit(action, vault, amountOut, connextRouter, account, deadline),
      ..._borrowOrWithdraw(
        action,
        vault,
        amountOut,
        connextRouter,
        account,
        unwrap
      ),
    ];
    return [
      ..._xTransferWithCall(
        srcChainId,
        vault.chainId,
        undefined,
        BN_ZERO,
        innerActions,
        false,
        0
      ),
    ];
  } else {
    // start from chain A, borrow/withdraw on chain B where's also the position and transfer to chain C
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];
    const innerActions = [
      _permit(action, vault, amountOut, connextRouter, account, deadline),
      ..._borrowOrWithdraw(
        action,
        vault,
        amountOut,
        connextRouter,
        account,
        false
      ),
      ..._xTransfer(
        vault.chainId,
        tokenOut.chainId,
        vault.debt,
        amountOut,
        account,
        connextRouter,
        false,
        slippage
      ),
    ];
    return [
      ..._xTransferWithCall(
        srcChainId,
        vault.chainId,
        undefined,
        BN_ZERO,
        innerActions,
        false,
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
  const wrap = tokenIn.isNative;
  const unwrap = tokenOut.isNative;

  if (op === OperationType.ONE_CHAIN) {
    // everything happens on the same chain
    return [
      ..._depositOrPayback(DEPOSIT, vault, amountIn, account, account, wrap),
      _permit(BORROW, vault, amountOut, account, account, deadline),
      ..._borrowOrWithdraw(BORROW, vault, amountOut, account, account, unwrap),
    ];
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_SRC) {
    // deposit and borrow on chain A and transfer to chain B
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[srcChainId];
    return [
      ..._depositOrPayback(DEPOSIT, vault, amountIn, account, account, wrap),
      _permit(BORROW, vault, amountOut, connextRouter, account, deadline),
      ..._borrowOrWithdraw(
        BORROW,
        vault,
        amountOut,
        connextRouter,
        account,
        false
      ),
      ..._xTransfer(
        srcChainId,
        destChainId,
        vault.debt,
        amountOut,
        account,
        connextRouter,
        false,
        slippage
      ),
    ];
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_DEST) {
    // transfer from chain A and deposit and borrow on chain B
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[destChainId];
    const innerActions = [
      ..._depositOrPayback(
        DEPOSIT,
        vault,
        amountIn,
        account,
        connextRouter,
        false
      ),
      _permit(BORROW, vault, amountOut, account, account, deadline),
      ..._borrowOrWithdraw(BORROW, vault, amountOut, account, account, unwrap),
    ];
    return [
      ..._xTransferWithCall(
        srcChainId,
        destChainId,
        tokenIn,
        amountIn,
        innerActions,
        wrap,
        slippage
      ),
    ];
  } else {
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];
    const innerActions = [
      ..._depositOrPayback(
        DEPOSIT,
        vault,
        amountIn,
        account,
        connextRouter,
        false
      ),
      _permit(BORROW, vault, amountOut, connextRouter, account, deadline),
      ..._borrowOrWithdraw(
        BORROW,
        vault,
        amountOut,
        connextRouter,
        account,
        false
      ),
      ..._xTransfer(
        vault.chainId,
        destChainId,
        vault.debt,
        amountOut,
        account,
        connextRouter,
        false,
        slippage
      ),
    ];
    return [
      ..._xTransferWithCall(
        srcChainId,
        vault.chainId,
        tokenIn,
        amountIn,
        innerActions,
        wrap,
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
  const wrap = tokenIn.isNative;
  const unwrap = tokenOut.isNative;

  if (op === OperationType.ONE_CHAIN) {
    // everything happens on the same chain
    return [
      ..._depositOrPayback(PAYBACK, vault, amountIn, account, account, wrap),
      _permit(WITHDRAW, vault, amountOut, account, account, deadline),
      ..._borrowOrWithdraw(
        WITHDRAW,
        vault,
        amountOut,
        account,
        account,
        unwrap
      ),
    ];
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_SRC) {
    // payback and withdraw on chain A and transfer to chain B
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[srcChainId];
    return [
      ..._depositOrPayback(PAYBACK, vault, amountIn, account, account, wrap),
      _permit(WITHDRAW, vault, amountOut, connextRouter, account, deadline),
      ..._borrowOrWithdraw(
        WITHDRAW,
        vault,
        amountOut,
        connextRouter,
        account,
        false
      ),
      ..._xTransfer(
        srcChainId,
        destChainId,
        vault.collateral,
        amountOut,
        account,
        connextRouter,
        false,
        slippage
      ),
    ];
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_DEST) {
    // transfer from chain A and payback and withdraw on chain B
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[destChainId];
    const innerActions = [
      ..._depositOrPayback(
        PAYBACK,
        vault,
        amountIn,
        account,
        connextRouter,
        false
      ),
      _permit(WITHDRAW, vault, amountOut, account, account, deadline),
      ..._borrowOrWithdraw(
        WITHDRAW,
        vault,
        amountOut,
        account,
        account,
        unwrap
      ),
    ];
    return [
      ..._xTransferWithCall(
        srcChainId,
        destChainId,
        tokenIn,
        amountIn,
        innerActions,
        wrap,
        slippage
      ),
    ];
  } else {
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];
    const innerActions = [
      ..._depositOrPayback(
        PAYBACK,
        vault,
        amountIn,
        account,
        connextRouter,
        false
      ),
      _permit(WITHDRAW, vault, amountOut, connextRouter, account, deadline),
      ..._borrowOrWithdraw(
        WITHDRAW,
        vault,
        amountOut,
        connextRouter,
        account,
        false
      ),
      ..._xTransfer(
        vault.chainId,
        destChainId,
        vault.collateral,
        amountOut,
        account,
        connextRouter,
        false,
        slippage
      ),
    ];
    return [
      ..._xTransferWithCall(
        srcChainId,
        vault.chainId,
        tokenIn,
        amountIn,
        innerActions,
        wrap,
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
