import { BigNumber } from '@ethersproject/bignumber';
import { AddressZero } from '@ethersproject/constants';
import invariant from 'tiny-invariant';

import { CONNEXT_ROUTER_ADDRESS } from '../constants/addresses';
import { CHAIN } from '../constants/chains';
import { BN_ZERO, DEFAULT_SLIPPAGE } from '../constants/common';
import { AbstractVault } from '../entities/abstract/AbstractVault';
import { Address } from '../entities/Address';
import { BorrowingVault } from '../entities/BorrowingVault';
import { Currency } from '../entities/Currency';
import { LendingVault } from '../entities/LendingVault';
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
  vault: AbstractVault,
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
  vault: AbstractVault,
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
  vault: AbstractVault,
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
  currency: Currency,
  amount: BigNumber,
  receiver: Address,
  sender: Address,
  unwrap: boolean,
  slippage?: number
): XTransferParams | XTransferWithCallParams {
  const destDomain = CHAIN[destChainId].connextDomain as ConnextDomain;
  // unwrap on destination
  if (unwrap) {
    invariant(currency.isToken, 'Cannot unwrap native assets!');
    return {
      action: RouterAction.X_TRANSFER_WITH_CALL,
      destDomain,
      amount,
      asset: currency.address,
      slippage: slippage ?? DEFAULT_SLIPPAGE,
      sender,
      innerActions: [_unwrapNative(amount, receiver)],
    };
  }
  return {
    action: RouterAction.X_TRANSFER,
    destDomain,
    slippage: slippage ?? DEFAULT_SLIPPAGE,
    amount,
    asset: currency.address,
    receiver,
    sender,
  };
}

function _xTransferWithCall(
  srcChainId: ChainId,
  destChainId: ChainId,
  currency: Currency | undefined,
  amount: BigNumber,
  sender: Address,
  innerActions: RouterActionParams[],
  wrap: boolean,
  slippage?: number
): (XTransferWithCallParams | WrapNativeParams)[] {
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
        sender: CONNEXT_ROUTER_ADDRESS[srcChainId],
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
      sender,
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

  if (vault instanceof LendingVault && action === RouterAction.PAYBACK) {
    invariant(
      action === RouterAction.PAYBACK,
      'No PAYBACK action on LendingVault!'
    );
  }

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
        account,
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
  if (vault instanceof LendingVault && action === RouterAction.BORROW) {
    invariant(
      action === RouterAction.BORROW,
      'No BORROW action on LendingVault!'
    );
  }
  const unwrap = tokenOut.isNative;
  const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];

  if (op === OperationType.ONE_CHAIN) {
    // everything happens on the same chain
    const receiver = unwrap ? connextRouter : account;
    return [
      _permit(action, vault, amountOut, receiver, account, deadline),
      ..._borrowOrWithdraw(action, vault, amountOut, account, account, unwrap),
    ];
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_SRC) {
    // start from chain A, borrow on chain A and transfer to chain B
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
      _xTransfer(
        tokenOut.chainId,
        action === RouterAction.BORROW && vault instanceof BorrowingVault
          ? vault.debt
          : vault.collateral,
        amountOut,
        account,
        connextRouter,
        unwrap,
        slippage
      ),
    ];
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_DEST) {
    // start from chain A and borrow/withdraw on chain B where's also the position
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
        account,
        innerActions,
        false,
        0
      ),
    ];
  } else {
    // start from chain A, borrow/withdraw on chain B where's also the position and transfer to chain C
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
      _xTransfer(
        tokenOut.chainId,
        action === RouterAction.BORROW && vault instanceof BorrowingVault
          ? vault.debt
          : vault.collateral,
        amountOut,
        account,
        connextRouter,
        unwrap,
        slippage
      ),
    ];
    return [
      ..._xTransferWithCall(
        srcChainId,
        vault.chainId,
        undefined,
        BN_ZERO,
        connextRouter,
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

  invariant(
    vault instanceof BorrowingVault,
    'No DEPOSIT_AND_BORROW on LendingVault!'
  );

  const destChainId = tokenOut.chainId;
  const DEPOSIT = RouterAction.DEPOSIT;
  const BORROW = RouterAction.BORROW;
  const wrap = tokenIn.isNative;
  const unwrap = tokenOut.isNative;

  if (op === OperationType.ONE_CHAIN) {
    // everything happens on the same chain
    const receiver = unwrap ? CONNEXT_ROUTER_ADDRESS[vault.chainId] : account;
    return [
      ..._depositOrPayback(DEPOSIT, vault, amountIn, account, account, wrap),
      _permit(BORROW, vault, amountOut, receiver, account, deadline),
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
      _xTransfer(
        destChainId,
        vault.debt,
        amountOut,
        account,
        connextRouter,
        unwrap,
        slippage
      ),
    ];
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_DEST) {
    // transfer from chain A and deposit and borrow on chain B
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[destChainId];
    const receiver = unwrap ? connextRouter : account;
    const innerActions = [
      ..._depositOrPayback(
        DEPOSIT,
        vault,
        amountIn,
        account,
        connextRouter,
        false
      ),
      _permit(BORROW, vault, amountOut, receiver, account, deadline),
      ..._borrowOrWithdraw(BORROW, vault, amountOut, account, account, unwrap),
    ];
    return [
      ..._xTransferWithCall(
        srcChainId,
        destChainId,
        tokenIn,
        amountIn,
        account,
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
      _xTransfer(
        destChainId,
        vault.debt,
        amountOut,
        account,
        connextRouter,
        unwrap,
        slippage
      ),
    ];
    return [
      ..._xTransferWithCall(
        srcChainId,
        vault.chainId,
        tokenIn,
        amountIn,
        account,
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

  invariant(
    vault instanceof BorrowingVault,
    'No PAYBACK_AND_WITHDRAW on LendingVault!'
  );

  const destChainId = tokenOut.chainId;
  const PAYBACK = RouterAction.PAYBACK;
  const WITHDRAW = RouterAction.WITHDRAW;
  const wrap = tokenIn.isNative;
  const unwrap = tokenOut.isNative;

  if (op === OperationType.ONE_CHAIN) {
    // everything happens on the same chain
    const receiver = unwrap ? CONNEXT_ROUTER_ADDRESS[vault.chainId] : account;
    return [
      ..._depositOrPayback(PAYBACK, vault, amountIn, account, account, wrap),
      _permit(WITHDRAW, vault, amountOut, receiver, account, deadline),
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
      _xTransfer(
        destChainId,
        vault.collateral,
        amountOut,
        account,
        connextRouter,
        unwrap,
        slippage
      ),
    ];
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_DEST) {
    // transfer from chain A and payback and withdraw on chain B
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[destChainId];
    const receiver = unwrap ? connextRouter : account;
    const innerActions = [
      ..._depositOrPayback(
        PAYBACK,
        vault,
        amountIn,
        account,
        connextRouter,
        false
      ),
      _permit(WITHDRAW, vault, amountOut, receiver, account, deadline),
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
        account,
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
      _xTransfer(
        destChainId,
        vault.collateral,
        amountOut,
        account,
        connextRouter,
        unwrap,
        slippage
      ),
    ];
    return [
      ..._xTransferWithCall(
        srcChainId,
        vault.chainId,
        tokenIn,
        amountIn,
        account,
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
