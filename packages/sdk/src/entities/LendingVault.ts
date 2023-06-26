import { VaultType } from '../enums';
import { ChainConfig, LendingProviderWithFinancials } from '../types';
import { YieldVault } from '../types/contracts';
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
  declare contract?: YieldVault;

  multicallContract?: YieldVaultMulticall;

  constructor(address: Address, collateral: Token) {
    super(address, collateral, VaultType.LEND);
  }
  preLoad(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getProviders(): Promise<LendingProviderWithFinancials[]> {
    throw new Error('Method not implemented.');
  }
  setConnection(configParams: ChainConfig): AbstractVault {
    throw new Error('Method not implemented.');
  }
  getBalances(account: Address): Promise<AccountBalances> {
    throw new Error('Method not implemented.');
  }
}
