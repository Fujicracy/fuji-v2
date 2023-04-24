import { BigNumber } from '@ethersproject/bignumber';
import { AddressZero } from '@ethersproject/constants';

import { CONNEXT_ROUTER_ADDRESS } from '../constants/addresses';
import { CHAIN } from '../constants/chains';
import { DEFAULT_SLIPPAGE } from '../constants/common';
import { FujiResultSuccess } from '../entities';
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
  FujiResult,
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

function _deposit(
  vault: BorrowingVault,
  amount: BigNumber,
  receiver: Address,
  sender: Address
): DepositParams {
  return {
    action: RouterAction.DEPOSIT,
    vault: vault.address,
    amount,
    receiver,
    sender,
  };
}

function _withdraw(
  vault: BorrowingVault,
  amount: BigNumber,
  receiver: Address,
  owner: Address
): WithdrawParams {
  return {
    action: RouterAction.WITHDRAW,
    vault: vault.address,
    amount,
    receiver,
    owner,
  };
}

function _borrow(
  vault: BorrowingVault,
  amount: BigNumber,
  receiver: Address,
  owner: Address
): BorrowParams {
  return {
    action: RouterAction.BORROW,
    vault: vault.address,
    amount,
    receiver,
    owner,
  };
}

function _payback(
  vault: BorrowingVault,
  amount: BigNumber,
  receiver: Address,
  sender: Address
): PaybackParams {
  return {
    action: RouterAction.PAYBACK,
    vault: vault.address,
    amount,
    receiver,
    sender,
  };
}

function _permitBorrow(
  vault: BorrowingVault,
  amount: BigNumber,
  receiver: Address,
  owner: Address,
  deadline?: number
): PermitParams {
  // set deadline to approx. 24h
  const oneDayLater: number = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
  return {
    action: RouterAction.PERMIT_BORROW,
    vault: vault.address,
    amount,
    receiver,
    owner,
    deadline: deadline ?? oneDayLater,
  };
}

function _permitWithdraw(
  vault: BorrowingVault,
  amount: BigNumber,
  receiver: Address,
  owner: Address,
  deadline?: number
): PermitParams {
  // set deadline to approx. 24h
  const oneDayLater: number = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
  return {
    action: RouterAction.PERMIT_WITHDRAW,
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

function deposit(
  op: OperationType,
  params: DepositPreviewParams
): FujiResult<RouterActionParams[]> {
  const { vault, tokenIn, amountIn, account, slippage } = params;

  if (op === OperationType.ONE_CHAIN) {
    // everything happens on the same chain
    return new FujiResultSuccess([_deposit(vault, amountIn, account, account)]);
  } else {
    // transfer from chain A and deposit on chain B
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];
    const innerActions = [_deposit(vault, amountIn, account, connextRouter)];
    return new FujiResultSuccess([
      _xTransferWithCall(
        vault.chainId,
        tokenIn,
        amountIn,
        innerActions,
        slippage
      ),
    ]);
  }
}

function borrow(
  op: OperationType,
  params: BorrowPreviewParams
): FujiResult<RouterActionParams[]> {
  const { vault, tokenOut, amountOut, account, deadline, slippage } = params;
  if (op === OperationType.ONE_CHAIN) {
    // everything happens on the same chain
    return new FujiResultSuccess([
      _permitBorrow(vault, amountOut, account, account, deadline),
      _borrow(vault, amountOut, account, account),
    ]);
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_SRC) {
    // start from chain A, borrow on chain A and transfer to chain B
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];

    return new FujiResultSuccess([
      _permitBorrow(vault, amountOut, connextRouter, account, deadline),
      _borrow(vault, amountOut, connextRouter, account),
      _xTransfer(
        tokenOut.chainId,
        vault.debt,
        amountOut,
        account,
        connextRouter,
        slippage
      ),
    ]);
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_DEST) {
    // start from chain A and borrow on chain B where's also the position
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];
    const innerActions = [
      _permitBorrow(vault, amountOut, connextRouter, account, deadline),
      _borrow(vault, amountOut, connextRouter, account),
    ];
    return new FujiResultSuccess([
      _xTransferWithCall(
        vault.chainId,
        { address: Address.from(AddressZero) } as Token,
        BigNumber.from(0),
        innerActions,
        0
      ),
    ]);
  } else {
    // start from chain A, borrow on chain B where's also the position and transfer to chain C
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];
    const innerActions = [
      _permitBorrow(vault, amountOut, connextRouter, account, deadline),
      _borrow(vault, amountOut, connextRouter, account),
      _xTransfer(
        tokenOut.chainId,
        vault.debt,
        amountOut,
        account,
        connextRouter,
        slippage
      ),
    ];
    return new FujiResultSuccess([
      _xTransferWithCall(
        vault.chainId,
        { address: Address.from(AddressZero) } as Token,
        BigNumber.from(0),
        innerActions,
        0
      ),
    ]);
  }
}

function payback(
  op: OperationType,
  params: PaybackPreviewParams
): FujiResult<RouterActionParams[]> {
  const { vault, tokenIn, amountIn, account, slippage } = params;

  if (op === OperationType.ONE_CHAIN) {
    // everything happens on the same chain
    return new FujiResultSuccess([_payback(vault, amountIn, account, account)]);
  } else {
    // transfer from chain A and payback on chain B
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];
    const innerActions = [_payback(vault, amountIn, account, connextRouter)];
    return new FujiResultSuccess([
      _xTransferWithCall(
        vault.chainId,
        tokenIn,
        amountIn,
        innerActions,
        slippage
      ),
    ]);
  }
}

function withdraw(
  op: OperationType,
  params: WithdrawPreviewParams
): FujiResult<RouterActionParams[]> {
  const { vault, tokenOut, amountOut, account, deadline, slippage } = params;

  if (op === OperationType.ONE_CHAIN) {
    // everything happens on the same chain
    return new FujiResultSuccess([
      _permitWithdraw(vault, amountOut, account, account, deadline),
      _withdraw(vault, amountOut, account, account),
    ]);
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_SRC) {
    // start from chain A, withdraw to chain A and transfer to chain B
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];
    const xTransfer = _xTransfer(
      tokenOut.chainId,
      vault.collateral,
      amountOut,
      account,
      connextRouter,
      slippage
    );
    return new FujiResultSuccess([
      _permitWithdraw(vault, amountOut, connextRouter, account, deadline),
      _withdraw(vault, amountOut, connextRouter, account),
      xTransfer,
    ]);
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_DEST) {
    // start from chain A and withdraw to chain B where's also the position
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];
    const innerActions = [
      _permitWithdraw(vault, amountOut, connextRouter, account, deadline),
      _withdraw(vault, amountOut, connextRouter, account),
    ];
    return new FujiResultSuccess([
      _xTransferWithCall(
        vault.chainId,
        { address: Address.from(AddressZero) } as Token,
        BigNumber.from(0),
        innerActions,
        0
      ),
    ]);
  } else {
    return new FujiResultSuccess([]);
  }
}

/********** Combo Previews ***********/

function depositAndBorrow(
  op: OperationType,
  params: DepositAndBorrowPreviewParams
): FujiResult<RouterActionParams[]> {
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

  if (op === OperationType.ONE_CHAIN) {
    // everything happens on the same chain
    return new FujiResultSuccess([
      _deposit(vault, amountIn, account, account),
      _permitBorrow(vault, amountOut, account, account, deadline),
      _borrow(vault, amountOut, account, account),
    ]);
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_SRC) {
    // deposit and borrow on chain A and transfer to chain B
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[srcChainId];
    return new FujiResultSuccess([
      _deposit(vault, amountIn, account, account),
      _permitBorrow(vault, amountOut, connextRouter, account, deadline),
      _borrow(vault, amountOut, connextRouter, account),
      _xTransfer(
        destChainId,
        vault.debt,
        amountOut,
        account,
        connextRouter,
        slippage
      ),
    ]);
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_DEST) {
    // transfer from chain A and deposit and borrow on chain B
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[destChainId];
    const innerActions = [
      _deposit(vault, amountIn, account, connextRouter),
      _permitBorrow(vault, amountOut, account, account, deadline),
      _borrow(vault, amountOut, account, account),
    ];
    return new FujiResultSuccess([
      _xTransferWithCall(
        destChainId,
        tokenIn,
        amountIn,
        innerActions,
        slippage
      ),
    ]);
  } else {
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];
    const innerActions = [
      _deposit(vault, amountIn, account, connextRouter),
      _permitBorrow(vault, amountOut, connextRouter, account, deadline),
      _borrow(vault, amountOut, connextRouter, account),
      _xTransfer(
        destChainId,
        vault.debt,
        amountOut,
        account,
        connextRouter,
        slippage
      ),
    ];
    return new FujiResultSuccess([
      _xTransferWithCall(
        vault.chainId,
        tokenIn,
        amountIn,
        innerActions,
        slippage
      ),
    ]);
  }
}

function paybackAndWithdraw(
  op: OperationType,
  params: PaybackAndWithdrawPreviewParams
): FujiResult<RouterActionParams[]> {
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

  if (op === OperationType.ONE_CHAIN) {
    // everything happens on the same chain
    return new FujiResultSuccess([
      _payback(vault, amountIn, account, account),
      _permitWithdraw(vault, amountOut, account, account, deadline),
      _withdraw(vault, amountOut, account, account),
    ]);
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_SRC) {
    // payback and withdraw on chain A and transfer to chain B
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[srcChainId];
    return new FujiResultSuccess([
      _payback(vault, amountIn, account, account),
      _permitWithdraw(vault, amountOut, connextRouter, account, deadline),
      _withdraw(vault, amountOut, connextRouter, account),
      _xTransfer(
        destChainId,
        vault.collateral,
        amountOut,
        account,
        connextRouter,
        slippage
      ),
    ]);
  } else if (op === OperationType.TWO_CHAIN_VAULT_ON_DEST) {
    // transfer from chain A and payback and withdraw on chain B
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[destChainId];
    const innerActions = [
      _payback(vault, amountIn, account, connextRouter),
      _permitWithdraw(vault, amountOut, account, account, deadline),
      _withdraw(vault, amountOut, account, account),
    ];
    const xTransfer = _xTransferWithCall(
      destChainId,
      tokenIn,
      amountIn,
      innerActions,
      slippage
    );
    return new FujiResultSuccess([xTransfer]);
  } else {
    return new FujiResultSuccess([]);
  }
}

export function getPreviewActions(
  operation: OperationType,
  params: PreviewParams
): FujiResult<RouterActionParams[]> {
  const { name } = params;

  if (name === PreviewName.DEPOSIT) {
    return deposit(operation, params);
  } else if (name === PreviewName.BORROW) {
    return borrow(operation, params);
  } else if (name === PreviewName.PAYBACK) {
    return payback(operation, params);
  } else if (name === PreviewName.WITHDRAW) {
    return withdraw(operation, params);
  } else if (name === PreviewName.DEPOSIT_AND_BORROW) {
    return depositAndBorrow(operation, params);
  } else {
    return paybackAndWithdraw(operation, params);
  }
}
