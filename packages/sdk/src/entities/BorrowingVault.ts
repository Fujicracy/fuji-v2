import { BigNumber } from '@ethersproject/bignumber';
import invariant from 'tiny-invariant';

import { CHAIN, CHIEF_ADDRESS } from '../constants';
import { VaultType } from '../enums';
import {
  AprResult,
  ChainConfig,
  ChainConnectionDetails,
  FujiResultPromise,
} from '../types';
import {
  BorrowingVault as BorrowingVaultContract,
  BorrowingVault__factory,
  Chief__factory,
  ILendingProvider__factory,
} from '../types/contracts';
import { BorrowingVaultMulticall } from '../types/contracts/src/vaults/borrowing/BorrowingVault';
import { AbstractVault, AccountBalances } from './abstract/AbstractVault';
import { Address } from './Address';
import { Token } from './Token';

/**
 * The BorrowingVault class encapsulates the end-user logic of interaction with the
 * BorrowingVault contract without the need to deal directly with ethers.js (ABIs, providers etc).
 *
 * It contains read-only functions and leaves to the client only the final step of a blockchain write.
 * The class aims to expose functions that together with user's inputs go throughout the most common
 * path of interacting with a BorrowingVault contract.
 */

export class BorrowingVault extends AbstractVault {
  /**
   * Represents the token, in which a loan can be taken out
   * @readonly
   */
  readonly debt: Token;

  /**
   * A factor that defines the maximum Loan-To-Value a user can take.
   *
   * @remarks
   * A factor refers to a fixed-digit decimal number. Specifically,
   * a decimal number scaled by 1e18. These numbers should be treated as real
   * numbers scaled down by 1e18. For example, the number 50% would be
   * represented as 5*1e17.
   */
  maxLtv?: BigNumber;

  /**
   * A factor that defines the Loan-To-Value at which a user can be liquidated.
   *
   * @remarks
   * A factor refers to a fixed-digit decimal number. Specifically,
   * a decimal number scaled by 1e18. These numbers should be treated as real
   * numbers scaled down by 1e18. For example, the number 50% would be
   * represented as 5*1e17.
   */
  liqRatio?: BigNumber;

  declare contract?: BorrowingVaultContract;

  /**
   * Extended instance of contract used when there is a
   * possibility to perform a multicall read on the smart contract.
   * @remarks
   * A multicall read refers to a batch read done in a single call.
   */
  multicallContract?: BorrowingVaultMulticall;

  constructor(address: Address, collateral: Token, debt: Token) {
    super(address, collateral, VaultType.BORROW);
    invariant(debt.chainId === collateral.chainId, 'Chain mismatch!');

    this.debt = debt;
  }

  setConnection(configParams: ChainConfig): BorrowingVault {
    if (this.rpcProvider) return this;

    const connection = CHAIN[this.chainId].setConnection(configParams)
      .connection as ChainConnectionDetails;

    this.rpcProvider = connection.rpcProvider;
    this.multicallRpcProvider = connection.multicallRpcProvider;

    this.contract = BorrowingVault__factory.connect(
      this.address.value,
      this.rpcProvider
    );
    this.multicallContract = BorrowingVault__factory.multicall(
      this.address.value
    );

    this.collateral.setConnection(configParams);
    this.debt.setConnection(configParams);

    return this;
  }

  async preLoad() {
    invariant(
      this.multicallContract && this.multicallRpcProvider,
      'Connection not set!'
    );
    // skip when data was already loaded
    if (
      this.maxLtv &&
      this.liqRatio &&
      this.safetyRating &&
      this.name !== '' &&
      this.activeProvider &&
      this.allProviders
    )
      return;

    const chief = Chief__factory.multicall(CHIEF_ADDRESS[this.chainId].value);

    const [maxLtv, liqRatio, safetyRating, name, activeProvider, allProviders] =
      await this.multicallRpcProvider.all([
        this.multicallContract.maxLtv(),
        this.multicallContract.liqRatio(),
        chief.vaultSafetyRating(this.address.value),
        this.multicallContract.name(),
        this.multicallContract.activeProvider(),
        this.multicallContract.getProviders(),
      ]);

    this._setBorrowingPreLoads(
      maxLtv,
      liqRatio,
      safetyRating,
      name,
      activeProvider,
      allProviders
    );
  }

  async rates(): Promise<BigNumber[]> {
    invariant(
      this.contract && this.multicallRpcProvider,
      'Connection not set!'
    );

    if (!this.allProviders) {
      await this.preLoad();
    }
    invariant(this.allProviders, 'Providers are not loaded yet!');

    const depositCalls = this.allProviders.map((addr) =>
      ILendingProvider__factory.multicall(addr).getDepositRateFor(
        this.address.value
      )
    );
    const borrowCalls = this.allProviders.map((addr) =>
      ILendingProvider__factory.multicall(addr).getBorrowRateFor(
        this.address.value
      )
    );

    // do a common call for both types and use an index to split them below
    const rates: BigNumber[] = await this.multicallRpcProvider.all([
      ...depositCalls,
      ...borrowCalls,
    ]);
    return rates;
  }

  /**
   * Returns a historical data of borrow rates for all providers. If data for a specific
   * provider is not available at DefiLlama, an empty array is returned.
   */
  async getBorrowProviderStats(): FujiResultPromise<AprResult[]> {
    return this._getProvidersStatsFor(this.debt, true);
  }

  /**
   * Returns deposit and borrow balances for an account.
   *
   * @param account - user address, wrapped in {@link Address}
   * @throws if {@link setConnection} was not called beforehand
   */
  async getBalances(account: Address): Promise<AccountBalances> {
    invariant(
      this.multicallContract && this.multicallRpcProvider,
      'Connection not set!'
    );
    const [deposit, borrow] = await this.multicallRpcProvider.all([
      this.multicallContract.balanceOfAsset(account.value),
      this.multicallContract.balanceOfDebt(account.value),
    ]);

    return { deposit, borrow };
  }

  private _setBorrowingPreLoads(
    maxLtv: BigNumber,
    liqRatio: BigNumber,
    safetyRating: BigNumber,
    name: string,
    activeProvider: string,
    allProviders: string[]
  ) {
    this.maxLtv = maxLtv;
    this.liqRatio = liqRatio;

    this._setPreLoads(safetyRating, name, activeProvider, allProviders);
  }
}
