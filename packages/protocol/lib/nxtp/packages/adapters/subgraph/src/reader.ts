import { BigNumber } from "ethers";
import {
  XTransfer,
  SubgraphQueryMetaParams,
  ChainData,
  Asset,
  OriginTransfer,
  DestinationTransfer,
  RouterBalance,
  AssetBalance,
  SubgraphQueryByTransferIDsMetaParams,
  SubgraphQueryByTimestampMetaParams,
} from "@connext/nxtp-utils";

import { getHelpers } from "./lib/helpers";
import {
  getAssetBalanceQuery,
  getAssetBalancesQuery,
  getAssetByCanonicalIdQuery,
  getAssetByLocalQuery,
  getDestinationTransfersByDomainAndIdsQuery,
  getRouterQuery,
  getOriginTransfersByIdsQuery,
  getOriginTransfersQuery,
  getOriginTransfersByTransactionHashesQuery,
  getDestinationTransfersByIdsQuery,
  getAssetBalancesRoutersQuery,
  getLastestBlockNumberQuery,
  getMaxRoutersPerTransferQuery,
  getOriginTransfersByIDsCombinedQuery,
  getDestinationTransfersByIDsCombinedQuery,
  getOriginTransfersByNonceQuery,
  getDestinationTransfersByNonceQuery,
  getDestinationTransfersByDomainAndReconcileTimestampQuery,
} from "./lib/operations";
import { SubgraphMap } from "./lib/entities";

let context: { config: SubgraphMap };
export const getContext = () => context;

export class SubgraphReader {
  private static instance: SubgraphReader | undefined;

  // Getter for reading supported domains.
  public get supported(): Record<string, boolean> {
    return { ...context.config.supported };
  }

  private constructor(config: SubgraphMap) {
    context = { config };
  }

  public static async create(
    chainData: Map<string, ChainData>,
    env: "staging" | "production" = "production",
    prefixOverride?: string, // optional override for the prefix
  ): Promise<SubgraphReader> {
    if (SubgraphReader.instance) {
      return SubgraphReader.instance;
    }
    const { create } = getHelpers();
    const config = await create(chainData, env, prefixOverride);
    return new SubgraphReader(config);
  }

  /**
   * Make a direct GraphQL query to the subgraph of the given domain.
   *
   * @param query - The GraphQL query string you want to send.
   * @returns Query result (any).
   */
  public async query(query: string): Promise<any> {
    const { execute } = getHelpers();
    return await execute(query);
  }

  /**
   * Gets the latest blockNumber for domains.
   * @param domains The domain list you're getting the lastest blockNumber for
   */
  public async getLatestBlockNumber(domains: string[]): Promise<Map<string, number>> {
    const { execute, getPrefixForDomain } = getHelpers();
    const prefixes = domains.map((domain) => getPrefixForDomain(domain));
    const query = getLastestBlockNumberQuery(prefixes);
    const response = await execute(query);
    const blockNumberRes: Map<string, number> = new Map();
    for (const domain of response.keys()) {
      if (response.has(domain) && response.get(domain)!.length > 0) {
        const blockInfo = response.get(domain)![0];
        blockNumberRes.set(domain, Number(blockInfo.block.number));
      }
    }
    return blockNumberRes;
  }

  /**
   * Gets the maxRoutersPerTransfer for domains
   * @param domains The domain list you're getting the maxRoutersPerTransfer for
   */
  public async getMaxRoutersPerTransfer(domains: string[]): Promise<Map<string, number>> {
    const { execute, getPrefixForDomain } = getHelpers();
    const prefixes = domains.map((domain) => getPrefixForDomain(domain));
    const maxRoutersRes: Map<string, number> = new Map();
    const query = getMaxRoutersPerTransferQuery(prefixes);
    try {
      const response = await execute(query);
      for (const domain of response.keys()) {
        if (response.has(domain) && response.get(domain)!.length > 0) {
          const settingInfo = response.get(domain)![0];
          maxRoutersRes.set(domain, Number(settingInfo.maxRoutersPerTransfer));
        }
      }
    } catch (e: unknown) {
      domains.forEach((domain) => maxRoutersRes.set(domain, 5));
    }
    return maxRoutersRes;
  }

  /**
   * Returns available liquidity for the given asset on the Connext on the provided chain.
   *
   * @param domain - The domain you want to determine liquidity on
   * @param router - Router address
   * @param local - The local asset you want to determine router liquidity of
   * @returns The available balance
   */
  public async getAssetBalance(domain: string, router: string, local: string): Promise<BigNumber> {
    const { execute, getPrefixForDomain } = getHelpers();
    const prefix = getPrefixForDomain(domain);

    const query = getAssetBalanceQuery(prefix, router.toLowerCase(), local.toLowerCase());
    const response = await execute(query);
    if (![...response.values()][0] || [...response.values()][0].length == 0) {
      return BigNumber.from("0");
    }
    return BigNumber.from([...response.values()][0][0].amount);
  }

  /**
   * Returns available liquidity for all of the routers' assets on target chain.
   *
   * @param domain - The domain you want to determine liquidity on
   * @param router - Router address
   * @returns An array of asset ids and amounts of liquidity
   */
  public async getAssetBalances(domain: string, router: string): Promise<Record<string, BigNumber>> {
    const { execute, getPrefixForDomain } = getHelpers();
    const prefix = getPrefixForDomain(domain);

    const query = getAssetBalancesQuery(prefix, router.toLowerCase());
    const response = await execute(query);

    const assetBalances = [...response.values()][0] ? [...response.values()][0][0] : [];
    const balances: Record<string, BigNumber> = {};
    assetBalances.forEach((bal: any) => (balances[bal.asset.local as string] = BigNumber.from(bal.amount)));
    return balances;
  }

  /**
   * Returns available liquidity for of the routers assets on target chain.
   *
   * @param domain - The domain you want to determine liquidity on
   * @returns An array of asset ids and amounts of liquidity
   */
  public async getAssetBalancesRouters(
    domain: string,
    offset: number,
    limit: number,
    orderDirection: "asc" | "desc" = "desc",
  ): Promise<RouterBalance[]> {
    const { execute, getPrefixForDomain } = getHelpers();
    const prefix = getPrefixForDomain(domain);

    const query = getAssetBalancesRoutersQuery(prefix, offset, limit, orderDirection);
    const response = await execute(query);
    const routers = [...response.values()][0][0];
    return routers.map((router: any) => {
      return {
        assets: router.assetBalances.map((a: any) => {
          return {
            adoptedAsset: a.asset.adoptedAsset,
            balance: a.amount,
            blockNumber: a.asset.blockNumber,
            canonicalDomain: a.asset.canonicalDomain,
            canonicalId: a.asset.canonicalId,
            domain,
            local: a.asset.local,
          } as AssetBalance;
        }),
        router: router.id,
      } as RouterBalance;
    });
  }

  /**
   * Returns the router's approval status
   *
   * @param domain - The domain to get the router status of
   * @param _router - The router address
   * @returns A boolean indicating the router is approved
   */
  public async isRouterApproved(domain: string, _router: string): Promise<boolean> {
    const { execute, getPrefixForDomain } = getHelpers();
    const prefix = getPrefixForDomain(domain);

    const query = getRouterQuery(prefix, _router.toLowerCase());
    const response = await execute(query);
    const router = [...response.values()][0] ? [...response.values()][0][0] : undefined;
    return !!router?.id;
  }

  /**
   * Gets the asset by the local address on the specific domain
   * @param domain - The domain you're going to get the asset on
   * @param local - The local asset address
   */
  public async getAssetByLocal(domain: string, local: string): Promise<Asset | undefined> {
    const { execute, getPrefixForDomain } = getHelpers();
    const prefix = getPrefixForDomain(domain);

    const query = getAssetByLocalQuery(prefix, local.toLowerCase());
    const response = await execute(query);
    const assets = [...response.values()][0] ? [...response.values()][0][0] : [];
    if (assets.length === 0) {
      return undefined;
    }
    return assets[0] as Asset;
  }

  /**
   * Gets the asset by the canonicalId on the specific domain
   * @param domain - The domain you're going to get the asset on
   * @param canonicalId - The canonicalId defined by Nomad
   */
  public async getAssetByCanonicalId(domain: string, canonicalId: string): Promise<Asset | undefined> {
    const { execute, getPrefixForDomain } = getHelpers();
    const prefix = getPrefixForDomain(domain);

    const query = getAssetByCanonicalIdQuery(prefix, canonicalId.toLowerCase());
    const response = await execute(query);
    const assets = [...response.values()][0] ? [...response.values()][0][0] : [];
    if (assets.length === 0) {
      return undefined;
    }
    return assets[0] as Asset;
  }

  // public async getTransaction(domain: string, transactionId: string): Promise<XTransfer> {}
  /**
   * Retrieve a target OriginTransfer belonging to a given domain by transfer ID.
   *
   * @param domain - The domain you want to get the transfer from.
   * @param transferId - The ID of the transfer you want to retrieve.
   * @returns Parsed OriginTransfer object if transfer exists, otherwise undefined.
   */
  public async getOriginTransferById(domain: string, transferId: string): Promise<OriginTransfer | undefined> {
    const { parser, execute, getPrefixForDomain } = getHelpers();
    const prefix: string = getPrefixForDomain(domain);

    const query = getOriginTransfersByIdsQuery(prefix, [`"${transferId}"`]);
    const response = await execute(query);
    const transfers = [...response.values()][0] ? [...response.values()][0][0] : [];
    return transfers.length === 1 ? parser.originTransfer(transfers[0]) : undefined;
  }

  /**
   * Retrieve a target OriginTransfer belonging to a given domain by its transaction hash (the hash of the xcall
   * method call on-chain).
   *
   * @param domain - The domain you want to get the transfer from.
   * @param hash - The xcall transactionHash belonging to the transfer you want to retrieve.
   * @returns Parsed OriginTransfer object if transfer exists, otherwise undefined.
   */
  public async getOriginTransferByHash(domain: string, hash: string): Promise<OriginTransfer | undefined> {
    const { parser, execute, getPrefixForDomain } = getHelpers();
    const prefix: string = getPrefixForDomain(domain);

    const query = getOriginTransfersByTransactionHashesQuery(prefix, [`"${hash}"`]);
    const response = await execute(query);
    const transfers = [...response.values()][0][0];
    return transfers.length === 1 ? parser.originTransfer(transfers[0]) : undefined;
  }

  /**
   * Retrieve a target DestinationTransfer belonging to a given domain by transfer ID.
   *
   * @param domain - The domain you want to get the transfer from.
   * @param transferId - The ID of the transfer you want to retrieve.
   * @returns Parsed DestinationTransfer object if transfer exists, otherwise undefined.
   */
  public async getDestinationTransferById(
    domain: string,
    transferId: string,
  ): Promise<DestinationTransfer | undefined> {
    const { parser, execute, getPrefixForDomain } = getHelpers();
    const prefix: string = getPrefixForDomain(domain);

    const query = getDestinationTransfersByIdsQuery(prefix, [`"${transferId}"`]);
    const response = await execute(query);
    const transfers = [...response.values()][0][0];
    return transfers.length === 1 ? parser.destinationTransfer(transfers[0]) : undefined;
  }

  /**
   * Get the transfers across the multiple domains
   * @param agents - The reference parameters
   */
  public async getOriginTransfers(agents: Map<string, SubgraphQueryMetaParams>): Promise<XTransfer[]> {
    const { execute, parser } = getHelpers();
    const xcalledXQuery = getOriginTransfersQuery(agents);
    const response = await execute(xcalledXQuery);

    const transfers: any[] = [];
    for (const key of response.keys()) {
      const value = response.get(key);
      transfers.push(value?.flat());
    }

    const originTransfers: XTransfer[] = transfers
      .flat()
      .filter((x: any) => !!x)
      .map(parser.originTransfer);

    return originTransfers;
  }

  public async getOriginTransfersByNonce(params: Map<string, SubgraphQueryMetaParams>): Promise<XTransfer[]> {
    const { execute, parser } = getHelpers();
    const xcalledXQuery = getOriginTransfersByNonceQuery(params);
    const response = await execute(xcalledXQuery);

    const transfers: any[] = [];
    for (const key of response.keys()) {
      const value = response.get(key);
      transfers.push(value?.flat());
    }

    const originTransfers: XTransfer[] = transfers
      .flat()
      .filter((x: any) => !!x)
      .map(parser.originTransfer);

    return originTransfers;
  }

  public async getDestinationTransfersByNonce(params: Map<string, SubgraphQueryMetaParams>): Promise<XTransfer[]> {
    const { execute, parser } = getHelpers();
    const xcalledXQuery = getDestinationTransfersByNonceQuery(params);
    const response = await execute(xcalledXQuery);

    const transfers: any[] = [];
    for (const key of response.keys()) {
      const value = response.get(key);
      transfers.push(value?.flat());
    }

    const destinationTransfers: XTransfer[] = transfers
      .flat()
      .filter((x: any) => !!x)
      .map(parser.destinationTransfer);

    return destinationTransfers;
  }

  public async getOriginTransfersById(params: Map<string, SubgraphQueryByTransferIDsMetaParams>): Promise<XTransfer[]> {
    const { execute, parser } = getHelpers();
    const xcalledXQuery = getOriginTransfersByIDsCombinedQuery(params);
    const response = await execute(xcalledXQuery);

    const transfers: any[] = [];
    for (const key of response.keys()) {
      const value = response.get(key);
      transfers.push(value?.flat());
    }

    const originTransfers: XTransfer[] = transfers
      .flat()
      .filter((x: any) => !!x)
      .map(parser.originTransfer);

    return originTransfers;
  }

  public async getDestinationTransfersById(
    params: Map<string, SubgraphQueryByTransferIDsMetaParams>,
  ): Promise<XTransfer[]> {
    const { execute, parser } = getHelpers();
    const xcalledXQuery = getDestinationTransfersByIDsCombinedQuery(params);
    const response = await execute(xcalledXQuery);

    const transfers: any[] = [];
    for (const key of response.keys()) {
      const value = response.get(key);
      transfers.push(value?.flat());
    }

    const destinationTransfers: XTransfer[] = transfers
      .flat()
      .filter((x: any) => !!x)
      .map(parser.destinationTransfer);

    return destinationTransfers;
  }

  public async getDestinationTransfersByDomainAndReconcileTimestamp(
    param: SubgraphQueryByTimestampMetaParams,
    domain: string,
  ): Promise<XTransfer[]> {
    const { execute, parser } = getHelpers();
    const xcalledXQuery = getDestinationTransfersByDomainAndReconcileTimestampQuery(param, domain);
    const response = await execute(xcalledXQuery);

    const transfers: any[] = [];
    for (const key of response.keys()) {
      const value = response.get(key);
      transfers.push(value?.flat());
    }

    const destinationTransfers: XTransfer[] = transfers
      .flat()
      .filter((x: any) => !!x)
      .map(parser.destinationTransfer);

    return destinationTransfers;
  }

  /**
   * Gets the xcalled transactions across all the chains.
   * @param agents - The reference parameters.
   * @returns an array of XTransfers.
   */
  public async getXCalls(agents: Map<string, SubgraphQueryMetaParams>): Promise<XTransfer[]> {
    const { execute, parser } = getHelpers();
    const xcalledXQuery = getOriginTransfersQuery(agents);
    let response = await execute(xcalledXQuery);
    const txIdsByDestinationDomain: Map<string, string[]> = new Map();
    const allTxById: Map<string, XTransfer> = new Map();
    for (const domain of response.keys()) {
      const value = response.get(domain);
      const xtransfersByDomain = (value ?? [])[0];
      for (const xtransfer of xtransfersByDomain) {
        allTxById.set(xtransfer.transferId as string, parser.originTransfer(xtransfer));
        if (txIdsByDestinationDomain.has(xtransfer.destinationDomain as string)) {
          txIdsByDestinationDomain
            .get(xtransfer.destinationDomain as string)!
            .push(`"${xtransfer.transferId as string}"`);
        } else {
          txIdsByDestinationDomain.set(xtransfer.destinationDomain as string, [`"${xtransfer.transferId as string}"`]);
        }
      }
    }

    if (txIdsByDestinationDomain.size == 0) return [];

    const destinationTransfersQuery = getDestinationTransfersByDomainAndIdsQuery(txIdsByDestinationDomain);
    response = await execute(destinationTransfersQuery);

    const transfers: any[] = [];
    for (const key of response.keys()) {
      const value = response.get(key);
      transfers.push(value?.flat());
    }

    const destinationTransfers: XTransfer[] = transfers
      .flat()
      .filter((x: any) => !!x)
      .map(parser.destinationTransfer);

    destinationTransfers.forEach((tx) => {
      allTxById.delete(tx.transferId);
    });

    // create array of all transactions by status
    return [...allTxById.values()];
  }

  /**
   * Gets all the destination transfers across all the chains
   * @param transfers - The xtransfers you're going to get the status for
   * @returns Executed/Reconciled xtransfers
   */
  public async getDestinationTransfers(transfers: OriginTransfer[]): Promise<XTransfer[]> {
    const { parser, execute } = getHelpers();
    if (transfers.length == 0) return [];
    const txIdsByDestinationDomain: Map<string, string[]> = new Map();
    const allOrigin: [string, XTransfer][] = transfers.map((transfer) => {
      const destinationDomainRecord = txIdsByDestinationDomain.get(transfer.xparams.destinationDomain);
      const txIds = destinationDomainRecord
        ? destinationDomainRecord.includes(transfer.transferId)
          ? destinationDomainRecord
          : destinationDomainRecord.concat(`"${transfer.transferId}"`)
        : [`"${transfer.transferId}"`];
      txIdsByDestinationDomain.set(transfer.xparams.destinationDomain, txIds);
      return [transfer.transferId, transfer];
    });

    const allTxById = new Map<string, XTransfer>(allOrigin);

    const destinationTransfersQuery = getDestinationTransfersByDomainAndIdsQuery(txIdsByDestinationDomain);
    const response = await execute(destinationTransfersQuery);
    const _transfers: any[] = [];
    for (const key of response.keys()) {
      const value = response.get(key);
      _transfers.push(value?.flat());
    }

    const destinationTransfers: XTransfer[] = _transfers
      .flat()
      .filter((x: any) => !!x)
      .map(parser.destinationTransfer);

    destinationTransfers.forEach((tx) => {
      const inMap = allTxById.get(tx.transferId)!;
      inMap.destination = tx.destination;
      allTxById.set(tx.transferId, inMap);
    });

    return [...allTxById.values()].filter((xTransfer) => !!xTransfer.destination);
  }
}
