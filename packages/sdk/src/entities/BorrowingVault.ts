import { defaultAbiCoder } from '@ethersproject/abi';
import { BigNumber } from '@ethersproject/bignumber';
import { JsonRpcProvider, WebSocketProvider } from '@ethersproject/providers';
import { keccak256 } from '@ethersproject/solidity';
import { formatUnits } from '@ethersproject/units';
import { IMulticallProvider } from '@hovoh/ethcall';
import axios from 'axios';
import { TypedDataDomain, TypedDataField, utils } from 'ethers';
import invariant from 'tiny-invariant';

import {
  CHAIN,
  CHIEF_ADDRESS,
  CONNEXT_ROUTER_ADDRESS,
  FujiErrorCode,
  URLS,
} from '../constants';
import { LENDING_PROVIDERS } from '../constants/lending-providers';
import { ChainId, RouterAction } from '../enums';
import {
  AprStat,
  ChainConfig,
  ChainConnectionDetails,
  FujiResultPromise,
  LendingProviderWithFinancials,
  PermitParams,
} from '../types';
import {
  BorrowingVault as BorrowingVaultContract,
  BorrowingVault__factory,
  Chief__factory,
  ILendingProvider__factory,
} from '../types/contracts';
import { BorrowingVaultMulticall } from '../types/contracts/src/vaults/borrowing/BorrowingVault';
import {
  GetLlamaAssetPoolsResponse,
  GetLlamaPoolStatsResponse,
  LlamaAssetPool,
} from '../types/LlamaResponses';
import { Address } from './Address';
import { Chain } from './Chain';
import { FujiResultError, FujiResultSuccess } from './FujiError';
import { Token } from './Token';

type AccountBalances = {
  deposit: BigNumber;
  borrow: BigNumber;
};

/**
 * The BorrowingVault class encapsulates the end-user logic of interation with the
 * BorrowingVault cotract without the need to deal directly with ethers.js (ABIs, providers etc).
 *
 * It contains read-only functions and leaves to the client only the final step of a blockchain write.
 * The class aims to expose functions that together with user's inputs go throughout the most common
 * path of interacting with a BorrowingVault contract.
 */

export class BorrowingVault {
  /**
   * The chain ID on which this vault resides
   */
  readonly chainId: ChainId;

  /**
   * The chain on which this vault resides
   */
  readonly chain: Chain;

  /**
   * The address of the vault contract, wrapped in {@link Address}
   * @readonly
   */
  readonly address: Address;

  /**
   * Represents the token, accepted by the vault as collateral that
   * can be pledged to take out a loan
   * @readonly
   */
  readonly collateral: Token;

  /**
   * Represents the token, in which a loan can be taken out
   * @readonly
   */
  readonly debt: Token;

  /**
   * Name of the vault, assigned at deployment
   */
  private name: string;

  /**
   * Address of the lending provider from which the vault is currently sourcing liquidity.
   */
  activeProvider?: string;

  /**
   * Addresses of the lending provider from which the vault can source liquidity.
   */
  allProviders?: string[];

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

  /**
   * Value that reflects the safety score according to a risk framework.
   *
   * @remarks
   * Can be between 0 and 100.
   */
  safetyRating?: BigNumber;

  /**
   * Instance of ethers Contract class, already initialized with
   * address and rpc provider. It can be used to directly call the
   * methods available on the smart contract.
   *
   * @example
   * ```ts
   * await vault.balanceOf(address);
   * ```
   * Use with caution, espesially for writes.
   */
  contract?: BorrowingVaultContract;

  /**
   * Extended instance of contract used when there is a
   * possibility to perform a multicall read on the smart contract.
   * @remarks
   * A multicall read refers to a batch read done in a single call.
   */
  multicallContract?: BorrowingVaultMulticall;

  /**
   * The RPC provider for the specific chain
   */
  rpcProvider?: JsonRpcProvider;

  /**
   * The RPC provider for the specific chain
   */
  wssProvider?: WebSocketProvider;

  /**
   * The multicall RPC provider for the specific chain
   */
  multicallRpcProvider?: IMulticallProvider;

  private _configParams?: ChainConfig;

  constructor(address: Address, collateral: Token, debt: Token) {
    invariant(debt.chainId === collateral.chainId, 'Chain mismatch!');

    this.name = '';
    this.address = address;
    this.collateral = collateral;
    this.chainId = collateral.chainId;
    this.chain = CHAIN[this.chainId];
    this.debt = debt;
  }

  /**
   * Creates a connection by setting an rpc provider.
   *
   * @param configParams - {@link ChainConfig} object with infura and alchemy ids
   */
  setConnection(configParams: ChainConfig): BorrowingVault {
    if (this.rpcProvider) return this;

    this._configParams = configParams;

    const connection = CHAIN[this.chainId].setConnection(configParams)
      .connection as ChainConnectionDetails;

    this.rpcProvider = connection.rpcProvider;
    this.wssProvider = connection.wssProvider;
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

  /**
   * Loads and sets name, maxLtv, liqRatio, activeProvider and allProviders.
   *
   * @throws if {@link setConnection} was not called beforehand
   */
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

    this.setPreLoads(
      maxLtv,
      liqRatio,
      safetyRating,
      name,
      activeProvider,
      allProviders
    );
  }

  setPreLoads(
    maxLtv: BigNumber,
    liqRatio: BigNumber,
    safetyRating: BigNumber,
    name: string,
    activeProvider: string,
    allProviders: string[]
  ) {
    this.maxLtv = maxLtv;
    this.liqRatio = liqRatio;
    this.safetyRating = safetyRating;
    this.name = name;
    this.activeProvider = activeProvider;
    this.allProviders = allProviders;
  }

  /**
   * Retruns the borrow interest rate by querying the activeProvider.
   *
   * @throws if {@link setConnection} was not called beforehand
   */
  async getBorrowRate(): Promise<BigNumber> {
    invariant(this.contract && this.rpcProvider, 'Connection not set!');

    const activeProvider: string =
      this.activeProvider ?? (await this.contract.activeProvider());
    const borrowRate: BigNumber = await ILendingProvider__factory.connect(
      activeProvider,
      this.rpcProvider
    ).getBorrowRateFor(this.address.value);

    return borrowRate;
  }

  /**
   * Retruns the list with all providers of the vault.
   * Each element also includes the borrow and deposit rate.
   *
   * @throws if {@link setConnection} was not called beforehand
   */
  async getProviders(): Promise<LendingProviderWithFinancials[]> {
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

    const splitIndex = rates.length / 2;
    // rates are with 27 decimals
    const rateToFloat = (n: BigNumber) =>
      parseFloat(formatUnits(n.toString(), 27)) * 100;
    return this.allProviders
      .filter((address) =>
        Boolean(LENDING_PROVIDERS[this.chainId][address]?.name)
      )
      .map((addr: string, i: number) => {
        return {
          name: LENDING_PROVIDERS[this.chainId][addr]?.name,
          llamaKey: LENDING_PROVIDERS[this.chainId][addr]?.llamaKey,
          depositAprBase: rateToFloat(rates[i]),
          borrowAprBase: rateToFloat(rates[i + splitIndex]),
        };
      });
  }

  /**
   * Returns a historical data of deposit or borrow rates for all providers.
   *
   * @param token - the collateral or the debt token of the vault {@link Token}
   */
  async getProvidersStatsFor(
    token: Token
  ): FujiResultPromise<{ name: string; aprStats: AprStat[] }[]> {
    if (token.equals(this.collateral) || token.equals(this.debt))
      return new FujiResultError('Wrong token');

    if (!this.allProviders) {
      await this.preLoad();
    }
    if (!this.allProviders || !this._configParams)
      return new FujiResultError('Connection not set');

    const { defillamaproxy } = this._configParams;
    const uri = {
      pools: defillamaproxy ? defillamaproxy + 'pools' : URLS.DEFILLAMA_POOLS,
      chart: defillamaproxy
        ? defillamaproxy + 'chartLendBorrow'
        : URLS.DEFILLAMA_CHART,
    };
    try {
      const pools = await axios
        .get<GetLlamaAssetPoolsResponse>(uri.pools)
        .then(({ data }) => data.data);

      const getPoolId = (providerAddr: string) => {
        const provider = LENDING_PROVIDERS[this.chainId][providerAddr];

        return pools.find(
          (p: LlamaAssetPool) =>
            p.chain === this.chain.llamaKey &&
            p.project === provider.llamaKey &&
            p.symbol === token.symbol
        )?.pool;
      };

      const llamaResult = await Promise.all(
        this.allProviders.map((addr) =>
          axios
            .get<GetLlamaPoolStatsResponse>(uri.chart + `/${getPoolId(addr)}`)
            .then(({ data }) => data.data)
        )
      );

      const data = this.allProviders.map((addr, i) => ({
        name: LENDING_PROVIDERS[this.chainId][addr].name,
        aprStats: llamaResult[i].map(
          ({
            timestamp,
            apyBase,
            apyReward,
            apyBaseBorrow,
            apyRewardBorrow,
          }) => ({
            timestamp,
            aprBase: token.equals(this.debt) ? apyBaseBorrow : apyBase,
            aprReward: token.equals(this.debt) ? apyRewardBorrow : apyReward,
          })
        ),
      }));

      return new FujiResultSuccess(data);
    } catch (e) {
      const message = axios.isAxiosError(e)
        ? `DefiLlama API call failed with a message: ${e.message}`
        : 'DefiLlama API call failed with an unexpected error!';
      console.error(message);
      return new FujiResultError(message, FujiErrorCode.LLAMA);
    }
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

  /**
   * Returns the digest to be signed by user's injected rpcProvider/wallet.
   *
   * @remarks
   * After the user signs, the next step is to obtain the txData and
   * the address of the router from "this.getTxDetails" which on its turn is
   * to be used in ethers.sendTransaction.
   *
   * @param params - the permit action that needs to be signed
   */
  async signPermitFor(params: PermitParams): Promise<{
    digest: string;
    domain: TypedDataDomain;
    types: Record<string, TypedDataField[]>;
    value: Record<string, string>;
  }> {
    invariant(this.contract, 'Connection not set!');
    const { owner } = params;

    if (this.name === '') {
      await this.preLoad();
    }

    const nonce: BigNumber = await this.contract.nonces(owner.value);

    const { domain, types, value } = this._getPermitDigest(params, nonce);
    const digest = utils._TypedDataEncoder.hash(domain, types, value);

    return { digest, domain, types, value };
  }

  private _getPermitDigest(params: PermitParams, nonce: BigNumber) {
    const { action, owner, receiver, amount, deadline } = params;

    const salt = keccak256(
      ['bytes'],
      [defaultAbiCoder.encode(['uint256'], [this.chainId])]
    );
    const domain: TypedDataDomain = {
      name: this.name,
      version: '1',
      verifyingContract: this.address.value,
      salt,
    };

    const permitType =
      action === RouterAction.PERMIT_BORROW ? 'PermitBorrow' : 'PermitWithdraw';
    const types: Record<string, TypedDataField[]> = {
      [permitType]: [
        { name: 'destChainId', type: 'uint256' },
        { name: 'owner', type: 'address' },
        { name: 'operator', type: 'address' },
        { name: 'receiver', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    };

    const value: Record<string, string> = {
      destChainId: this.chainId.toString(),
      owner: owner.value,
      operator: CONNEXT_ROUTER_ADDRESS[this.chainId].value,
      receiver: receiver.value,
      amount: amount.toString(),
      nonce: nonce.toString(),
      deadline: deadline?.toString() ?? '',
    };

    return { domain, types, value };
  }
}
