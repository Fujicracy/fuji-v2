import { JsonRpcProvider } from '@ethersproject/providers';
import { ethers } from 'ethers';
import { BigNumber } from '@ethersproject/bignumber';
import { RPC_PROVIDER } from './constants/rpcs';
import { Address, Currency, Token } from './entities';
import { Vault } from './entities/Vault';
import {
  BorrowingVault__factory,
  ERC20__factory,
  ILendingProvider__factory,
} from './types';
import { CONNEXT_ROUTER } from './constants/connextRouters';
import { ChainId } from './enums';
import { COLLATERAL_LIST, DEBT_LIST } from './constants';
import { VAULT_LIST } from './constants/vaults';

// what address mappings do we need for each chain?
// ROUTER
// CONNEXT EXECUTOR -> for x-chain deposits

export class SDK {
  /**
   * Retruns the balance of {account} for a given {Currency},
   * checks if is native or token and returns accordingly.
   */
  public async getBalanceFor(
    currency: Currency,
    account: Address
  ): Promise<BigNumber> {
    const provider: JsonRpcProvider = RPC_PROVIDER[currency.chainId];

    if (currency.isNative) {
      return provider.getBalance(account.value);
    }
    return ERC20__factory.connect(currency.address.value, provider).balanceOf(
      account.value
    );
  }

  /**
   * Retruns the allowance of {account} for a given {Currency}
   * and the router of the same chain. If it's a native, returns MaxUint256.
   */
  public async getAllowanceFor(
    currency: Currency,
    account: Address
  ): Promise<BigNumber> {
    const provider: JsonRpcProvider = RPC_PROVIDER[currency.chainId];
    const router: Address = CONNEXT_ROUTER[currency.chainId];

    if (currency.isNative) {
      return Promise.resolve(ethers.constants.MaxUint256);
    }

    return ERC20__factory.connect(currency.address.value, provider).allowance(
      account.value,
      router.value
    );
  }

  public async getBorrowRateFor(vault: Vault): Promise<BigNumber> {
    const rpcProvider = RPC_PROVIDER[vault.chainId];

    // how to do MultiCall?
    const activeProvider: string = await BorrowingVault__factory.connect(
      vault.address.value,
      rpcProvider
    ).activeProvider();
    const borrowRate: BigNumber = await ILendingProvider__factory.connect(
      activeProvider,
      rpcProvider
    ).getBorrowRateFor(vault.debt.address.value);

    return borrowRate;
  }

  /**
   * Retruns tokens to be used as collateral on a specific chain.
   */
  public getCollateralForChain(chainId: ChainId): Token[] {
    return COLLATERAL_LIST[chainId];
  }

  /**
   * Retruns tokens that can be borrowed on a specific chain.
   */
  public getDebtForChain(chainId: ChainId): Token[] {
    return DEBT_LIST[chainId];
  }

  /**
   * Retruns a default vault for given tokens and chains.
   * It's selected based on checks of the lowest APR for the debt token.
   */
  public async getBorrowingVaultFor(
    collateral: Token,
    debt: Token
  ): Promise<Vault | undefined> {
    // both tokens are from the same chain
    if (collateral.chainId === debt.chainId) {
      return this._findVaultByTokenAddr(collateral.chainId, collateral, debt);
    }

    // tokens are on different chains
    const vaultA = this._findVaultByTokenSymbol(
      collateral.chainId,
      collateral,
      debt
    );
    const vaultB = this._findVaultByTokenSymbol(debt.chainId, collateral, debt);

    if (!vaultA) return vaultB;
    if (!vaultB) return vaultA;

    const borrowRateA: BigNumber = await this.getBorrowRateFor(vaultA);
    const borrowRateB: BigNumber = await this.getBorrowRateFor(vaultB);

    if (borrowRateA.lt(borrowRateB)) {
      return vaultA;
    }
    return vaultB;
  }

  private _findVaultByTokenSymbol(
    chainId: ChainId,
    collateral: Token,
    debt: Token
  ): Vault | undefined {
    const collateralSym: string = collateral.symbol;
    const debtSym: string = debt.symbol;

    return VAULT_LIST[chainId].find(
      (v: Vault) =>
        v.collateral.symbol === collateralSym && v.debt.symbol === debtSym
    );
  }

  private _findVaultByTokenAddr(
    chainId: ChainId,
    collateral: Token,
    debt: Token
  ): Vault | undefined {
    const collateralAddr: Address = collateral.address;
    const debtAddr: Address = debt.address;

    return VAULT_LIST[chainId].find(
      (v: Vault) =>
        v.collateral.address.equals(collateralAddr) &&
        v.debt.address.equals(debtAddr)
    );
  }
}
