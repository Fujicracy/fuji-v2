import { BigNumber } from '@ethersproject/bignumber';
import { AddressZero } from '@ethersproject/constants';
import invariant from 'tiny-invariant';

import { CONNEXT_DOMAIN, CONNEXT_ROUTER_ADDRESS } from './constants';
import { Address, BorrowingVault, Token } from './entities';
import { ChainId, RouterAction, RoutingStep } from './enums';
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
  ): Promise<{
    actions: RouterActionParams[];
    steps: RoutingStepDetails[];
    bridgeFee: BigNumber;
    estimateTime: number;
  }> {
    const srcChainId = tokenIn.chainId;

    // TODO estimate bridge cost
    const bridgeFee = BigNumber.from(1);
    const estimateTime = 3 * 60;

    const _slippage = slippage ?? 30;

    let actions: RouterActionParams[] = [];
    if (srcChainId == vault.chainId) {
      // everything happens on the same chain
      actions = [this._depositAction(vault, amountIn, account, account)];
    } else {
      // transfer from chain A and deposit on chain B
      const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];
      const innerActions = [
        this._depositAction(vault, amountIn, account, connextRouter),
      ];
      actions = [
        this._xTransferWithCallAction(
          vault.chainId,
          tokenIn,
          amountIn,
          _slippage,
          innerActions
        ),
      ];
    }

    const steps = await this.getInflowSteps(
      RoutingStep.DEPOSIT,
      vault,
      amountIn,
      tokenIn
    );

    return { actions, bridgeFee, steps, estimateTime };
  }

  async borrow(
    vault: BorrowingVault,
    srcChainId: ChainId,
    amountOut: BigNumber,
    tokenOut: Token,
    account: Address,
    deadline?: number,
    slippage?: number
  ): Promise<{
    actions: RouterActionParams[];
    steps: RoutingStepDetails[];
    bridgeFee: BigNumber;
    estimateTime: number;
  }> {
    // TODO estimate bridge cost
    const bridgeFee = BigNumber.from(1);
    const estimateTime = 3 * 60;

    const _slippage = slippage ?? 30;

    let actions: RouterActionParams[] = [];

    if (srcChainId == vault.chainId && tokenOut.chainId === vault.chainId) {
      // everything happens on the same chain
      actions = [
        this._permitBorrowAction(vault, amountOut, account, account, deadline),
        this._borrowAction(vault, amountOut, account, account),
      ];
    } else if (
      srcChainId === vault.chainId &&
      tokenOut.chainId !== vault.chainId
    ) {
      // start from chain A, borrow on chain A and transfer to chain B
      const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];
      actions = [
        this._permitBorrowAction(
          vault,
          amountOut,
          connextRouter,
          account,
          deadline
        ),
        this._borrowAction(vault, amountOut, connextRouter, account),
        this._xTransferAction(
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
        this._permitBorrowAction(
          vault,
          amountOut,
          connextRouter,
          account,
          deadline
        ),
        this._borrowAction(vault, amountOut, connextRouter, account),
      ];
      actions = [
        this._xTransferWithCallAction(
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

    const steps = await this.getOutflowSteps(
      RoutingStep.BORROW,
      vault,
      srcChainId,
      amountOut,
      tokenOut
    );

    return { actions, bridgeFee, steps, estimateTime };
  }

  async payback(
    vault: BorrowingVault,
    amountIn: BigNumber,
    tokenIn: Token,
    account: Address,
    slippage?: number
  ): Promise<{
    actions: RouterActionParams[];
    steps: RoutingStepDetails[];
    bridgeFee: BigNumber;
    estimateTime: number;
  }> {
    const srcChainId = tokenIn.chainId;

    // TODO estimate bridge cost
    const bridgeFee = BigNumber.from(1);
    const estimateTime = 3 * 60;

    const _slippage = slippage ?? 30;

    let actions: RouterActionParams[] = [];
    if (srcChainId == vault.chainId) {
      // everything happens on the same chain
      actions = [this._paybackAction(vault, amountIn, account, account)];
    } else {
      // transfer from chain A and payback on chain B
      const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];
      const innerActions = [
        this._paybackAction(vault, amountIn, account, connextRouter),
      ];
      actions = [
        this._xTransferWithCallAction(
          vault.chainId,
          tokenIn,
          amountIn,
          _slippage,
          innerActions
        ),
      ];
    }

    const steps = await this.getInflowSteps(
      RoutingStep.PAYBACK,
      vault,
      amountIn,
      tokenIn
    );

    return { actions, bridgeFee, steps, estimateTime };
  }

  async withdraw(
    vault: BorrowingVault,
    srcChainId: ChainId,
    amountOut: BigNumber,
    tokenOut: Token,
    account: Address,
    deadline?: number,
    slippage?: number
  ): Promise<{
    actions: RouterActionParams[];
    steps: RoutingStepDetails[];
    bridgeFee: BigNumber;
    estimateTime: number;
  }> {
    // TODO estimate bridge cost
    const bridgeFee = BigNumber.from(1);
    const estimateTime = 3 * 60;

    const _slippage = slippage ?? 30;

    let actions: RouterActionParams[] = [];

    if (srcChainId == vault.chainId && tokenOut.chainId === vault.chainId) {
      // everything happens on the same chain
      actions = [
        this._permitWithdrawAction(
          vault,
          amountOut,
          account,
          account,
          deadline
        ),
        this._withdrawAction(vault, amountOut, account, account),
      ];
    } else if (
      srcChainId === vault.chainId &&
      tokenOut.chainId !== vault.chainId
    ) {
      // start from chain A, withdraw to chain A and transfer to chain B
      const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[vault.chainId];
      actions = [
        this._permitWithdrawAction(
          vault,
          amountOut,
          connextRouter,
          account,
          deadline
        ),
        this._withdrawAction(vault, amountOut, connextRouter, account),
        this._xTransferAction(
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
        this._permitWithdrawAction(
          vault,
          amountOut,
          connextRouter,
          account,
          deadline
        ),
        this._withdrawAction(vault, amountOut, connextRouter, account),
      ];
      actions = [
        this._xTransferWithCallAction(
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

    const steps = await this.getOutflowSteps(
      RoutingStep.WITHDRAW,
      vault,
      srcChainId,
      amountOut,
      tokenOut
    );

    return { actions, bridgeFee, steps, estimateTime };
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
   * from `this.signPermitFor` and make the user sign it with their wallet. The last step is
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
  ): Promise<{
    actions: RouterActionParams[];
    steps: RoutingStepDetails[];
    bridgeFee: BigNumber;
    estimateTime: number;
  }> {
    const srcChainId = tokenIn.chainId;
    const destChainId = tokenOut.chainId;

    // TODO estimate bridge cost
    const bridgeFee = BigNumber.from(1);
    const estimateTime = 3 * 60;

    const _slippage = slippage ?? 30;

    let actions: RouterActionParams[] = [];
    if (srcChainId === destChainId && srcChainId == vault.chainId) {
      // everything happens on the same chain
      actions = [
        this._depositAction(vault, amountIn, account, account),
        this._permitBorrowAction(vault, amountOut, account, account, deadline),
        this._borrowAction(vault, amountOut, account, account),
      ];
    } else if (srcChainId !== destChainId && srcChainId === vault.chainId) {
      // deposit and borrow on chain A and transfer to chain B
      const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[srcChainId];
      actions = [
        this._depositAction(vault, amountIn, account, account),
        this._permitBorrowAction(
          vault,
          amountOut,
          connextRouter,
          account,
          deadline
        ),
        this._borrowAction(vault, amountOut, connextRouter, account),
        this._xTransferAction(
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
        this._depositAction(vault, amountIn, account, connextRouter),
        this._permitBorrowAction(vault, amountOut, account, account, deadline),
        this._borrowAction(vault, amountOut, account, account),
      ];
      actions = [
        this._xTransferWithCallAction(
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

    const steps = await this.getDepositAndBorrowSteps(
      vault,
      amountIn,
      amountOut,
      tokenIn,
      tokenOut
    );

    return { actions, bridgeFee, steps, estimateTime };
  }

  async paybackAndWithdraw(
    vault: BorrowingVault,
    amountIn: BigNumber,
    amountOut: BigNumber,
    tokenIn: Token,
    tokenOut: Token,
    account: Address,
    deadline?: number,
    slippage?: number
  ): Promise<{
    actions: RouterActionParams[];
    steps: RoutingStepDetails[];
    bridgeFee: BigNumber;
    estimateTime: number;
  }> {
    const srcChainId = tokenIn.chainId;
    const destChainId = tokenOut.chainId;

    // TODO estimate bridge cost
    const bridgeFee = BigNumber.from(1);
    const estimateTime = 3 * 60;

    const _slippage = slippage ?? 30;

    let actions: RouterActionParams[] = [];
    if (srcChainId === destChainId && srcChainId == vault.chainId) {
      // everything happens on the same chain
      actions = [
        this._paybackAction(vault, amountIn, account, account),
        this._permitWithdrawAction(
          vault,
          amountOut,
          account,
          account,
          deadline
        ),
        this._withdrawAction(vault, amountOut, account, account),
      ];
    } else if (srcChainId !== destChainId && srcChainId === vault.chainId) {
      // deposit and borrow on chain A and transfer to chain B
      const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[srcChainId];
      actions = [
        this._paybackAction(vault, amountIn, account, account),
        this._permitWithdrawAction(
          vault,
          amountOut,
          connextRouter,
          account,
          deadline
        ),
        this._withdrawAction(vault, amountOut, connextRouter, account),
        this._xTransferAction(
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
        this._paybackAction(vault, amountIn, account, connextRouter),
        this._permitWithdrawAction(
          vault,
          amountOut,
          account,
          account,
          deadline
        ),
        this._withdrawAction(vault, amountOut, account, account),
      ];
      actions = [
        this._xTransferWithCallAction(
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

    const steps = await this.getPaybackAndWithdrawSteps(
      vault,
      amountIn,
      amountOut,
      tokenIn,
      tokenOut
    );

    return { actions, bridgeFee, steps, estimateTime };
  }
  /********** Steps ***********/

  // DEPOSIT or PAYBACK
  async getInflowSteps(
    step: RoutingStep.DEPOSIT | RoutingStep.PAYBACK,
    vault: BorrowingVault,
    amountIn: BigNumber,
    tokenIn: Token
  ): Promise<RoutingStepDetails[]> {
    const activeProvider = (await vault.getProviders()).find((p) => p.active);

    const steps: RoutingStepDetails[] = [
      {
        step: RoutingStep.START,
        amount: amountIn,
        chainId: tokenIn.chainId,
        token: tokenIn,
      },
    ];

    if (tokenIn.chainId === vault.chainId) {
      // everything happens on the same chain
      steps.push({
        step,
        amount: amountIn,
        chainId: tokenIn.chainId,
        token: step === RoutingStep.DEPOSIT ? vault.collateral : vault.debt,
        lendingProvider: activeProvider,
      });
    } else {
      // transfer from chain A and deposit on chain B
      steps.push(
        {
          step: RoutingStep.X_TRANSFER,
          amount: amountIn,
          chainId: vault.chainId,
          token: tokenIn,
        },
        {
          step,
          amount: amountIn,
          chainId: tokenIn.chainId,
          token: step === RoutingStep.DEPOSIT ? vault.collateral : vault.debt,
          lendingProvider: activeProvider,
        }
      );
    }

    steps.push({
      step: RoutingStep.END,
      amount: amountIn,
      chainId: vault.chainId,
      token: step === RoutingStep.DEPOSIT ? vault.collateral : vault.debt,
    });

    return steps;
  }

  // BORROW or WITHDRAW
  async getOutflowSteps(
    step: RoutingStep.BORROW | RoutingStep.WITHDRAW,
    vault: BorrowingVault,
    srcChainId: ChainId,
    amountOut: BigNumber,
    tokenOut: Token
  ): Promise<RoutingStepDetails[]> {
    const activeProvider = (await vault.getProviders()).find((p) => p.active);

    const steps: RoutingStepDetails[] = [
      {
        step: RoutingStep.START,
        chainId: srcChainId,
      },
    ];

    if (srcChainId == vault.chainId && tokenOut.chainId === vault.chainId) {
      // everything happens on the same chain
      steps.push({
        step,
        amount: amountOut,
        chainId: vault.chainId,
        token: tokenOut,
        lendingProvider: activeProvider,
      });
    } else if (
      srcChainId === vault.chainId &&
      tokenOut.chainId !== vault.chainId
    ) {
      // start from chain A, borrow/withdraw on chain A and transfer to chain B
      steps.push(
        {
          step,
          amount: amountOut,
          chainId: srcChainId,
          token: step === RoutingStep.BORROW ? vault.debt : vault.collateral,
          lendingProvider: activeProvider,
        },
        {
          step: RoutingStep.X_TRANSFER,
          amount: amountOut,
          chainId: tokenOut.chainId,
          token: vault.debt,
        }
      );
    } else if (
      srcChainId !== vault.chainId &&
      tokenOut.chainId === vault.chainId
    ) {
      // start from chain A and borrow on chain B where's also the position
      steps.push(
        {
          step: RoutingStep.X_TRANSFER,
          amount: amountOut,
          chainId: srcChainId,
        },
        {
          step,
          amount: amountOut,
          chainId: vault.chainId,
          token: step === RoutingStep.BORROW ? vault.debt : vault.collateral,
          lendingProvider: activeProvider,
        }
      );
    } else {
      invariant(true, '3-chain transfers are not enabled yet!');
    }

    steps.push({
      step: RoutingStep.END,
      amount: amountOut,
      chainId: tokenOut.chainId,
      token: tokenOut,
    });

    return steps;
  }

  /**
   * Prepares and returns the steps that will be taken
   * in order to accomplish an operation.
   *
   * @param vault - vault instance on which we want to open a position
   * @param amountIn - amount of provided collateral
   * @param amountOut - amount of loan
   * @param tokenIn - token provided by the user
   * @param tokenOut - token seeked by the user
   */
  async getDepositAndBorrowSteps(
    vault: BorrowingVault,
    amountIn: BigNumber,
    amountOut: BigNumber,
    tokenIn: Token,
    tokenOut: Token
  ): Promise<RoutingStepDetails[]> {
    const activeProvider = (await vault.getProviders()).find((p) => p.active);

    const steps: RoutingStepDetails[] = [
      {
        step: RoutingStep.START,
        amount: amountIn,
        chainId: tokenIn.chainId,
        token: tokenIn,
      },
    ];
    if (
      tokenIn.chainId === tokenOut.chainId &&
      tokenIn.chainId == vault.chainId
    ) {
      // everything happens on the same chain
      steps.push(
        {
          step: RoutingStep.DEPOSIT,
          amount: amountIn,
          chainId: tokenIn.chainId,
          token: vault.collateral,
          lendingProvider: activeProvider,
        },
        {
          step: RoutingStep.BORROW,
          amount: amountOut,
          chainId: tokenOut.chainId,
          token: vault.debt,
          lendingProvider: activeProvider,
        }
      );
    } else if (
      tokenIn.chainId !== tokenOut.chainId &&
      tokenIn.chainId === vault.chainId
    ) {
      // deposit and borrow on chain A and transfer to chain B
      steps.push(
        {
          step: RoutingStep.DEPOSIT,
          amount: amountIn,
          chainId: tokenIn.chainId,
          token: vault.collateral,
          lendingProvider: activeProvider,
        },
        {
          step: RoutingStep.BORROW,
          amount: amountOut,
          chainId: tokenOut.chainId,
          token: vault.debt,
          lendingProvider: activeProvider,
        },
        {
          step: RoutingStep.X_TRANSFER,
          amount: amountOut,
          chainId: tokenOut.chainId,
          token: vault.debt,
        }
      );
    } else if (
      tokenIn.chainId !== tokenOut.chainId &&
      tokenOut.chainId === vault.chainId
    ) {
      // transfer from chain A and deposit and borrow on chain B
      steps.push(
        {
          step: RoutingStep.X_TRANSFER,
          amount: amountIn,
          chainId: vault.chainId,
          token: tokenIn,
        },
        {
          step: RoutingStep.DEPOSIT,
          amount: amountIn,
          chainId: vault.chainId,
          token: vault.collateral,
          lendingProvider: activeProvider,
        },
        {
          step: RoutingStep.BORROW,
          amount: amountOut,
          chainId: vault.chainId,
          token: vault.debt,
          lendingProvider: activeProvider,
        }
      );
    } else {
      invariant(true, '3-chain transfers are not enabled yet!');
    }

    steps.push({
      step: RoutingStep.END,
      amount: amountOut,
      chainId: tokenOut.chainId,
      token: tokenOut,
    });

    return steps;
  }

  async getPaybackAndWithdrawSteps(
    vault: BorrowingVault,
    amountIn: BigNumber,
    amountOut: BigNumber,
    tokenIn: Token,
    tokenOut: Token
  ): Promise<RoutingStepDetails[]> {
    const activeProvider = (await vault.getProviders()).find((p) => p.active);

    const steps: RoutingStepDetails[] = [
      {
        step: RoutingStep.START,
        amount: amountIn,
        chainId: tokenIn.chainId,
        token: tokenIn,
      },
    ];
    if (
      tokenIn.chainId === tokenOut.chainId &&
      tokenIn.chainId === vault.chainId
    ) {
      // everything happens on the same chain
      steps.push(
        {
          step: RoutingStep.PAYBACK,
          amount: amountIn,
          chainId: tokenIn.chainId,
          token: vault.debt,
          lendingProvider: activeProvider,
        },
        {
          step: RoutingStep.WITHDRAW,
          amount: amountOut,
          chainId: tokenOut.chainId,
          token: vault.collateral,
          lendingProvider: activeProvider,
        }
      );
    } else if (
      tokenIn.chainId !== tokenOut.chainId &&
      tokenIn.chainId === vault.chainId
    ) {
      // payback and withdraw oon chain A and transfer to chain B
      steps.push(
        {
          step: RoutingStep.PAYBACK,
          amount: amountIn,
          chainId: tokenIn.chainId,
          token: vault.debt,
          lendingProvider: activeProvider,
        },
        {
          step: RoutingStep.WITHDRAW,
          amount: amountOut,
          chainId: tokenOut.chainId,
          token: vault.collateral,
          lendingProvider: activeProvider,
        },
        {
          step: RoutingStep.X_TRANSFER,
          amount: amountOut,
          chainId: tokenOut.chainId,
          token: vault.collateral,
        }
      );
    } else if (
      tokenIn.chainId !== tokenOut.chainId &&
      tokenOut.chainId === vault.chainId
    ) {
      // transfer from chain A and payback and withdraw on chain B
      steps.push(
        {
          step: RoutingStep.X_TRANSFER,
          amount: amountIn,
          chainId: vault.chainId,
          token: tokenIn,
        },
        {
          step: RoutingStep.PAYBACK,
          amount: amountIn,
          chainId: vault.chainId,
          token: vault.debt,
          lendingProvider: activeProvider,
        },
        {
          step: RoutingStep.WITHDRAW,
          amount: amountOut,
          chainId: tokenOut.chainId,
          token: vault.collateral,
          lendingProvider: activeProvider,
        }
      );
    } else {
      invariant(true, '3-chain transfers are not enabled yet!');
    }

    steps.push({
      step: RoutingStep.END,
      amount: amountOut,
      chainId: tokenOut.chainId,
      token: tokenOut,
    });

    return steps;
  }

  /********** Actions ***********/

  private _depositAction(
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

  private _withdrawAction(
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

  private _borrowAction(
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

  private _paybackAction(
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

  private _permitBorrowAction(
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

  private _permitWithdrawAction(
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

  private _xTransferAction(
    destChainId: ChainId,
    asset: Token,
    amount: BigNumber,
    receiver: Address,
    sender: Address,
    slippage: number
  ): XTransferParams {
    const destDomain = CONNEXT_DOMAIN[destChainId];
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

  private _xTransferWithCallAction(
    destChainId: ChainId,
    asset: Token,
    amount: BigNumber,
    slippage: number,
    innerActions: RouterActionParams[]
  ): XTransferWithCallParams {
    const destDomain = CONNEXT_DOMAIN[destChainId];
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
}
