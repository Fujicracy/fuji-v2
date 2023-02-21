import { BigNumber } from '@ethersproject/bignumber';
import { AddressZero } from '@ethersproject/constants';
import invariant from 'tiny-invariant';

import { CHAIN, CONNEXT_ROUTER_ADDRESS } from './constants';
import { LENDING_PROVIDERS } from './constants/lending-providers';
import { Address, BorrowingVault, Token } from './entities';
import { Chain } from './entities/Chain';
import { ChainId, RouterAction, RoutingStep } from './enums';
import { Nxtp } from './Nxtp';
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
  /********** Single Previews ***********/

  async deposit(
    vault: BorrowingVault,
    amountIn: BigNumber,
    tokenIn: Token,
    account: Address,
    slippage?: number
  ): Promise<PreviewResult> {
    const srcChainId = tokenIn.chainId;

    const _slippage = slippage ?? 30;

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
      actions = [
        this._xTransferWithCall(
          vault.chainId,
          tokenIn,
          amountIn,
          _slippage,
          innerActions
        ),
      ];
    }

    const { estimateTime, estimateSlippage, bridgeFee, steps } =
      await this.inflowRoutingDetails(
        RoutingStep.DEPOSIT,
        vault,
        amountIn,
        tokenIn
      );

    return { actions, bridgeFee, steps, estimateTime, estimateSlippage };
  }

  async borrow(
    vault: BorrowingVault,
    srcChainId: ChainId,
    amountOut: BigNumber,
    tokenOut: Token,
    account: Address,
    deadline?: number,
    slippage?: number
  ): Promise<PreviewResult> {
    const _slippage = slippage ?? 30;

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
      actions = [
        this._permitBorrow(vault, amountOut, connextRouter, account, deadline),
        this._borrow(vault, amountOut, connextRouter, account),
        this._xTransfer(
          tokenOut.chainId,
          vault.debt,
          amountOut,
          account,
          connextRouter,
          _slippage
        ),
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
      actions = [
        this._xTransferWithCall(
          vault.chainId,
          { address: Address.from(AddressZero) } as Token,
          BigNumber.from(0),
          0,
          innerActions
        ),
      ];
    } else {
      invariant(true, '3-chain transfers are not enabled yet!');
    }

    const { estimateTime, estimateSlippage, bridgeFee, steps } =
      await this.outflowRoutingDetails(
        RoutingStep.BORROW,
        vault,
        srcChainId,
        amountOut,
        tokenOut
      );

    return { actions, bridgeFee, steps, estimateTime, estimateSlippage };
  }

  async payback(
    vault: BorrowingVault,
    amountIn: BigNumber,
    tokenIn: Token,
    account: Address,
    slippage?: number
  ): Promise<PreviewResult> {
    const srcChainId = tokenIn.chainId;

    const _slippage = slippage ?? 30;

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
      actions = [
        this._xTransferWithCall(
          vault.chainId,
          tokenIn,
          amountIn,
          _slippage,
          innerActions
        ),
      ];
    }

    const { estimateTime, estimateSlippage, bridgeFee, steps } =
      await this.inflowRoutingDetails(
        RoutingStep.PAYBACK,
        vault,
        amountIn,
        tokenIn
      );

    return { actions, bridgeFee, steps, estimateTime, estimateSlippage };
  }

  async withdraw(
    vault: BorrowingVault,
    srcChainId: ChainId,
    amountOut: BigNumber,
    tokenOut: Token,
    account: Address,
    deadline?: number,
    slippage?: number
  ): Promise<PreviewResult> {
    const _slippage = slippage ?? 30;

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
      actions = [
        this._permitWithdraw(
          vault,
          amountOut,
          connextRouter,
          account,
          deadline
        ),
        this._withdraw(vault, amountOut, connextRouter, account),
        this._xTransfer(
          tokenOut.chainId,
          vault.debt,
          amountOut,
          account,
          connextRouter,
          _slippage
        ),
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
      actions = [
        this._xTransferWithCall(
          vault.chainId,
          { address: Address.from(AddressZero) } as Token,
          BigNumber.from(0),
          0,
          innerActions
        ),
      ];
    } else {
      invariant(true, '3-chain transfers are not enabled yet!');
    }

    const { estimateTime, estimateSlippage, bridgeFee, steps } =
      await this.outflowRoutingDetails(
        RoutingStep.WITHDRAW,
        vault,
        srcChainId,
        amountOut,
        tokenOut
      );

    return { actions, bridgeFee, steps, estimateTime, estimateSlippage };
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
  ): Promise<PreviewResult> {
    const srcChainId = tokenIn.chainId;
    const destChainId = tokenOut.chainId;

    const _slippage = slippage ?? 30;

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
      actions = [
        this._deposit(vault, amountIn, account, account),
        this._permitBorrow(vault, amountOut, connextRouter, account, deadline),
        this._borrow(vault, amountOut, connextRouter, account),
        this._xTransfer(
          destChainId,
          vault.debt,
          amountOut,
          account,
          connextRouter,
          _slippage
        ),
      ];
    } else if (srcChainId !== destChainId && destChainId === vault.chainId) {
      // transfer from chain A and deposit and borrow on chain B
      const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[destChainId];
      const innerActions = [
        this._deposit(vault, amountIn, account, connextRouter),
        this._permitBorrow(vault, amountOut, account, account, deadline),
        this._borrow(vault, amountOut, account, account),
      ];
      actions = [
        this._xTransferWithCall(
          destChainId,
          tokenIn,
          amountIn,
          _slippage,
          innerActions
        ),
      ];
    } else {
      invariant(true, '3-chain transfers are not enabled yet!');
    }

    const { estimateTime, estimateSlippage, bridgeFee, steps } =
      await this.depositAndBorrowRoutingDetails(
        vault,
        amountIn,
        amountOut,
        tokenIn,
        tokenOut
      );

    return { actions, bridgeFee, steps, estimateTime, estimateSlippage };
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
  ): Promise<PreviewResult> {
    const srcChainId = tokenIn.chainId;
    const destChainId = tokenOut.chainId;

    const _slippage = slippage ?? 30;

    let actions: RouterActionParams[] = [];
    if (srcChainId === destChainId && srcChainId == vault.chainId) {
      // everything happens on the same chain
      actions = [
        this._payback(vault, amountIn, account, account),
        this._permitWithdraw(vault, amountOut, account, account, deadline),
        this._withdraw(vault, amountOut, account, account),
      ];
    } else if (srcChainId !== destChainId && srcChainId === vault.chainId) {
      // deposit and borrow on chain A and transfer to chain B
      const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[srcChainId];
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
        this._xTransfer(
          destChainId,
          vault.debt,
          amountOut,
          account,
          connextRouter,
          _slippage
        ),
      ];
    } else if (srcChainId !== destChainId && destChainId === vault.chainId) {
      // transfer from chain A and deposit and borrow on chain B
      const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[destChainId];
      const innerActions = [
        this._payback(vault, amountIn, account, connextRouter),
        this._permitWithdraw(vault, amountOut, account, account, deadline),
        this._withdraw(vault, amountOut, account, account),
      ];
      actions = [
        this._xTransferWithCall(
          destChainId,
          tokenIn,
          amountIn,
          _slippage,
          innerActions
        ),
      ];
    } else {
      invariant(true, '3-chain transfers are not enabled yet!');
    }

    const { estimateTime, estimateSlippage, bridgeFee, steps } =
      await this.paybackAndWithdrawRoutingDetails(
        vault,
        amountIn,
        amountOut,
        tokenIn,
        tokenOut
      );

    return { actions, bridgeFee, steps, estimateTime, estimateSlippage };
  }
  /********** Routing Details ***********/

  // DEPOSIT or PAYBACK
  async inflowRoutingDetails(
    step: RoutingStep.DEPOSIT | RoutingStep.PAYBACK,
    vault: BorrowingVault,
    amountIn: BigNumber,
    tokenIn: Token
  ): Promise<MetaRoutingResult> {
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
      const r = await this._callNxtp(
        tokenIn.chain,
        vault.chain,
        tokenIn,
        amountIn
      );
      estimateSlippage = r.estimateSlippage;
      // add back 'routerFee' because the tx passes through
      // Connext slow path where no fee is taken
      const received = r.received.add(r.bridgeFee);

      steps.push(
        this._step(RoutingStep.X_TRANSFER, vault.chainId, amountIn, tokenIn),
        this._step(step, vault.chainId, received, vaultToken, activeProvider),
        this._step(RoutingStep.END, vault.chainId, received, vaultToken)
      );
    }

    return { steps, estimateSlippage, estimateTime, bridgeFee };
  }

  // BORROW or WITHDRAW
  async outflowRoutingDetails(
    step: RoutingStep.BORROW | RoutingStep.WITHDRAW,
    vault: BorrowingVault,
    srcChainId: ChainId,
    amountOut: BigNumber,
    tokenOut: Token
  ): Promise<MetaRoutingResult> {
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
      const r = await this._callNxtp(
        CHAIN[srcChainId],
        vault.chain,
        vaultToken,
        amountOut
      );
      bridgeFee = r.bridgeFee;
      estimateSlippage = r.estimateSlippage;
      // Transfer will pass through the fast path
      // so we need to account for the router fee (0.05) + slippage
      const received = r.received;
      steps.push(
        this._step(step, srcChainId, amountOut, vaultToken, activeProvider),
        this._step(
          RoutingStep.X_TRANSFER,
          tokenOut.chainId,
          amountOut,
          vaultToken
        ),
        this._step(RoutingStep.END, tokenOut.chainId, received, tokenOut)
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
      invariant(true, '3-chain transfers are not enabled yet!');
    }

    return { steps, estimateSlippage, estimateTime, bridgeFee };
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
  ): Promise<MetaRoutingResult> {
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
      const r = await this._callNxtp(
        tokenIn.chain,
        tokenOut.chain,
        vault.debt,
        amountOut
      );
      bridgeFee = r.bridgeFee;
      estimateSlippage = r.estimateSlippage;
      // Transfer will pass through the fast path
      // so we need to account for the router fee (0.05) + slippage
      const received = r.received;
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
        this._step(RoutingStep.END, tokenOut.chainId, received, tokenOut)
      );
    } else if (
      tokenIn.chainId !== tokenOut.chainId &&
      tokenOut.chainId === vault.chainId
    ) {
      // transfer from chain A and deposit and borrow on chain B
      const r = await this._callNxtp(
        tokenIn.chain,
        tokenOut.chain,
        tokenIn,
        amountIn
      );
      estimateSlippage = r.estimateSlippage;
      // add back 'routerFee' because the tx passes through
      // Connext slow path where no fee is taken
      const received = r.received.add(r.bridgeFee);

      steps.push(
        this._step(RoutingStep.X_TRANSFER, vault.chainId, amountIn, tokenIn),
        this._step(
          RoutingStep.DEPOSIT,
          vault.chainId,
          received,
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
      invariant(true, '3-chain transfers are not enabled yet!');
    }

    return { steps, estimateSlippage, estimateTime, bridgeFee };
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
  ): Promise<MetaRoutingResult> {
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
      const r = await this._callNxtp(
        tokenIn.chain,
        tokenOut.chain,
        vault.collateral,
        amountOut
      );
      bridgeFee = r.bridgeFee;
      estimateSlippage = r.estimateSlippage;
      // Transfer will pass through the fast path
      // so we need to account for the router fee (0.05) + slippage
      const received = r.received;
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
        this._step(RoutingStep.END, tokenOut.chainId, received, tokenOut)
      );
    } else if (
      tokenIn.chainId !== tokenOut.chainId &&
      tokenOut.chainId === vault.chainId
    ) {
      // transfer from chain A and payback and withdraw on chain B
      const r = await this._callNxtp(
        tokenIn.chain,
        tokenOut.chain,
        tokenIn,
        amountIn
      );
      estimateSlippage = r.estimateSlippage;
      // add back 'routerFee' because the tx passes through
      // Connext slow path where no fee is taken
      const received = r.received.add(r.bridgeFee);

      steps.push(
        this._step(RoutingStep.X_TRANSFER, vault.chainId, amountIn, tokenIn),
        this._step(
          RoutingStep.PAYBACK,
          vault.chainId,
          received,
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
      invariant(true, '3-chain transfers are not enabled yet!');
    }

    return { steps, estimateSlippage, estimateTime, bridgeFee };
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
  ): XTransferParams {
    const destDomain = CHAIN[destChainId].connextDomain;
    invariant(destDomain, 'Chain is not available on Connext!');

    return {
      action: RouterAction.X_TRANSFER,
      destDomain,
      slippage,
      amount,
      asset: asset.address,
      receiver: receiver,
      sender,
    };
  }

  private _xTransferWithCall(
    destChainId: ChainId,
    asset: Token,
    amount: BigNumber,
    slippage: number,
    innerActions: RouterActionParams[]
  ): XTransferWithCallParams {
    const destDomain = CHAIN[destChainId].connextDomain;
    invariant(destDomain, `Chain ${destChainId} is not available on Connext!`);

    return {
      action: RouterAction.X_TRANSFER_WITH_CALL,
      destDomain,
      amount,
      asset: asset.address,
      slippage,
      innerActions,
    };
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
  ): Promise<{
    received: BigNumber;
    estimateSlippage: BigNumber;
    bridgeFee: BigNumber;
  }> {
    const nxtp = await Nxtp.getOrCreate(token.chain.chainType);

    const { amountReceived, originSlippage, destinationSlippage, routerFee } =
      await nxtp.pool.calculateAmountReceived(
        srcChain.getConnextDomain(),
        destChain.getConnextDomain(),
        token.address.value,
        amount
      );

    return {
      received: amountReceived as BigNumber,
      estimateSlippage: (originSlippage as BigNumber).add(destinationSlippage),
      bridgeFee: routerFee as BigNumber,
    };
  }
}
