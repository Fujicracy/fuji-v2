import { JsonRpcProvider } from '@ethersproject/providers';
import { ethers } from 'ethers';
import { BigNumber } from '@ethersproject/bignumber';
import { Address, Currency, Token } from './entities';
import { BorrowingVault } from './entities/BorrowingVault';
import { ERC20__factory } from './types/contracts';
import { ChainId } from './enums';
import {
  COLLATERAL_LIST,
  DEBT_LIST,
  CONNEXT_ADDRESS,
  RPC_PROVIDER,
  VAULT_LIST,
} from './constants';

export class Sdk {
  /**
   * Retruns tokens to be used as collateral on a specific chain.
   */
  getCollateralForChain(chainId: ChainId): Token[] {
    return COLLATERAL_LIST[chainId];
  }

  /**
   * Retruns tokens that can be borrowed on a specific chain.
   */
  getDebtForChain(chainId: ChainId): Token[] {
    return DEBT_LIST[chainId];
  }

  /**
   * Retruns the balance of {account} for a given {Currency},
   * checks if is native or token and returns accordingly.
   */
  async getBalanceFor(
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
  async getAllowanceFor(
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
   * Retruns a default vault for given tokens and chains
   * that get selected after checks of the lowest APR for the debt token.
   * If such a vault exists only on one of the chains, it returns without
   * an APR checks.
   * If there is no such vault because of the combination of tokens/chains,
   * it returns undefined.
   */
  async getBorrowingVaultFor(
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
    if (!vaultA || !vaultB) return vaultA ?? vaultB;

    const [rateA, rateB] = await Promise.all([
      vaultA.getBorrowRate(),
      vaultB.getBorrowRate(),
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
