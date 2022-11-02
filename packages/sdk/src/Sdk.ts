import { BigNumber } from '@ethersproject/bignumber';
import { splitSignature } from '@ethersproject/bytes';
import { TransactionRequest } from '@ethersproject/providers';
import { Call } from '@hovoh/ethcall';
import invariant from 'tiny-invariant';

import {
  COLLATERAL_LIST,
  CONNEXT_DOMAIN,
  CONNEXT_ROUTER_ADDRESS,
  DEBT_LIST,
  VAULT_LIST,
} from './constants';
import { Address, ChainConnection, Currency, Token } from './entities';
import { BorrowingVault } from './entities/BorrowingVault';
import { ChainId, RouterAction } from './enums';
import { encodeActionArgs } from './functions';
import {
  ChainConfig,
  PermitParams,
  RouterActionParams,
  XTransferParams,
} from './types';
import { ConnextRouter__factory } from './types/contracts';

export class Sdk {
  /**
   * ChainConfig object containing Infura and Alchemy ids that
   * are used to create JsonRpcProviders.
   */
  private _configParams: ChainConfig;

  constructor(config: ChainConfig) {
    this._configParams = config;
  }

  /**
   * Static method to check for PERMIT_BORROW or PERMIT_WITHDRAW
   * in array of actions like [DEPOSIT, PERMIT_BORROW, BORROW]
   * or nested array of actions like
   * [X-CALL, FLASHLOAN, [PAYBACK, PERMIT_WITHDRAW, WITHDRAW, SWAP]]
   *
   * @param params - array or nested array of actions
   */
  static needSignature(
    params: (RouterActionParams | RouterActionParams[])[]
  ): boolean {
    // TODO: do we need to check presence of r,v,s in PERMITs?

    return !!params.find((p) => {
      if (p instanceof Array) {
        return Sdk.needSignature(p);
      }
      return (
        p.action === RouterAction.PERMIT_BORROW ||
        p.action === RouterAction.PERMIT_WITHDRAW
      );
    });
  }

  /**
   * Retruns tokens that can be used as collateral on a specific chain.
   * Sets the connection of each token instance so that they are ready
   * to be used.
   *
   * @param chainId - ID of the chain
   */
  getCollateralForChain(chainId: ChainId): Token[] {
    return COLLATERAL_LIST[chainId].map((token: Token) =>
      token.setConnection(this._configParams)
    );
  }

  /**
   * Retruns tokens that can be borrowed on a specific chain.
   * Sets the connection of each token instance so that they are ready
   *
   * to be used.
   * @param chainId - ID of the chain
   */
  getDebtForChain(chainId: ChainId): Token[] {
    return DEBT_LIST[chainId].map((token: Token) =>
      token.setConnection(this._configParams)
    );
  }

  /**
   * Retruns the balance of account for a given currency,
   * both for native and token.
   *
   * @param currency - instance of {@link Currency}
   * @param account - user address, wrapped in {@link Address}
   */
  getBalanceFor(currency: Currency, account: Address): Promise<BigNumber> {
    return currency.setConnection(this._configParams).balanceOf(account);
  }

  /**
   * Retruns the allowance that an account has given to a router
   * for a given currency. If currency is native, it returns MaxUint256.
   *
   * @param currency - instance of {@link Currency}
   * @param account - user address, wrapped in {@link Address}
   */
  getAllowanceFor(currency: Currency, account: Address): Promise<BigNumber> {
    const router: Address = CONNEXT_ROUTER_ADDRESS[currency.chainId];
    return currency
      .setConnection(this._configParams)
      .allowance(account, router);
  }

  /**
   * Retruns the token balances of an address in a batch.
   * Throws an error if `chainId` is different from each `token.chainId`.
   *
   * @param tokens - array of {@link Token} from the same chain
   * @param account - user address, wrapped in {@link Address}
   * @param chainId - ID of the chain
   */
  getTokenBalancesFor(
    tokens: Token[],
    account: Address,
    chainId: ChainId
  ): Promise<BigNumber[]> {
    invariant(
      !tokens.find((t) => t.chainId !== chainId),
      'Token from a different chain!'
    );
    const { multicallRpcProvider } = ChainConnection.from(
      this._configParams,
      chainId
    );
    const balances = tokens
      .map((token) => token.setConnection(this._configParams))
      .map(
        (token) =>
          token.multicallContract?.balanceOf(account.value) as Call<BigNumber>
      );

    return multicallRpcProvider.all(balances);
  }

  /**
   * Retruns a default vault for a given combination of tokens and chains
   * and sets a connection.
   *
   * @remarks
   * The Vault gets selected after checks of the lowest borrow rate for the debt token.
   * If such a vault is found only on one of the chains, it returns without
   * checks of the rate. If there is no such vault found on any of the chains,
   * it returns `undefined`.
   *
   * @param collateral - collateral instance of {@link Token}
   * @param debt - debt instance of {@link Token}
   */
  async getBorrowingVaultFor(
    collateral: Token,
    debt: Token
  ): Promise<BorrowingVault | undefined> {
    // both tokens are from the same chain
    if (collateral.chainId === debt.chainId) {
      return this._findVaultByTokenAddr(
        collateral.chainId,
        collateral,
        debt
      )?.setConnection(this._configParams);
    }

    // tokens are on different chains
    const vaultA = this._findVaultByTokenSymbol(
      collateral.chainId,
      collateral,
      debt
    )?.setConnection(this._configParams);
    const vaultB = this._findVaultByTokenSymbol(
      debt.chainId,
      collateral,
      debt
    )?.setConnection(this._configParams);

    // if one of the vaults doens't exist, return the other one
    if (!vaultA || !vaultB) return vaultA ?? vaultB;

    const [rateA, rateB] = await Promise.all([
      vaultA.getBorrowRate(),
      vaultB.getBorrowRate(),
    ]);

    return rateA.lt(rateB) ? vaultA : vaultB;
  }

  /**
   * Prepares and returns the bundle of actions that will be send to the router
   * for a compound operation of deposit+borrow.
   *
   * @remarks
   * The array that is returned should be first passed to `BorrowingVault.needSignature`.
   * If one of the actions must be signed by the user, we have to obtain the digest
   * from `this.signPermitFor` and make the user sign it with their wallet. The last step is
   * to obtain the txData and the address of the router from `this.getTxDetails` which is to be
   * used in ethers.sendTransaction.
   *
   * @param vault - vault instance on which we want to open a position
   * @param amountIn - amount of provided collateral
   * @param amountOut - amount of loan
   * @param srcChainId - chain ID from which the tx is initated
   * @param destChainId - chain ID where user wants their borrowed amount disbursed
   * @param account - user address, wrapped in {@link Address}
   */
  previewDepositAndBorrow(
    vault: BorrowingVault,
    amountIn: BigNumber,
    amountOut: BigNumber,
    srcChainId: ChainId,
    destChainId: ChainId,
    account: Address
  ): { actions: RouterActionParams[]; cost: BigNumber } {
    const connextRouter: Address = CONNEXT_ROUTER_ADDRESS[srcChainId];
    // TODO estimate bridge cost
    const cost = BigNumber.from(1);

    let actions: RouterActionParams[] = [];
    // everything happens on the same chain
    if (srcChainId === destChainId && srcChainId == vault.chainId) {
      actions = [
        vault.previewDeposit(amountIn, account, account),
        vault.previewPermitBorrow(amountOut, connextRouter, account),
        vault.previewBorrow(amountOut, account),
      ];
    } else if (srcChainId === vault.chainId) {
      // deposit and borrow on chain A and transfer to chain B
      actions = [
        vault.previewDeposit(amountIn, account, account),
        vault.previewPermitBorrow(amountOut, connextRouter, account),
        vault.previewBorrow(amountOut, account),
        this.previewXTransfer(destChainId, vault.debt, amountOut, account),
      ];
    } else if (destChainId === vault.chainId) {
      // transfer from chain A and deposit and borrow on chain B
      actions = [
        //this._previewXTransferWithCall()
        vault.previewDeposit(amountIn, connextRouter, account),
        vault.previewPermitBorrow(amountOut, connextRouter, account),
        vault.previewBorrow(amountOut, account),
      ];
    }

    return { actions, cost };
  }

  getTxDetails(
    actionParams: RouterActionParams[],
    srcChainId: ChainId,
    account: Address,
    signature?: string
  ): TransactionRequest {
    const permitAction: PermitParams = actionParams.find((param) =>
      [RouterAction.PERMIT_BORROW, RouterAction.PERMIT_WITHDRAW].includes(
        param.action
      )
    ) as PermitParams;

    // TODO verify better signature && permitAction
    if (signature && permitAction) {
      const { v, r, s } = splitSignature(signature);
      permitAction.v = v;
      permitAction.r = r;
      permitAction.s = s;
    } else if (permitAction && !signature) {
      invariant(false, 'You need to sign the permit action first!');
    }

    const actions = actionParams.map(({ action }) => BigNumber.from(action));
    const args = actionParams.map(encodeActionArgs);
    const callData =
      ConnextRouter__factory.createInterface().encodeFunctionData('xBundle', [
        actions,
        args,
      ]);

    return {
      from: account.value,
      to: CONNEXT_ROUTER_ADDRESS[srcChainId].value,
      data: callData,
      chainId: srcChainId,
    };
  }

  previewXTransfer(
    destChainId: ChainId,
    asset: Token,
    amount: BigNumber,
    receiver: Address
  ): XTransferParams {
    const destDomain = CONNEXT_DOMAIN[destChainId];
    invariant(destDomain, 'Chain is not available on Connext!');

    return {
      action: RouterAction.X_TRANSFER,
      destDomain,
      amount,
      asset: asset.address,
      receiver: receiver,
    };
  }

  private _findVaultByTokenSymbol(
    chainId: ChainId,
    collateral: Token,
    debt: Token
  ): BorrowingVault | undefined {
    const collateralSym: string = collateral.symbol;
    const debtSym: string = debt.symbol;

    return VAULT_LIST[chainId].find(
      (v: BorrowingVault) =>
        v.collateral.symbol === collateralSym && v.debt.symbol === debtSym
    );
  }

  private _findVaultByTokenAddr(
    chainId: ChainId,
    collateral: Token,
    debt: Token
  ): BorrowingVault | undefined {
    const collateralAddr: Address = collateral.address;
    const debtAddr: Address = debt.address;

    return VAULT_LIST[chainId].find(
      (v: BorrowingVault) =>
        v.collateral.address.equals(collateralAddr) &&
        v.debt.address.equals(debtAddr)
    );
  }
}
