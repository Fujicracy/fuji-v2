import { defaultAbiCoder } from '@ethersproject/abi';
import { JsonRpcProvider } from '@ethersproject/providers';
import { keccak256 } from '@ethersproject/solidity';
import { formatUnits } from '@ethersproject/units';
import { IMulticallProvider } from '@hovoh/ethcall';
import axios from 'axios';
import { BigNumber, TypedDataDomain, TypedDataField, utils } from 'ethers';
import invariant from 'tiny-invariant';

import {
  CHAIN,
  CONNEXT_ROUTER_ADDRESS,
  FujiErrorCode,
  URLS,
} from '../../constants';
import { LENDING_PROVIDERS } from '../../constants/lending-providers';
import { ChainId, RouterAction, VaultType } from '../../enums';
import { encodeActionArgs } from '../../functions/encodeActionArgs';
import { findPermitAction } from '../../functions/findPermitAction';
import {
  AprResult,
  ChainConfig,
  FujiResultPromise,
  LendingProviderWithFinancials,
  PermitParams,
  RouterActionParams,
  XTransferWithCallParams,
} from '../../types';
import { BaseVaultMulticall } from '../../types/contracts/src/abstracts/BaseVault';
import {
  GetLlamaAssetPoolsResponse,
  GetLlamaPoolStatsResponse,
  LlamaAssetPool,
} from '../../types/LlamaResponses';
import { Address } from '../Address';
import { Chain } from '../Chain';
import { FujiResultError, FujiResultSuccess } from '../FujiError';
import { Token } from '../Token';
import { AbstractContract } from './AbstractContract';

export type AccountBalances = {
  deposit: BigNumber;
  borrow: BigNumber;
};

export abstract class AbstractVault {
  /**
   * Returns whether the vault is a borrowing vault or a lending vault
   */
  readonly type: VaultType;

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
   * Name of the vault, assigned at deployment
   */
  protected name: string;

  /**
   * Address of the lending provider from which the vault is currently sourcing liquidity.
   */
  activeProvider?: string;

  /**
   * Addresses of the lending provider from which the vault can source liquidity.
   */
  allProviders?: string[];

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
   * Use with caution, especially for writes.
   */
  contract?: AbstractContract;

  /**
   * The RPC provider for the specific chain
   */
  rpcProvider?: JsonRpcProvider;

  /**
   * The multicall RPC provider for the specific chain
   */
  multicallRpcProvider?: IMulticallProvider;
  abstract multicallContract?: BaseVaultMulticall;

  constructor(address: Address, collateral: Token, type: VaultType) {
    this.name = '';
    this.address = address;
    this.collateral = collateral;
    this.chainId = collateral.chainId;
    this.chain = CHAIN[this.chainId];
    this.type = type;
  }

  /**
   * Loads and sets name, maxLtv, liqRatio, activeProvider and allProviders.
   *
   * @throws if {@link setConnection} was not called beforehand
   */
  abstract preLoad(): Promise<void>;

  /**
   * Loads vault rates
   *
   * @throws if {@link setConnection} was not called beforehand
   */
  abstract rates(): Promise<BigNumber[]>;

  /**
   * Creates a connection by setting an rpc provider.
   *
   * @param configParams - {@link ChainConfig} object with infura and alchemy ids
   */
  abstract setConnection(configParams: ChainConfig): AbstractVault;

  /**
   * Returns deposit and borrow balances for an account.
   *
   * @param account - user address, wrapped in {@link Address}
   * @throws if {@link setConnection} was not called beforehand
   */
  abstract getBalances(account: Address): Promise<AccountBalances>;

  /**
   * Returns the list with all providers of the vault.
   * Each element also includes the borrow and deposit rate.
   *
   * @throws if {@link setConnection} was not called beforehand
   */
  async getProviders(): Promise<LendingProviderWithFinancials[]> {
    const rates: BigNumber[] = await this.rates();
    invariant(this.allProviders, 'Providers are not loaded yet!');

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
          borrowAprBase:
            rates.length > 0 ? rateToFloat(rates[i + splitIndex]) : undefined,
        };
      });
  }

  /**
   * Returns a historical data of supply rates for all providers. If data for a specific
   * provider is not available at DefiLlama, an empty array is returned.
   */
  async getSupplyProviderStats(): FujiResultPromise<AprResult[]> {
    return this._getProvidersStatsFor(this.collateral);
  }

  /**
   * Returns the digest to be signed by user's injected rpcProvider/wallet.
   *
   * @remarks
   * After the user signs, the next step is to obtain the txData and
   * the address of the router from "this.getTxDetails" which on its turn is
   * to be used in ethers.sendTransaction.
   *
   * @param actionParams - all actions that will be signed
   */
  async signPermitFor(actionParams: RouterActionParams[]): FujiResultPromise<{
    digest: string;
    domain: TypedDataDomain;
    types: Record<string, TypedDataField[]>;
    value: Record<string, string>;
  }> {
    invariant(this.contract, 'Connection not set!');
    const permitParams = findPermitAction(actionParams);
    if (!permitParams) return new FujiResultError('No permit action to sign!');

    const { owner } = permitParams;

    if (this.name === '') {
      await this.preLoad();
    }

    const nonce: BigNumber = await this.contract.nonces(owner.value);
    const xcall = actionParams.find(
      (p) => p.action === RouterAction.X_TRANSFER_WITH_CALL
    );
    const params = xcall
      ? (xcall as XTransferWithCallParams).innerActions
      : actionParams;

    const actions = params.map(({ action }) => BigNumber.from(action));
    const result = params.map((p) => encodeActionArgs(p, true));

    const error = result.find((r): r is FujiResultError => !r.success);
    if (error)
      return new FujiResultError(error.error.message, error.error.code);

    const args: string[] = (result as FujiResultSuccess<string>[]).map(
      (r) => r.data
    );

    const actionArgsHash = keccak256(
      ['bytes'],
      [defaultAbiCoder.encode(['uint8[]', 'bytes[]'], [actions, args])]
    );

    const { domain, types, value } = this._getPermitDigest(
      permitParams,
      nonce,
      actionArgsHash
    );
    const digest = utils._TypedDataEncoder.hash(domain, types, value);

    return new FujiResultSuccess({ digest, domain, types, value });
  }

  protected _setPreLoads(
    safetyRating: BigNumber,
    name: string,
    activeProvider: string,
    allProviders: string[]
  ) {
    this.safetyRating = safetyRating;
    this.name = name;
    this.activeProvider = activeProvider;
    this.allProviders = allProviders;
  }

  protected async _getProvidersStatsFor(
    token: Token,
    isDebt = false
  ): FujiResultPromise<AprResult[]> {
    if (!this.allProviders) {
      await this.preLoad();
    }
    if (!this.allProviders)
      return new FujiResultError('Lending Providers are not preLoaded!');

    const uri = {
      pools: URLS.DEFILLAMA_POOLS,
      chart: URLS.DEFILLAMA_CHART,
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
            // if p.symbol === 'ETH' and token.symbol === 'WETH'
            // in the case of dForce
            token.symbol.includes(p.symbol)
        )?.pool;
      };

      const llamaResult = await Promise.all(
        this.allProviders.map((addr) => {
          const poolId = getPoolId(addr);
          return poolId
            ? axios
                .get<GetLlamaPoolStatsResponse>(uri.chart + `/${poolId}`)
                .then(({ data }) => data.data)
            : Promise.resolve([]);
        })
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
            aprBase: isDebt ? apyBaseBorrow : apyBase,
            aprReward: isDebt ? apyRewardBorrow : apyReward,
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

  private _getPermitDigest(
    params: PermitParams,
    nonce: BigNumber,
    actionArgsHash: string
  ) {
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
        { name: 'actionArgsHash', type: 'bytes32' },
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
      actionArgsHash,
    };

    return { domain, types, value };
  }
}
