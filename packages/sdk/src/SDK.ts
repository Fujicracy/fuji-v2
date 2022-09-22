import { JsonRpcProvider } from '@ethersproject/providers';
import { ethers } from 'ethers';
import { BigNumber } from '@ethersproject/bignumber';
import { RPC_PROVIDER } from './constants/rpcs';
import { Address, Currency, Token } from './entities';
import { Vault } from './entities/Vault';
import { ERC20__factory } from './types';
import { CONNEXT_ROUTER } from './constants/connextRouters';
import { ChainId } from './enums';
import { COLLATERAL_LIST, DEBT_LIST } from './constants';

// what address mappings do we need for each chain?
// ROUTER
// CONNEXT EXECUTOR -> for x-chain deposits

export class SDK {
  /**
   * Address of a connected user, used to construct txns.
   */
  public account: Address;

  public constructor(account: string) {
    this.account = Address.from(account);
  }

  /**
   * Retruns the balance of {account} for a given {Currency},
   * checks if is native or token and returns accordingly.
   */
  public async getBalanceFor(currency: Currency): Promise<BigNumber> {
    const provider: JsonRpcProvider = RPC_PROVIDER[currency.chainId];

    if (currency.isNative) {
      return provider.getBalance(this.account.value);
    }
    return ERC20__factory.connect(currency.address.value, provider).balanceOf(
      this.account.value
    );
  }

  /**
   * Retruns the allowance of {account} for a given {Currency}
   * and the router of the same chain. If it's a native, returns MaxUint256.
   */
  public async getAllowanceFor(currency: Currency): Promise<BigNumber> {
    const provider: JsonRpcProvider = RPC_PROVIDER[currency.chainId];
    const router: Address = CONNEXT_ROUTER[currency.chainId];

    if (currency.isNative) {
      return Promise.resolve(ethers.constants.MaxUint256);
    }

    return ERC20__factory.connect(currency.address.value, provider).allowance(
      this.account.value,
      router.value
    );
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
   * Retruns a default vault for given currencies and chains.
   * It's selected based on checks of the lowest APR for the debt currency.
   */
  public getDefaultVaultFor(collateral: Token, debt: Token): Vault {
    // determine "address"
    const address: Address = Address.from('');

    return new Vault(this, address, collateral, debt);
  }

  /**
   * Set the account for a newly connected user/wallet.
   */
  public setAccount(address: string): string {
    this.account = Address.from(address);

    return this.account.value;
  }
}
