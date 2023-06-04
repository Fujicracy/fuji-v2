import { BigNumber } from '@ethersproject/bignumber';
import { Signature } from '@ethersproject/bytes';
import { TransactionRequest } from '@ethersproject/providers';
import { Call } from '@hovoh/ethcall';
import axios from 'axios';

import {
  BN_ZERO,
  CHAIN,
  COLLATERAL_LIST,
  CONNEXT_ROUTER_ADDRESS,
  CONNEXT_URL,
  DEBT_LIST,
  FujiErrorCode,
  NATIVE,
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
import { ChainId, ChainType, ConnextTxStatus, RouterAction } from './enums';
import {
  batchLoad,
  encodeActionArgs,
  findPermitAction,
  waitForTransaction,
} from './functions';
import { Nxtp } from './Nxtp';
import { Previews } from './Previews';
import {
  ChainConfig,
  ChainConnectionDetails,
  ConnextTxDetails,
  FujiResult,
  FujiResultPromise,
  RouterActionParams,
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
   * Returns tokens that can be used as collateral on a specific chain.
   * Sets the connection of each token instance so that they are ready
   * to be used.
   *
   * @param chainId - ID of the chain
   */
  getCollateralForChain(chainId: ChainId): Currency[] {
    let list: Currency[] = COLLATERAL_LIST[chainId].map((token: Token) =>
      token.setConnection(this._configParams)
    );
    // we don't support yet WMATIC and WXDAI as collateral
    if (![ChainId.MATIC, ChainId.GNOSIS].includes(chainId)) {
      list = [NATIVE[chainId].setConnection(this._configParams), ...list];
    }
    return list;
  }

  /**
   * Returns tokens that can be borrowed on a specific chain.
   * Sets the connection of each token instance so that they are ready
   * to be used.
   *
   * @param chainId - ID of the chain
   */
  getDebtForChain(chainId: ChainId): Currency[] {
    const list: Currency[] = DEBT_LIST[chainId].map((token: Token) =>
      token.setConnection(this._configParams)
    );
    //if (![ChainId.MATIC, ChainId.GNOSIS].includes(chainId)) {
    //list = [NATIVE[chainId].setConnection(this._configParams), ...list];
    //}
    return list;
  }

  /**
   * Returns rpc providers as connection details.
   *
   * @param chainId - ID of the chain
   */
  getConnectionFor(chainId: ChainId): ChainConnectionDetails {
    return CHAIN[chainId].setConnection(this._configParams)
      .connection as ChainConnectionDetails;
  }

  /**
   * Returns the balance of account for a given currency,
   * both for native and token.
   *
   * @param currency - instance of {@link Currency}
   * @param account - user address, wrapped in {@link Address}
   */
  getBalanceFor(currency: Currency, account: Address): Promise<BigNumber> {
    return currency.setConnection(this._configParams).balanceOf(account);
  }

  /**
   * Returns the allowance that an account has given to a router
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
   * Returns the token balances of an address in a batch.
   * Throws an error if `chainId` is different from each `token.chainId`.
   *
   * @param currencies - array of {@link Currency} from the same chain
   * @param account - user address, wrapped in {@link Address}
   * @param chainId - ID of the chain
   */
  async getBalancesFor(
    currencies: Currency[],
    account: Address,
    chainId: ChainId
  ): FujiResultPromise<BigNumber[]> {
    if (currencies.find((t) => t.chainId !== chainId)) {
      return new FujiResultError(
        'Currency from a different chain!',
        FujiErrorCode.SDK,
        {
          chainId,
        }
      );
    }
    try {
      const { multicallRpcProvider, rpcProvider } =
        this.getConnectionFor(chainId);
      const tokens = currencies.filter((c) => c.isToken) as Token[];
      const balances = tokens
        .map((token) => token.setConnection(this._configParams))
        .map(
          (token) =>
            token.multicallContract?.balanceOf(account.value) as Call<BigNumber>
        );

      const [bals, nativeBal] = await Promise.all([
        multicallRpcProvider.all(balances),
        rpcProvider.getBalance(account.value),
      ]);
      // insert the native balance back at the position it was requested
      const nativeIndex = currencies.findIndex((c) => c.isNative);
      if (nativeIndex !== -1) bals.splice(nativeIndex, 0, nativeBal);
      return new FujiResultSuccess(bals);
    } catch (e) {
      const message = FujiError.messageFromUnknownError(e);
      return new FujiResultError(message, FujiErrorCode.MULTICALL, { chainId });
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
      return new FujiResultError(`${chain.name} not deployed`);
    }
    const vaults = VAULT_LIST[chainId].map((v) =>
      v.setConnection(this._configParams)
    );
    return await batchLoad(vaults, account, chain);
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
      return new FujiResultError(message, FujiErrorCode.LLAMA);
    }
  }

  /**
   * Retruns all vaults for a given combination of tokens and sets a connection for each of them.
   *
   * @remarks
   * The vaults are sorted after checks of the lowest borrow rate for the debt token.
   * If collateral and debt tokens are on the same chain, we privilege the vault
   * on the same chain even though it has a lowest borrow rate.
   *
   * @param collateral - collateral instance of {@link Currency}
   * @param debt - debt instance of {@link Currency}
   * @param account - debt instance of {@link Currency}
   */
  async getBorrowingVaultsFor(
    collateral: Currency,
    debt: Currency,
    account?: Address
  ): FujiResultPromise<VaultWithFinancials[]> {
    const _collateral = collateral.isToken ? collateral : collateral.wrapped;
    const _debt = debt.isToken ? debt : debt.wrapped;

    // find all vaults with this pair
    try {
      const _vaults = this._findVaultsByTokens(_collateral, _debt).map(
        (v: BorrowingVault) => v.setConnection(this._configParams)
      );
      const vaults = [];
      if (collateral.chainId === debt.chainId) {
        const r = await batchLoad(_vaults, account, collateral.chain);
        if (r.success) vaults.push(...r.data);
        else return r;
      } else {
        const r1 = _vaults.filter((v) => v.chainId === collateral.chainId);
        const r2 = _vaults.filter((v) => v.chainId === debt.chainId);
        const [a, b] = await Promise.all([
          batchLoad(r1, account, collateral.chain),
          batchLoad(r2, account, debt.chain),
        ]);
        if (a.success && b.success) vaults.push(...a.data, ...b.data);
        else return a.success ? b : a;
      }

      // sort them by borrow rate
      const sorted = vaults.sort((a, b) =>
        Number(a.activeProvider?.borrowAprBase) <=
        Number(b.activeProvider?.borrowAprBase)
          ? -1
          : 0
      );
      // TODO: sort by safety rating too

      //if (collateral.chainId === debt.chainId) {
      //// sort again to privilege vaults on the same chain
      //sorted.sort((a) =>
      //a.collateral.chainId === collateral.chainId ? -1 : 0
      //);
      //}

      return new FujiResultSuccess(sorted);
    } catch (error) {
      return new FujiResultError('Error getting vaults', FujiErrorCode.SDK);
    }
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
   * @param signature - a signature for the permit action (optional)
   */
  getTxDetails(
    actionParams: RouterActionParams[],
    srcChainId: ChainId,
    account: Address,
    signature?: Signature
  ): FujiResult<TransactionRequest> {
    // dummy copy actionParams because of the immutability of Immer
    const _actionParams = actionParams.map((a) => ({ ...a }));
    const permitAction = findPermitAction(_actionParams);

    if (permitAction && signature) {
      permitAction.v = signature.v;
      permitAction.r = signature.r;
      permitAction.s = signature.s;
    } else if (permitAction && !signature) {
      return new FujiResultError('You need to sign the permit action first!');
    } else if (!permitAction && signature) {
      return new FujiResultError(
        'No permit action although there is a signature!'
      );
    }

    const actions = _actionParams.map(({ action }) => BigNumber.from(action));
    const result = _actionParams.map((p) => encodeActionArgs(p, false));

    const error = result.find((r): r is FujiResultError => !r.success);
    if (error)
      return new FujiResultError(error.error.message, error.error.code);

    const args: string[] = (result as FujiResultSuccess<string>[]).map(
      (r) => r.data
    );

    const callData =
      ConnextRouter__factory.createInterface().encodeFunctionData('xBundle', [
        actions,
        args,
      ]);

    const first = actionParams[0];
    const txValue =
      first?.action !== RouterAction.DEPOSIT_ETH ? BN_ZERO : first.amount;
    return new FujiResultSuccess({
      from: account.value,
      to: CONNEXT_ROUTER_ADDRESS[srcChainId].value,
      data: callData,
      value: txValue,
      chainId: srcChainId,
    });
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
  ): FujiResultPromise<string | undefined> {
    const { rpcProvider } = this.getConnectionFor(chainId);
    const receipt = await waitForTransaction(rpcProvider, transactionHash);
    if (!receipt.success) {
      return new FujiResultError(
        `Receipt not valid from tx with hash ${transactionHash}`
      );
    }
    const blockHash = receipt.data.blockHash;
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
    return new FujiResultSuccess(transferId);
  }

  /**
   * Resolves with the tx hash on the destination chain,
   * once the destination tx gets executed.
   * `transferId` can be obtained from `sdk.getTransferId`.
   *
   * @param transferId - transfer ID according to Connext nomenclature.
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
   * Gets details for a cross-chain operation with Connext.
   *
   * @remarks
   * The cross-chain operation is pending in the following cases and
   * this method should be called again in a couple of seconds when
   * returned status is `UNKNOWN` or `PENDING`.
   *
   * @param srcChainId - ID of the chain where the tx gets initiated.
   * @param srcTxHash - hash of the tx on the source chain.
   */
  async getConnextTxDetails(
    srcChainId: ChainId,
    srcTxHash: string
  ): FujiResultPromise<ConnextTxDetails> {
    const nxtp = await Nxtp.getOrCreate();
    const [connextTx] = await nxtp.utils
      .getTransfers({ transactionHash: srcTxHash })
      .catch((_) => []);

    if (!connextTx) {
      const transferId = await this.getTransferId(srcChainId, srcTxHash);
      if (!transferId.success || transferId.data === undefined)
        return new FujiResultError(
          'Not cross-chain transaction',
          FujiErrorCode.TX,
          {
            srcTxHash,
          }
        );
      else
        return new FujiResultSuccess({
          status: ConnextTxStatus.UNKNOWN,
          connextTransferId: transferId.data,
        });
    }

    if (Number(connextTx.origin_chain) !== srcChainId) {
      return new FujiResultError('Source chain mismatch', FujiErrorCode.SDK, {
        paramSrcChainId: srcChainId,
        connextSrcChainId: Number(connextTx.origin_chain),
      });
    }

    const connextTransferId: string = connextTx.transfer_id;

    if (connextTx.status === 'Reconciled' && connextTx.error_status) {
      return new FujiResultError(
        connextTx.error_status,
        FujiErrorCode.CONNEXT,
        { srcTxHash, connextTransferId }
      );
    }

    const destTxHash: string | null = connextTx.execute_transaction_hash;
    if (!destTxHash) {
      return new FujiResultSuccess({
        status: ConnextTxStatus.PENDING,
        connextTransferId,
      });
    }

    // check if XReceived was successful
    const destChainId: ChainId = Number(connextTx.destination_chain);
    const { rpcProvider } = this.getConnectionFor(destChainId);
    const receipt = await waitForTransaction(rpcProvider, destTxHash);
    if (!receipt.success)
      return new FujiResultError('Receipt not valid', FujiErrorCode.TX, {
        destTxHash,
        connextTransferId,
      });

    // do operations (deposit, borrow, etc) on src chain and only transfer to dest chain
    // in which case there's no calldata
    if (connextTx.call_data === '0x') {
      if (receipt.data.status === 1)
        return new FujiResultSuccess({
          status: ConnextTxStatus.EXECUTED,
          connextTransferId,
          destTxHash,
        });
      else
        return new FujiResultError(
          'Transaction reverted on destination chain',
          FujiErrorCode.TX,
          { destTxHash, connextTransferId }
        );
    }

    // do operations on dest chain
    const srcContract = ConnextRouter__factory.connect(
      CONNEXT_ROUTER_ADDRESS[destChainId].value,
      rpcProvider
    );
    const events = await srcContract.queryFilter(
      srcContract.filters.XReceived(),
      receipt.data.blockHash
    );
    const e = events.find((e) => e.transactionHash == destTxHash);

    if (!e)
      return new FujiResultError(
        'Cannot find XReceived event',
        FujiErrorCode.TX,
        { destTxHash, connextTransferId }
      );

    // check if XReceived was successful
    if (e?.args.success) {
      return new FujiResultSuccess({
        status: ConnextTxStatus.EXECUTED,
        connextTransferId,
        destTxHash,
      });
    } else {
      return new FujiResultError(
        'Transaction execution on destination chain failed',
        FujiErrorCode.TX,
        { destTxHash, connextTransferId }
      );
    }
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
  ): FujiResultPromise<BigNumber> {
    const nxtp = await Nxtp.getOrCreate();

    const srcDomain = CHAIN[srcChainId].connextDomain;
    const destDomain = CHAIN[destChainId].connextDomain;
    if (!srcDomain || !destDomain) {
      return new FujiResultError(
        'Estimating fee for an unsupported by Connext chain!'
      );
    }

    try {
      const result = await nxtp.base.estimateRelayerFee({
        originDomain: String(srcDomain),
        destinationDomain: String(destDomain),
      });
      return new FujiResultSuccess(result);
    } catch (e) {
      const message = FujiError.messageFromUnknownError(e);
      return new FujiResultError(message, FujiErrorCode.CONNEXT);
    }
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
