import { BigNumber } from '@ethersproject/bignumber';
import { Signature } from '@ethersproject/bytes';
import { TransactionRequest } from '@ethersproject/providers';
import { Call } from '@hovoh/ethcall';
import axios from 'axios';
import invariant from 'tiny-invariant';

import {
  CHAIN,
  COLLATERAL_LIST,
  CONNEXT_ROUTER_ADDRESS,
  CONNEXT_URL,
  DEBT_LIST,
  FujiErrorCode,
  URLS,
  VAULT_LIST,
} from './constants';
import { Address, Currency, Token } from './entities';
import { BorrowingVault } from './entities/BorrowingVault';
import {
  FujiError,
  FujiResultError,
  FujiResultSuccess,
} from './entities/FujiError';
import { ChainId, ChainType, RouterAction } from './enums';
import { batchLoad, encodeActionArgs } from './functions';
import { Nxtp } from './Nxtp';
import { Previews } from './Previews';
import {
  ChainConfig,
  ChainConnectionDetails,
  FujiResultPromise,
  PermitParams,
  RouterActionParams,
  RoutingStepDetails,
  VaultWithFinancials,
} from './types';
import { ConnextRouter__factory } from './types/contracts';
import {
  GetLlamaAssetPoolsResponse,
  GetLlamaBorrowPoolsResponse,
  LlamaAssetPool,
  LlamaBorrowPool,
} from './types/LlamaResponses';

export class Sdk {
  /**
   * Instance of Preview helper class.
   */
  previews: Previews;

  /**
   * ChainConfig object containing Infura and Alchemy ids that
   * are used to create JsonRpcProviders.
   */
  private _configParams: ChainConfig;

  constructor(config: ChainConfig) {
    this.previews = new Previews();
    this._configParams = config;

    Object.values(CHAIN).forEach((c) => c.setConnection(this._configParams));
  }

  /**
   * Static method to check for PERMIT_BORROW or PERMIT_WITHDRAW
   * in array of actions like [DEPOSIT, PERMIT_BORROW, BORROW, X_TRANSFER_WITH_CALL]
   *
   * @param params - array of actions
   */
  static needSignature(params: RouterActionParams[]): boolean {
    return !!params.find((p) => {
      if (p.action === RouterAction.X_TRANSFER_WITH_CALL) {
        return Sdk.needSignature(p.innerActions);
      }
      return (
        p.action === RouterAction.PERMIT_BORROW ||
        p.action === RouterAction.PERMIT_WITHDRAW
      );
    });
  }

  /**
   * Static method to find PERMIT_BORROW or PERMIT_WITHDRAW action.
   *
   * @param params - array of actions
   */
  static findPermitAction(
    params: RouterActionParams[]
  ): PermitParams | undefined {
    for (const p of params) {
      if (
        p.action === RouterAction.PERMIT_BORROW ||
        p.action === RouterAction.PERMIT_WITHDRAW
      )
        return p;
      if (p.action === RouterAction.X_TRANSFER_WITH_CALL) {
        return Sdk.findPermitAction(p.innerActions);
      }
    }

    return undefined;
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
   * Retruns rpc providers as connection details.
   *
   * @param chainId - ID of the chain
   */
  getConnectionFor(chainId: ChainId): ChainConnectionDetails {
    return CHAIN[chainId].setConnection(this._configParams)
      .connection as ChainConnectionDetails;
  }

  /**
   * Retruns tokens that can be borrowed on a specific chain.
   * Sets the connection of each token instance so that they are ready
   * to be used.
   *
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
  async getTokenBalancesFor(
    tokens: Token[],
    account: Address,
    chainId: ChainId
  ): FujiResultPromise<BigNumber[]> {
    if (tokens.find((t) => t.chainId === chainId)) {
      return new FujiResultError(
        FujiErrorCode.SDK,
        'Token from a different chain!',
        {
          chainId,
        }
      );
    }
    try {
      const { multicallRpcProvider } = this.getConnectionFor(chainId);
      const balances = tokens
        .map((token) => token.setConnection(this._configParams))
        .map(
          (token) =>
            token.multicallContract?.balanceOf(account.value) as Call<BigNumber>
        );

      const result = await multicallRpcProvider.all(balances);
      return new FujiResultSuccess(result);
    } catch (e) {
      const message = FujiError.messageFromUnknownError(e);
      return new FujiResultError(FujiErrorCode.MULTICALL, message, { chainId });
    }
  }

  /**
   * Retruns all vaults.
   *
   * @param chainType - for type of chains: mainnet or testnet
   *
   */
  getAllBorrowingVaults(
    chainType: ChainType = ChainType.MAINNET
  ): BorrowingVault[] {
    const vaults = [];
    const chains = Object.values(CHAIN).filter(
      (c) => c.chainType === chainType
    );

    for (const chain of chains) {
      vaults.push(...VAULT_LIST[chain.chainId]);
    }

    return vaults.map((v) => v.setConnection(this._configParams));
  }

  /**
   * Retruns all vaults with financial data such as base deposit APRs and
   * base borrow APRs fetched on-chain.
   *
   * @remarks
   * This methods serves to pre-fetch and loads only partially the financials.
   * It's recommended to call afterwards "getLlamaFinancials()".
   *
   * @param chainId - ID of the chain
   * @param account - {@link Address} for the user
   */
  async getBorrowingVaultsFinancials(
    chainId: ChainId,
    account?: Address
  ): FujiResultPromise<VaultWithFinancials[]> {
    const chain = CHAIN[chainId];
    if (!chain.isDeployed) {
      return new FujiResultError(
        FujiErrorCode.SDK,
        `${chain.name} not deployed`
      );
    }
    const vaults = VAULT_LIST[chainId].map((v) =>
      v.setConnection(this._configParams)
    );
    const res = await batchLoad(vaults, account, chain);
    return res;
  }

  /**
   * Retruns all vaults with the whole financial data
   * loaded from DefiLlama API.
   *
   * @remarks
   * This data is fetched from DefiLlama API and it can take
   * longer than expected to get loaded. Their API is considered being in a
   * "experimental" mode and might be unstable.
   *
   * @param vaults - returned value from "getAllVaultsWithFinancials()"
   */
  async getLlamaFinancials(
    vaults: VaultWithFinancials[]
  ): FujiResultPromise<VaultWithFinancials[]> {
    // fetch from DefiLlama
    const { defillamaproxy } = this._configParams;
    const uri = {
      lendBorrow: defillamaproxy
        ? defillamaproxy + 'lendBorrow'
        : URLS.DEFILLAMA_LEND_BORROW,
      pools: defillamaproxy ? defillamaproxy + 'pools' : URLS.DEFILLAMA_POOLS,
    };
    try {
      const [borrows, pools] = await Promise.all([
        axios
          .get<GetLlamaBorrowPoolsResponse>(uri.lendBorrow)
          .then(({ data }) => data),
        axios
          .get<GetLlamaAssetPoolsResponse>(uri.pools)
          .then(({ data }) => data.data),
      ]);

      const data = vaults.map((vault) =>
        this._getFinancialsFor(vault, pools, borrows)
      );
      return new FujiResultSuccess(data);
    } catch (e) {
      const message = axios.isAxiosError(e)
        ? `DefiLlama API call failed with a message: ${e.message}`
        : 'DefiLlama API call failed with an unexpected error!';
      console.error(message);
      return new FujiResultError(FujiErrorCode.LLAMA, message);
    }
  }

  /**
   * Retruns all vaults for a given combination of tokens and sets a connection for each of them.
   *
   * @remarks
   * The vaults are sorted after checks of the lowest borrow rate for the debt token.
   * If collateral and debt tokens are on the same chain, we privilage the vault
   * on the same chain even though it has a lowest borrow rate.
   *
   * @param collateral - collateral instance of {@link Token}
   * @param debt - debt instance of {@link Token}
   */
  async getBorrowingVaultsFor(
    collateral: Token,
    debt: Token
  ): Promise<BorrowingVault[]> {
    // TODO: sort by safety rating too
    // find all vaults with this pair
    const vaults = this._findVaultsByTokens(collateral, debt).map(
      (v: BorrowingVault) => v.setConnection(this._configParams)
    );

    const rates = await Promise.all(vaults.map((v) => v.getBorrowRate()));

    // and sort them by borrow rate
    const sorted = vaults
      .map((vault, i) => ({ vault, rate: rates[i] }))
      .sort((a, b) => (a.rate.lte(b.rate) ? -1 : 0))
      .map(({ vault }) => vault);

    if (collateral.chainId === debt.chainId) {
      // sort again to privilege vaults on the same chain
      sorted.sort((a) =>
        a.collateral.chainId === collateral.chainId ? -1 : 0
      );
    }

    return sorted;
  }

  /**
   * Prepares and returns the request to be passed to ethers.sendTransaction
   *
   * @remarks
   * It's recommended to obtain `actionParams` from this.previewDepositAndBorrow.
   * If there are any permit action, they have to be signed.
   *
   * @param actionParams - vault instance on which we want to open a position
   * @param srcChainId - ID of the chain from which the tx gets init
   * @param account - user address, wrapped in {@link Address}
   * @param signature - a signiture for the permit action (optional)
   */
  getTxDetails(
    actionParams: RouterActionParams[],
    srcChainId: ChainId,
    account: Address,
    signature?: Signature
  ): TransactionRequest {
    // dummy copy actionParams because of the immutabiltiy of Immer
    const _actionParams = actionParams.map((a) => ({ ...a }));
    const permitAction = Sdk.findPermitAction(_actionParams);

    if (permitAction && signature) {
      permitAction.v = signature.v;
      permitAction.r = signature.r;
      permitAction.s = signature.s;
    } else if (permitAction && !signature) {
      invariant(true, 'You need to sign the permit action first!');
    } else if (!permitAction && signature) {
      invariant(true, 'No permit action although there is a signature!');
    }

    const actions = _actionParams.map(({ action }) => BigNumber.from(action));
    const args = _actionParams.map(encodeActionArgs);
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

  /**
   * Based on the `steps` tracks the tx status and resolves with txHash.
   *
   * @param transactionHash - hash of the tx on the source chain.
   * @param steps - array of the steps obtained from `sdk.previews.METHOD`.
   */
  async watchTxStatus(
    transactionHash: string,
    steps: RoutingStepDetails[]
  ): Promise<RoutingStepDetails[]> {
    const srcChainId = steps[0].chainId;
    const chainType = CHAIN[srcChainId].chainType;
    const transferId = await this.getTransferId(srcChainId, transactionHash);

    const srcTxHash = Promise.resolve(transactionHash);
    const destTxHash = this.getDestTxHash(transferId ?? '', chainType);

    return steps.map((step) => ({
      ...step,
      txHash: step.chainId === srcChainId ? srcTxHash : destTxHash,
    }));
  }

  /**
   * Gets ID of the transfer attributed by Connext.
   *
   * @param chainId - ID of the chain where the tx gets initiated.
   * @param transactionHash - hash of the tx on the source chain.
   */
  async getTransferId(
    chainId: ChainId,
    transactionHash: string
  ): Promise<string | undefined> {
    const { rpcProvider } = this.getConnectionFor(chainId);
    const receipt = await rpcProvider.waitForTransaction(transactionHash);
    invariant(
      !!receipt,
      `Receipt not valid from tx with hash ${transactionHash}`
    );
    const blockHash = receipt.blockHash;
    const srcContract = ConnextRouter__factory.connect(
      CONNEXT_ROUTER_ADDRESS[chainId].value,
      rpcProvider
    );
    const events = await srcContract.queryFilter(
      srcContract.filters.XCalled(),
      blockHash
    );
    let transferId;
    for (const event of events.filter(
      (e) => e.transactionHash == transactionHash
    )) {
      transferId = event.args[0];
    }
    return transferId;
  }

  /**
   * Resolves with the tx hash on the destination chain,
   * once the destination tx gets executed.
   * `transferId` can be obtained from `sdk.getTransferId`.
   *
   * @param transferId - transfer ID according to Connext numenclature.
   * @param chainType - type of the chain: testnet or mainnet.
   */
  getDestTxHash(
    transferId: string,
    chainType: ChainType = ChainType.MAINNET
  ): Promise<string> {
    const chainStr = chainType === ChainType.MAINNET ? 'mainnet' : 'testnet';
    return new Promise((resolve) => {
      const apiCall = () => axios.get(CONNEXT_URL(chainStr, transferId));
      const interval = () => {
        apiCall()
          .then(({ data }) => {
            if (data.length > 0 && data[0].execute_transaction_hash)
              resolve(data[0].execute_transaction_hash);
            else setTimeout(interval, 2000);
          })
          .catch((err) => console.error(err));
      };

      interval();
    });
  }

  /**
   * Estimates the fee to be paid to a destination chain relayer
   * for the tx to get settled.
   *
   * @param srcChainId - ID of the source chain.
   * @param destChainId - ID of the destination chain.
   */
  async estimateRelayerFee(
    srcChainId: ChainId,
    destChainId: ChainId
  ): Promise<BigNumber> {
    const nxtp = await Nxtp.getOrCreate();

    const srcDomain = CHAIN[srcChainId].connextDomain;
    const destDomain = CHAIN[destChainId].connextDomain;
    invariant(
      srcDomain && destDomain,
      'Estimaing fee for an unsupported by Connext chain!'
    );

    return nxtp.base.estimateRelayerFee({
      originDomain: String(srcDomain),
      destinationDomain: String(destDomain),
    });
  }

  private _findVaultsByTokens(
    collateral: Token,
    debt: Token
  ): BorrowingVault[] {
    const collateralSym = collateral.symbol;
    const debtSym = debt.symbol;

    const chains = [collateral.chainId, debt.chainId];

    return Object.entries(VAULT_LIST)
      .map(([, list]) => list)
      .reduce((acc, list) => {
        const vaults = list
          .filter(
            (v: BorrowingVault) =>
              chains.includes(v.collateral.chainId) ||
              chains.includes(v.debt.chainId)
          )
          .filter(
            (v: BorrowingVault) =>
              v.collateral.symbol === collateralSym && v.debt.symbol === debtSym
          );
        return [...acc, ...vaults];
      }, []);
  }

  private _getFinancialsFor(
    v: VaultWithFinancials,
    pools: LlamaAssetPool[],
    borrows: LlamaBorrowPool[]
  ): VaultWithFinancials {
    const chain = CHAIN[v.vault.chainId].llamaKey;
    const project = v.activeProvider.llamaKey;
    const collateralSym = v.vault.collateral.symbol;
    const debtSym = v.vault.debt.symbol;

    const borrowPool = pools.find(
      (p: LlamaAssetPool) =>
        p.chain === chain && p.project === project && p.symbol === debtSym
    );

    let borrowData;
    if (borrowPool) {
      borrowData = borrows.find(
        (b: LlamaBorrowPool) => b.pool === borrowPool.pool
      );
    }

    const depositData = pools.find(
      (p: LlamaAssetPool) =>
        p.chain === chain && p.project === project && p.symbol === collateralSym
    );

    return {
      ...v,
      activeProvider: {
        ...v.activeProvider,
        depositAprReward: depositData?.apyReward,
        depositRewardTokens: depositData?.rewardTokens,
        borrowAprReward: borrowData?.apyRewardBorrow,
        borrowRewardTokens: borrowData?.rewardTokens,
        availableToBorrowUSD: borrowData
          ? borrowData.totalSupplyUsd - borrowData.totalBorrowUsd
          : undefined,
      },
    };
  }
}
