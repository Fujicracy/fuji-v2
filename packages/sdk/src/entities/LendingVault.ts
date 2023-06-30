import { BigNumber } from 'ethers';
import invariant from 'tiny-invariant';

import { CHAIN, CHIEF_ADDRESS } from '../constants';
import { VaultType } from '../enums';
import { ChainConfig, ChainConnectionDetails } from '../types';
import {
  Chief__factory,
  ILendingProvider__factory,
  YieldVault as YieldVaultContract,
  YieldVault__factory,
} from '../types/contracts';
import { YieldVaultMulticall } from '../types/contracts/src/vaults/yields/YieldVault';
import { AbstractVault, AccountBalances } from './abstract/AbstractVault';
import { Address } from './Address';
import { Token } from './Token';

/**
 * The LendingVault class encapsulates the end-user logic of interaction with the
 * YieldVault contract without the need to deal directly with ethers.js (ABIs, providers etc).
 *
 * It contains read-only functions and leaves to the client only the final step of a blockchain write.
 * The class aims to expose functions that together with user's inputs go throughout the most common
 * path of interacting with a YieldVault contract.
 */
export class LendingVault extends AbstractVault {
  declare contract?: YieldVaultContract;

  multicallContract?: YieldVaultMulticall;

  constructor(address: Address, collateral: Token) {
    super(address, collateral, VaultType.LEND);
  }

  setConnection(configParams: ChainConfig): AbstractVault {
    if (this.rpcProvider) return this;

    const connection = CHAIN[this.chainId].setConnection(configParams)
      .connection as ChainConnectionDetails;

    this.rpcProvider = connection.rpcProvider;
    this.multicallRpcProvider = connection.multicallRpcProvider;

    this.contract = YieldVault__factory.connect(
      this.address.value,
      this.rpcProvider
    );
    this.multicallContract = YieldVault__factory.multicall(this.address.value);

    this.collateral.setConnection(configParams);

    return this;
  }

  async preLoad() {
    invariant(
      this.multicallContract && this.multicallRpcProvider,
      'Connection not set!'
    );
    // skip when data was already loaded
    if (
      this.safetyRating &&
      this.name !== '' &&
      this.activeProvider &&
      this.allProviders
    )
      return;

    const chief = Chief__factory.multicall(CHIEF_ADDRESS[this.chainId].value);

    const [safetyRating, name, activeProvider, allProviders] =
      await this.multicallRpcProvider.all([
        chief.vaultSafetyRating(this.address.value),
        this.multicallContract.name(),
        this.multicallContract.activeProvider(),
        this.multicallContract.getProviders(),
      ]);

    this._setPreLoads(safetyRating, name, activeProvider, allProviders);
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

    // do a common call for both types and use an index to split them below
    const rates: BigNumber[] = await this.multicallRpcProvider.all([
      ...depositCalls,
    ]);
    return rates;
  }

  setPreLoads(
    safetyRating: BigNumber,
    name: string,
    activeProvider: string,
    allProviders: string[]
  ) {
    this._setPreLoads(safetyRating, name, activeProvider, allProviders);
  }

  async getBalances(account: Address): Promise<AccountBalances> {
    invariant(
      this.multicallContract && this.multicallRpcProvider,
      'Connection not set!'
    );
    const [deposit] = await this.multicallRpcProvider.all([
      this.multicallContract.balanceOfAsset(account.value),
    ]);

    return { deposit, borrow: BigNumber.from(0) };
  }
}
