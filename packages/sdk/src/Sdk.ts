import { JsonRpcProvider } from '@ethersproject/providers';
import { ethers } from 'ethers';
import { BigNumber } from '@ethersproject/bignumber';
import { Address, Currency, Token } from './entities';
import { BorrowingVault } from './entities/BorrowingVault';
import {
  BorrowingVault__factory,
  ERC20__factory,
  ILendingProvider__factory,
} from './types';
import { ChainId } from './enums';
import {
  COLLATERAL_LIST,
  DEBT_LIST,
  CONNEXT_ADDRESS,
  RPC_PROVIDER,
  VAULT_LIST,
} from './constants';

// what address mappings do we need for each chain?
// LIB_SIG_UTILS
// CONNEXT EXECUTOR -> for x-chain deposits

export class Sdk {
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
    const router: Address = CONNEXT_ADDRESS[currency.chainId];

    if (currency.isNative) {
      return Promise.resolve(ethers.constants.MaxUint256);
    }

    return ERC20__factory.connect(currency.address.value, provider).allowance(
      account.value,
      router.value
    );
  }

  /**
   * Retruns the borrowing interest rate of a vault by querying
   * its activeProvider.
   */
  public async getBorrowRateFor(vault: BorrowingVault): Promise<BigNumber> {
    const rpcProvider = RPC_PROVIDER[vault.chainId];

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
  ): Promise<BorrowingVault | undefined> {
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

    // if one of the vaults doens't exist, return the other one
    if (!vaultA || !vaultB) return vaultB ?? vaultB;

    const [rateA, rateB] = await Promise.all([
      this.getBorrowRateFor(vaultA),
      this.getBorrowRateFor(vaultB),
    ]);

    return rateA.lt(rateB) ? vaultA : vaultB;
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
