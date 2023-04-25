import { BigNumber } from '@ethersproject/bignumber';
import { AddressZero } from '@ethersproject/constants';

import {
  CHAIN,
  CONNEXT_ROUTER_ADDRESS,
  DEFAULT_SLIPPAGE,
  FujiErrorCode,
} from './constants';
import { LENDING_PROVIDERS } from './constants/lending-providers';
import {
  Address,
  BorrowingVault,
  FujiError,
  FujiResultError,
  FujiResultSuccess,
  Token,
} from './entities';
import { Chain } from './entities/Chain';
import {
  ChainId,
  OperationType,
  PreviewName,
  RouterAction,
  RoutingStep,
} from './enums';
import { getPreviewActions, getPreviewRoutingDetails } from './functions';
import { Nxtp } from './Nxtp';
import { FujiResult, FujiResultPromise, PreviewParams } from './types';
import { MetaRoutingResult } from './types/MetaRoutingResult';
import { PreviewResult } from './types/PreviewResult';
import {
  BorrowParams,
  DepositParams,
  PaybackParams,
  PermitParams,
  RouterActionParams,
  WithdrawParams,
  XTransferParams,
  XTransferWithCallParams,
} from './types/RouterActionParams';
import { RoutingStepDetails } from './types/RoutingStepDetails';

export class Previews {
  getOperationType(params: PreviewParams): FujiResult<OperationType> {
    const { name, vault, srcChainId } = params;
    if (name === PreviewName.DEPOSIT || name === PreviewName.PAYBACK) {
      if (params.tokenIn.chainId !== srcChainId) {
        return new FujiResultError('Unsupported DEPOSIT or PAYBACK operation!');
      }
      if (srcChainId === vault.chainId) {
        return new FujiResultSuccess(OperationType.ONE_CHAIN);
      } else {
        return new FujiResultSuccess(OperationType.TWO_CHAIN_VAULT_ON_DEST);
      }
    } else if (name === PreviewName.BORROW || name === PreviewName.WITHDRAW) {
      if (
        srcChainId == vault.chainId &&
        params.tokenOut.chainId === vault.chainId
      ) {
        return new FujiResultSuccess(OperationType.ONE_CHAIN);
      } else if (
        srcChainId === vault.chainId &&
        params.tokenOut.chainId !== vault.chainId
      ) {
        return new FujiResultSuccess(OperationType.TWO_CHAIN_VAULT_ON_SRC);
      } else if (
        srcChainId !== vault.chainId &&
        params.tokenOut.chainId === vault.chainId
      ) {
        return new FujiResultSuccess(OperationType.TWO_CHAIN_VAULT_ON_DEST);
      } else {
        return new FujiResultSuccess(OperationType.THREE_CHAIN);
      }
    } else {
      //PreviewName.DEPOSIT_AND_BORROW || PreviewName.PAYBACK_AND_WITHDRAW:
      const tokenOut = params.tokenOut;
      if (srcChainId === tokenOut.chainId && srcChainId == vault.chainId) {
        return new FujiResultSuccess(OperationType.ONE_CHAIN);
      } else if (
        srcChainId !== tokenOut.chainId &&
        srcChainId === vault.chainId
      ) {
        return new FujiResultSuccess(OperationType.TWO_CHAIN_VAULT_ON_SRC);
      } else if (
        srcChainId !== tokenOut.chainId &&
        tokenOut.chainId === vault.chainId
      ) {
        return new FujiResultSuccess(OperationType.TWO_CHAIN_VAULT_ON_DEST);
      } else {
        return new FujiResultSuccess(OperationType.THREE_CHAIN);
      }
    }
  }

  async get(params: PreviewParams): FujiResultPromise<PreviewResult> {
    const opResult = this.getOperationType(params);
    if (!opResult.success) return opResult;
    const operation = opResult.data;

    const actions = getPreviewActions(operation, params);
    const result = await getPreviewRoutingDetails(operation, params);
    if (!result.success) {
      return result;
    }
    return new FujiResultSuccess({
      actions,
      ...result.data,
    });
  }

  /********** Single Previews ***********/

  async deposit(
    vault: BorrowingVault,
    amountIn: BigNumber,
    tokenIn: Token,
    account: Address,
    slippage?: number
  ): FujiResultPromise<PreviewResult> {
    const srcChainId = tokenIn.chainId;

    const _slippage = slippage ?? DEFAULT_SLIPPAGE;

    let actions: RouterActionParams[] = [];
    if (srcChainId == vault.chainId) {
      // everything happens on the same chain
      actions = [this._deposit(vault, amountIn, account, account)];
    } else {
      // transfer from chain A and deposit on chain B
      const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];
      const innerActions = [
        this._deposit(vault, amountIn, account, connextRouter),
      ];
      const xTransferResult = this._xTransferWithCall(
        vault.chainId,
        tokenIn,
        amountIn,
        _slippage,
        innerActions
      );
      if (!xTransferResult.success) {
        return xTransferResult;
      }
      actions = [xTransferResult.data];
    }

    const result = await this.inflowRoutingDetails(
      RoutingStep.DEPOSIT,
      vault,
      amountIn,
      tokenIn
    );
    if (!result.success) {
      return result;
    }
    const { estimateTime, estimateSlippage, bridgeFee, steps } = result.data;
    return new FujiResultSuccess({
      actions,
      bridgeFee,
      steps,
      estimateTime,
      estimateSlippage,
    });
  }

  async borrow(
    vault: BorrowingVault,
    srcChainId: ChainId,
    amountOut: BigNumber,
    tokenOut: Token,
    account: Address,
    deadline?: number,
    slippage?: number
  ): FujiResultPromise<PreviewResult> {
    const _slippage = slippage ?? DEFAULT_SLIPPAGE;

    let actions: RouterActionParams[] = [];

    if (srcChainId == vault.chainId && tokenOut.chainId === vault.chainId) {
      // everything happens on the same chain
      actions = [
        this._permitBorrow(vault, amountOut, account, account, deadline),
        this._borrow(vault, amountOut, account, account),
      ];
    } else if (
      srcChainId === vault.chainId &&
      tokenOut.chainId !== vault.chainId
    ) {
      // start from chain A, borrow on chain A and transfer to chain B
      const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];

      const xTransferResult = this._xTransfer(
        tokenOut.chainId,
        vault.debt,
        amountOut,
        account,
        connextRouter,
        _slippage
      );
      if (!xTransferResult.success) {
        return xTransferResult;
      }
      actions = [
        this._permitBorrow(vault, amountOut, connextRouter, account, deadline),
        this._borrow(vault, amountOut, connextRouter, account),
        xTransferResult.data,
      ];
    } else if (
      srcChainId !== vault.chainId &&
      tokenOut.chainId === vault.chainId
    ) {
      // start from chain A and borrow on chain B where's also the position
      const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];
      const innerActions = [
        this._permitBorrow(vault, amountOut, connextRouter, account, deadline),
        this._borrow(vault, amountOut, connextRouter, account),
      ];
      const xTransferResult = this._xTransferWithCall(
        vault.chainId,
        { address: Address.from(AddressZero) } as Token,
        BigNumber.from(0),
        0,
        innerActions
      );
      if (!xTransferResult.success) {
        return xTransferResult;
      }
      actions = [xTransferResult.data];
    } else {
      // start from chain A, borrow on chain B where's also the position and transfer to chain C
      const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];
      const xTransferResultC = this._xTransfer(
        tokenOut.chainId,
        vault.debt,
        amountOut,
        account,
        connextRouter,
        _slippage
      );
      if (!xTransferResultC.success) {
        return xTransferResultC;
      }
      const innerActions = [
        this._permitBorrow(vault, amountOut, connextRouter, account, deadline),
        this._borrow(vault, amountOut, connextRouter, connextRouter),
        xTransferResultC.data,
      ];
      const xTransferResult = this._xTransferWithCall(
        vault.chainId,
        { address: Address.from(AddressZero) } as Token,
        BigNumber.from(0),
        0,
        innerActions
      );
      if (!xTransferResult.success) {
        return xTransferResult;
      }
      actions = [xTransferResult.data];
    }

    const result = await this.outflowRoutingDetails(
      RoutingStep.BORROW,
      vault,
      srcChainId,
      amountOut,
      tokenOut
    );
    if (!result.success) {
      return result;
    }
    const { estimateTime, estimateSlippage, bridgeFee, steps } = result.data;
    return new FujiResultSuccess({
      actions,
      bridgeFee,
      steps,
      estimateTime,
      estimateSlippage,
    });
  }

  async payback(
    vault: BorrowingVault,
    amountIn: BigNumber,
    tokenIn: Token,
    account: Address,
    slippage?: number
  ): FujiResultPromise<PreviewResult> {
    const srcChainId = tokenIn.chainId;

    const _slippage = slippage ?? DEFAULT_SLIPPAGE;

    let actions: RouterActionParams[] = [];
    if (srcChainId == vault.chainId) {
      // everything happens on the same chain
      actions = [this._payback(vault, amountIn, account, account)];
    } else {
      // transfer from chain A and payback on chain B
      const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];
      const innerActions = [
        this._payback(vault, amountIn, account, connextRouter),
      ];
      const xTransferResult = this._xTransferWithCall(
        vault.chainId,
        tokenIn,
        amountIn,
        _slippage,
        innerActions
      );
      if (!xTransferResult.success) {
        return xTransferResult;
      }
      actions = [xTransferResult.data];
    }

    const result = await this.inflowRoutingDetails(
      RoutingStep.PAYBACK,
      vault,
      amountIn,
      tokenIn
    );
    if (!result.success) {
      return result;
    }
    const { estimateTime, estimateSlippage, bridgeFee, steps } = result.data;
    return new FujiResultSuccess({
      actions,
      bridgeFee,
      steps,
      estimateTime,
      estimateSlippage,
    });
  }

  async withdraw(
    vault: BorrowingVault,
    srcChainId: ChainId,
    amountOut: BigNumber,
    tokenOut: Token,
    account: Address,
    deadline?: number,
    slippage?: number
  ): FujiResultPromise<PreviewResult> {
    const _slippage = slippage ?? DEFAULT_SLIPPAGE;

    let actions: RouterActionParams[] = [];

    if (srcChainId == vault.chainId && tokenOut.chainId === vault.chainId) {
      // everything happens on the same chain
      actions = [
        this._permitWithdraw(vault, amountOut, account, account, deadline),
        this._withdraw(vault, amountOut, account, account),
      ];
    } else if (
      srcChainId === vault.chainId &&
      tokenOut.chainId !== vault.chainId
    ) {
      // start from chain A, withdraw to chain A and transfer to chain B
      const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];
      const xTransferResult = this._xTransfer(
        tokenOut.chainId,
        vault.collateral,
        amountOut,
        account,
        connextRouter,
        _slippage
      );
      if (!xTransferResult.success) {
        return xTransferResult;
      }
      actions = [
        this._permitWithdraw(
          vault,
          amountOut,
          connextRouter,
          account,
          deadline
        ),
        this._withdraw(vault, amountOut, connextRouter, account),
        xTransferResult.data,
      ];
    } else if (
      srcChainId !== vault.chainId &&
      tokenOut.chainId === vault.chainId
    ) {
      // start from chain A and withdraw to chain B where's also the position
      const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];
      const innerActions = [
        this._permitWithdraw(
          vault,
          amountOut,
          connextRouter,
          account,
          deadline
        ),
        this._withdraw(vault, amountOut, connextRouter, account),
      ];
      const xTransferResult = this._xTransferWithCall(
        vault.chainId,
        { address: Address.from(AddressZero) } as Token,
        BigNumber.from(0),
        0,
        innerActions
      );
      if (!xTransferResult.success) {
        return xTransferResult;
      }
      actions = [xTransferResult.data];
    } else {
      return new FujiResultError('3-chain transfers are not enabled yet!');
    }

    const result = await this.outflowRoutingDetails(
      RoutingStep.WITHDRAW,
      vault,
      srcChainId,
      amountOut,
      tokenOut
    );
    if (!result.success) {
      return result;
    }
    const { estimateTime, estimateSlippage, bridgeFee, steps } = result.data;
    return new FujiResultSuccess({
      actions,
      bridgeFee,
      steps,
      estimateTime,
      estimateSlippage,
    });
  }

  /********** Combo Previews ***********/

  /**
   * Prepares and returns 1) the bundle of actions that will be send to the router
   * for a compound operation of deposit+borrow; 2) the steps to be taken in order to
   * accomplish the operation; 3) the bridge fee; 4) the estimate time to process the tx
   * in seconds
   *
   * @remarks
   * The array that is returned should be first passed to `BorrowingVault.needSignature`.
   * If one of the actions must be signed by the user, we have to obtain the digest
   * from `sdk.signPermitFor` and make the user sign it with their wallet. The last step is
   * to obtain the txData and the address of the router from `sdk.getTxDetails` which is to be
   * used in ethers.sendTransaction.
   *
   * @param vault - vault instance on which we want to open a position
   * @param amountIn - amount of provided collateral
   * @param amountOut - amount of loan
   * @param tokenIn - token with which user starts the operation
   * @param tokenOut - token that user want to borrow
   * @param account - user address, wrapped in {@link Address}
   * @param deadline - timestamp for validity of permit (defaults to 24h starting from now)
   * @param slippage - accepted slippage in BPS as 30 == 0.3% (defaults to 0.3%)
   */
  async depositAndBorrow(
    vault: BorrowingVault,
    amountIn: BigNumber,
    amountOut: BigNumber,
    tokenIn: Token,
    tokenOut: Token,
    account: Address,
    deadline?: number,
    slippage?: number
  ): FujiResultPromise<PreviewResult> {
    const srcChainId = tokenIn.chainId;
    const destChainId = tokenOut.chainId;

    const _slippage = slippage ?? DEFAULT_SLIPPAGE;

    let actions: RouterActionParams[] = [];
    if (srcChainId === destChainId && srcChainId == vault.chainId) {
      // everything happens on the same chain
      actions = [
        this._deposit(vault, amountIn, account, account),
        this._permitBorrow(vault, amountOut, account, account, deadline),
        this._borrow(vault, amountOut, account, account),
      ];
    } else if (srcChainId !== destChainId && srcChainId === vault.chainId) {
      // deposit and borrow on chain A and transfer to chain B
      const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[srcChainId];
      const xTransferResult = this._xTransfer(
        destChainId,
        vault.debt,
        amountOut,
        account,
        connextRouter,
        _slippage
      );
      if (!xTransferResult.success) {
        return xTransferResult;
      }
      actions = [
        this._deposit(vault, amountIn, account, account),
        this._permitBorrow(vault, amountOut, connextRouter, account, deadline),
        this._borrow(vault, amountOut, connextRouter, account),
        xTransferResult.data,
      ];
    } else if (srcChainId !== destChainId && destChainId === vault.chainId) {
      // transfer from chain A and deposit and borrow on chain B
      const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[destChainId];
      const innerActions = [
        this._deposit(vault, amountIn, account, connextRouter),
        this._permitBorrow(vault, amountOut, account, account, deadline),
        this._borrow(vault, amountOut, account, account),
      ];
      const xTransferResult = this._xTransferWithCall(
        destChainId,
        tokenIn,
        amountIn,
        _slippage,
        innerActions
      );
      if (!xTransferResult.success) {
        return xTransferResult;
      }
      actions = [xTransferResult.data];
    } else {
      return new FujiResultError('3-chain transfers are not enabled yet!');
    }

    const result = await this.depositAndBorrowRoutingDetails(
      vault,
      amountIn,
      amountOut,
      tokenIn,
      tokenOut
    );
    if (!result.success) {
      return result;
    }
    const { estimateTime, estimateSlippage, bridgeFee, steps } = result.data;
    return new FujiResultSuccess({
      actions,
      bridgeFee,
      steps,
      estimateTime,
      estimateSlippage,
    });
  }

  /**
   * Prepares and returns 1) the bundle of actions that will be send to the router
   * for a compound operation of payback+withdraw; 2) the steps to be taken in order to
   * accomplish the operation; 3) the bridge fee; 4) the estimate time to process the tx
   * in seconds
   *
   * @remarks
   * The array that is returned should be first passed to `BorrowingVault.needSignature`.
   * If one of the actions must be signed by the user, we have to obtain the digest
   * from `sdk.signPermitFor` and make the user sign it with their wallet. The last step is
   * to obtain the txData and the address of the router from `sdk.getTxDetails` which is to be
   * used in ethers.sendTransaction.
   *
   * @param vault - vault instance on which we want to open a position
   * @param amountIn - amount of provided collateral
   * @param amountOut - amount of loan
   * @param tokenIn - token with which user starts the operation
   * @param tokenOut - token that user want to borrow
   * @param account - user address, wrapped in {@link Address}
   * @param deadline - timestamp for validity of permit (defaults to 24h starting from now)
   * @param slippage - accepted slippage in BPS as 30 == 0.3% (defaults to 0.3%)
   */

  async paybackAndWithdraw(
    vault: BorrowingVault,
    amountIn: BigNumber,
    amountOut: BigNumber,
    tokenIn: Token,
    tokenOut: Token,
    account: Address,
    deadline?: number,
    slippage?: number
  ): FujiResultPromise<PreviewResult> {
    const srcChainId = tokenIn.chainId;
    const destChainId = tokenOut.chainId;

    const _slippage = slippage ?? DEFAULT_SLIPPAGE;

    let actions: RouterActionParams[] = [];
    if (srcChainId === destChainId && srcChainId == vault.chainId) {
      // everything happens on the same chain
      actions = [
        this._payback(vault, amountIn, account, account),
        this._permitWithdraw(vault, amountOut, account, account, deadline),
        this._withdraw(vault, amountOut, account, account),
      ];
    } else if (srcChainId !== destChainId && srcChainId === vault.chainId) {
      // payback and withdraw on chain A and transfer to chain B
      const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[srcChainId];
      const xTransferResult = this._xTransfer(
        destChainId,
        vault.collateral,
        amountOut,
        account,
        connextRouter,
        _slippage
      );
      if (!xTransferResult.success) {
        return xTransferResult;
      }
      actions = [
        this._payback(vault, amountIn, account, account),
        this._permitWithdraw(
          vault,
          amountOut,
          connextRouter,
          account,
          deadline
        ),
        this._withdraw(vault, amountOut, connextRouter, account),
        xTransferResult.data,
      ];
    } else if (srcChainId !== destChainId && destChainId === vault.chainId) {
      // transfer from chain A and payback and withdraw on chain B
      const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[destChainId];
      const innerActions = [
        this._payback(vault, amountIn, account, connextRouter),
        this._permitWithdraw(vault, amountOut, account, account, deadline),
        this._withdraw(vault, amountOut, account, account),
      ];
      const xTransferResult = this._xTransferWithCall(
        destChainId,
        tokenIn,
        amountIn,
        _slippage,
        innerActions
      );
      if (!xTransferResult.success) {
        return xTransferResult;
      }
      actions = [xTransferResult.data];
    } else {
      return new FujiResultError('3-chain transfers are not enabled yet!');
    }

    const result = await this.paybackAndWithdrawRoutingDetails(
      vault,
      amountIn,
      amountOut,
      tokenIn,
      tokenOut
    );
    if (!result.success) {
      return result;
    }
    const { estimateTime, estimateSlippage, bridgeFee, steps } = result.data;
    return new FujiResultSuccess({
      actions,
      bridgeFee,
      steps,
      estimateTime,
      estimateSlippage,
    });
  }
  /********** Routing Details ***********/

  // DEPOSIT or PAYBACK
  async inflowRoutingDetails(
    step: RoutingStep.DEPOSIT | RoutingStep.PAYBACK,
    vault: BorrowingVault,
    amountIn: BigNumber,
    tokenIn: Token
  ): FujiResultPromise<MetaRoutingResult> {
    const activeProvider = vault.activeProvider;

    let estimateSlippage = BigNumber.from(0);
    // TODO: estimate time
    const estimateTime = 3 * 60;
    const bridgeFee = BigNumber.from(0);

    const vaultToken =
      step === RoutingStep.DEPOSIT ? vault.collateral : vault.debt;

    const steps: RoutingStepDetails[] = [
      this._step(RoutingStep.START, tokenIn.chainId, amountIn, tokenIn),
    ];

    if (tokenIn.chainId === vault.chainId) {
      // everything happens on the same chain
      steps.push(
        this._step(step, tokenIn.chainId, amountIn, vaultToken, activeProvider),
        this._step(RoutingStep.END, vault.chainId, amountIn, vaultToken)
      );
    } else {
      // transfer from chain A and deposit/payback on chain B
      const result = await this._callNxtp(
        tokenIn.chain,
        vault.chain,
        tokenIn,
        amountIn
      );
      if (!result.success) {
        return result;
      }
      const r = result.data;
      estimateSlippage = r.estimateSlippage;

      steps.push(
        this._step(RoutingStep.X_TRANSFER, vault.chainId, amountIn, tokenIn),
        this._step(step, vault.chainId, r.received, vaultToken, activeProvider),
        this._step(RoutingStep.END, vault.chainId, r.received, vaultToken)
      );
    }

    return new FujiResultSuccess({
      steps,
      estimateSlippage,
      estimateTime,
      bridgeFee,
    });
  }

  // BORROW or WITHDRAW
  async outflowRoutingDetails(
    step: RoutingStep.BORROW | RoutingStep.WITHDRAW,
    vault: BorrowingVault,
    srcChainId: ChainId,
    amountOut: BigNumber,
    tokenOut: Token
  ): FujiResultPromise<MetaRoutingResult> {
    const activeProvider = vault.activeProvider;

    let estimateSlippage = BigNumber.from(0);
    // TODO: estimate time
    const estimateTime = 3 * 60;
    let bridgeFee = BigNumber.from(0);

    const vaultToken =
      step === RoutingStep.BORROW ? vault.debt : vault.collateral;

    const steps: RoutingStepDetails[] = [
      this._step(RoutingStep.START, srcChainId),
    ];

    if (srcChainId == vault.chainId && tokenOut.chainId === vault.chainId) {
      // everything happens on the same chain
      steps.push(
        this._step(step, vault.chainId, amountOut, tokenOut, activeProvider),
        this._step(RoutingStep.END, vault.chainId, amountOut, tokenOut)
      );
    } else if (
      srcChainId === vault.chainId &&
      tokenOut.chainId !== vault.chainId
    ) {
      // start from chain A, borrow/withdraw on chain A and transfer to chain B
      const result = await this._callNxtp(
        CHAIN[srcChainId],
        vault.chain,
        vaultToken,
        amountOut
      );
      if (!result.success) {
        return result;
      }
      const r = result.data;
      bridgeFee = r.bridgeFee;
      estimateSlippage = r.estimateSlippage;
      // Transfer will pass through the fast path
      // so we need to account for the router fee (0.05) + slippage
      steps.push(
        this._step(step, srcChainId, amountOut, vaultToken, activeProvider),
        this._step(
          RoutingStep.X_TRANSFER,
          tokenOut.chainId,
          amountOut,
          vaultToken
        ),
        this._step(RoutingStep.END, tokenOut.chainId, r.received, tokenOut)
      );
    } else if (
      srcChainId !== vault.chainId &&
      tokenOut.chainId === vault.chainId
    ) {
      // start from chain A and borrow/withdraw on chain B where's also the position
      // => no transfer of funds
      steps.push(
        this._step(RoutingStep.X_TRANSFER, srcChainId, amountOut),
        this._step(step, vault.chainId, amountOut, vaultToken, activeProvider),
        this._step(RoutingStep.END, vault.chainId, amountOut, tokenOut)
      );
    } else {
      return new FujiResultError('3-chain transfers are not enabled yet!');
    }

    return new FujiResultSuccess({
      steps,
      estimateSlippage,
      estimateTime,
      bridgeFee,
    });
  }

  /**
   * Prepares and returns the steps that will be taken
   * in order to accomplish a deposit+borrow operation.
   *
   * @param vault - vault instance on which we want to open a position
   * @param amountIn - amount of provided collateral
   * @param amountOut - amount of loan
   * @param tokenIn - token provided by the user
   * @param tokenOut - token seeked by the user
   */
  async depositAndBorrowRoutingDetails(
    vault: BorrowingVault,
    amountIn: BigNumber,
    amountOut: BigNumber,
    tokenIn: Token,
    tokenOut: Token
  ): FujiResultPromise<MetaRoutingResult> {
    const activeProvider = vault.activeProvider;

    // TODO: estimate time
    const estimateTime = 3 * 60;
    let estimateSlippage = BigNumber.from(0);
    let bridgeFee = BigNumber.from(0);

    const steps: RoutingStepDetails[] = [
      this._step(RoutingStep.START, tokenIn.chainId, amountIn, tokenIn),
    ];
    if (
      tokenIn.chainId === tokenOut.chainId &&
      tokenIn.chainId == vault.chainId
    ) {
      // everything happens on the same chain
      steps.push(
        this._step(
          RoutingStep.DEPOSIT,
          tokenIn.chainId,
          amountIn,
          vault.collateral,
          activeProvider
        ),
        this._step(
          RoutingStep.BORROW,
          tokenOut.chainId,
          amountOut,
          vault.debt,
          activeProvider
        ),
        this._step(RoutingStep.END, tokenOut.chainId, amountOut, tokenOut)
      );
    } else if (
      tokenIn.chainId !== tokenOut.chainId &&
      tokenIn.chainId === vault.chainId
    ) {
      // deposit and borrow on chain A and transfer to chain B
      const result = await this._callNxtp(
        tokenIn.chain,
        tokenOut.chain,
        vault.debt,
        amountOut
      );
      if (!result.success) {
        return result;
      }
      const r = result.data;
      bridgeFee = r.bridgeFee;
      estimateSlippage = r.estimateSlippage;
      // Transfer will pass through the fast path
      // so we need to account for the router fee (0.05) + slippage
      steps.push(
        this._step(
          RoutingStep.DEPOSIT,
          vault.chainId,
          amountIn,
          vault.collateral,
          activeProvider
        ),
        this._step(
          RoutingStep.BORROW,
          vault.chainId,
          amountOut,
          vault.debt,
          activeProvider
        ),
        this._step(
          RoutingStep.X_TRANSFER,
          tokenOut.chainId,
          amountOut,
          vault.debt
        ),
        this._step(RoutingStep.END, tokenOut.chainId, r.received, tokenOut)
      );
    } else if (
      tokenIn.chainId !== tokenOut.chainId &&
      tokenOut.chainId === vault.chainId
    ) {
      // transfer from chain A and deposit and borrow on chain B
      const result = await this._callNxtp(
        tokenIn.chain,
        tokenOut.chain,
        tokenIn,
        amountIn
      );
      if (!result.success) {
        return result;
      }
      const r = result.data;
      estimateSlippage = r.estimateSlippage;

      steps.push(
        this._step(RoutingStep.X_TRANSFER, vault.chainId, amountIn, tokenIn),
        this._step(
          RoutingStep.DEPOSIT,
          vault.chainId,
          r.received,
          vault.collateral,
          activeProvider
        ),
        this._step(
          RoutingStep.BORROW,
          vault.chainId,
          amountOut,
          vault.debt,
          activeProvider
        ),
        this._step(RoutingStep.END, tokenOut.chainId, amountOut, tokenOut)
      );
    } else {
      return new FujiResultError('3-chain transfers are not enabled yet!');
    }

    return new FujiResultSuccess({
      steps,
      estimateSlippage,
      estimateTime,
      bridgeFee,
    });
  }

  /**
   * Prepares and returns the steps that will be taken
   * in order to accomplish a payback+withdraw operation.
   *
   * @param vault - vault instance on which we want to open a position
   * @param amountIn - amount of provided collateral
   * @param amountOut - amount of loan
   * @param tokenIn - token provided by the user
   * @param tokenOut - token seeked by the user
   */
  async paybackAndWithdrawRoutingDetails(
    vault: BorrowingVault,
    amountIn: BigNumber,
    amountOut: BigNumber,
    tokenIn: Token,
    tokenOut: Token
  ): FujiResultPromise<MetaRoutingResult> {
    const activeProvider = vault.activeProvider;

    let estimateSlippage = BigNumber.from(0);
    // TODO: estimate time
    const estimateTime = 3 * 60;
    let bridgeFee = BigNumber.from(0);

    const steps: RoutingStepDetails[] = [
      this._step(RoutingStep.START, tokenIn.chainId, amountIn, tokenIn),
    ];
    if (
      tokenIn.chainId === tokenOut.chainId &&
      tokenIn.chainId === vault.chainId
    ) {
      // everything happens on the same chain
      steps.push(
        this._step(
          RoutingStep.PAYBACK,
          tokenIn.chainId,
          amountIn,
          vault.debt,
          activeProvider
        ),
        this._step(
          RoutingStep.WITHDRAW,
          tokenOut.chainId,
          amountOut,
          vault.collateral,
          activeProvider
        ),
        this._step(RoutingStep.END, tokenOut.chainId, amountOut, tokenOut)
      );
    } else if (
      tokenIn.chainId !== tokenOut.chainId &&
      tokenIn.chainId === vault.chainId
    ) {
      // payback and withdraw on chain A and transfer to chain B
      const result = await this._callNxtp(
        tokenIn.chain,
        tokenOut.chain,
        vault.collateral,
        amountOut
      );
      if (!result.success) {
        return result;
      }
      const r = result.data;
      bridgeFee = r.bridgeFee;
      estimateSlippage = r.estimateSlippage;
      // Transfer will pass through the fast path
      // so we need to account for the router fee (0.05) + slippage
      steps.push(
        this._step(
          RoutingStep.PAYBACK,
          vault.chainId,
          amountIn,
          vault.debt,
          activeProvider
        ),
        this._step(
          RoutingStep.WITHDRAW,
          vault.chainId,
          amountOut,
          vault.collateral,
          activeProvider
        ),
        this._step(
          RoutingStep.X_TRANSFER,
          tokenOut.chainId,
          amountOut,
          vault.collateral
        ),
        this._step(RoutingStep.END, tokenOut.chainId, r.received, tokenOut)
      );
    } else if (
      tokenIn.chainId !== tokenOut.chainId &&
      tokenOut.chainId === vault.chainId
    ) {
      // transfer from chain A and payback and withdraw on chain B
      const result = await this._callNxtp(
        tokenIn.chain,
        tokenOut.chain,
        tokenIn,
        amountIn
      );
      if (!result.success) {
        return result;
      }
      const r = result.data;
      estimateSlippage = r.estimateSlippage;

      steps.push(
        this._step(RoutingStep.X_TRANSFER, vault.chainId, amountIn, tokenIn),
        this._step(
          RoutingStep.PAYBACK,
          vault.chainId,
          r.received,
          vault.debt,
          activeProvider
        ),
        this._step(
          RoutingStep.WITHDRAW,
          vault.chainId,
          amountOut,
          vault.collateral,
          activeProvider
        ),
        this._step(RoutingStep.END, tokenOut.chainId, amountOut, tokenOut)
      );
    } else {
      return new FujiResultError('3-chain transfers are not enabled yet!');
    }

    return new FujiResultSuccess({
      steps,
      estimateSlippage,
      estimateTime,
      bridgeFee,
    });
  }

  /********** Actions ***********/

  private _deposit(
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

  private _withdraw(
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

  private _borrow(
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

  private _payback(
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

  private _permitBorrow(
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

  private _permitWithdraw(
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

  private _xTransfer(
    destChainId: ChainId,
    asset: Token,
    amount: BigNumber,
    receiver: Address,
    sender: Address,
    slippage: number
  ): FujiResult<XTransferParams> {
    const destDomain = CHAIN[destChainId].connextDomain;
    if (!destDomain) {
      return new FujiResultError(
        `Chain ${destChainId} is not available on Connext!`
      );
    }

    return new FujiResultSuccess({
      action: RouterAction.X_TRANSFER,
      destDomain,
      slippage,
      amount,
      asset: asset.address,
      receiver: receiver,
      sender,
    });
  }

  private _xTransferWithCall(
    destChainId: ChainId,
    asset: Token,
    amount: BigNumber,
    slippage: number,
    innerActions: RouterActionParams[]
  ): FujiResult<XTransferWithCallParams> {
    const destDomain = CHAIN[destChainId].connextDomain;
    if (!destDomain) {
      return new FujiResultError(
        `Chain ${destChainId} is not available on Connext!`
      );
    }
    return new FujiResultSuccess({
      action: RouterAction.X_TRANSFER_WITH_CALL,
      destDomain,
      amount,
      asset: asset.address,
      slippage,
      innerActions,
    });
  }

  /********** Misc ***********/
  private _step(
    step: RoutingStep,
    chainId: ChainId,
    amount?: BigNumber,
    token?: Token,
    lendingProvider?: string
  ): RoutingStepDetails {
    return {
      step,
      amount,
      chainId,
      token,
      lendingProvider: lendingProvider
        ? LENDING_PROVIDERS[chainId][lendingProvider]
        : undefined,
    };
  }

  private async _callNxtp(
    srcChain: Chain,
    destChain: Chain,
    token: Token,
    amount: BigNumber
  ): FujiResultPromise<{
    received: BigNumber;
    estimateSlippage: BigNumber;
    bridgeFee: BigNumber;
  }> {
    if (amount.eq(0)) {
      const zero = BigNumber.from(0);
      return new FujiResultSuccess({
        received: zero,
        estimateSlippage: zero,
        bridgeFee: zero,
      });
    }
    try {
      const nxtp = await Nxtp.getOrCreate(token.chain.chainType);

      const { amountReceived, originSlippage, destinationSlippage, routerFee } =
        await nxtp.pool.calculateAmountReceived(
          srcChain.getConnextDomain(),
          destChain.getConnextDomain(),
          token.address.value,
          amount
        );

      return new FujiResultSuccess({
        received: amountReceived as BigNumber,
        estimateSlippage: (originSlippage as BigNumber).add(
          destinationSlippage
        ),
        bridgeFee: routerFee as BigNumber,
      });
    } catch (e) {
      const message = FujiError.messageFromUnknownError(e);
      return new FujiResultError(message, FujiErrorCode.CONNEXT);
    }
  }
}
