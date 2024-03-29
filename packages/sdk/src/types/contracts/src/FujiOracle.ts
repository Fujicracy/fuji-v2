/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type {
  Fragment,
  FunctionFragment,
  Result,
  EventFragment,
} from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { Call } from "@hovoh/ethcall";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
} from "../common";

export interface FujiOracleInterface extends utils.Interface {
  functions: {
    "HARVESTER_ROLE()": FunctionFragment;
    "HOUSE_KEEPER_ROLE()": FunctionFragment;
    "LIQUIDATOR_ROLE()": FunctionFragment;
    "PAUSER_ROLE()": FunctionFragment;
    "REBALANCER_ROLE()": FunctionFragment;
    "UNPAUSER_ROLE()": FunctionFragment;
    "chief()": FunctionFragment;
    "getPriceOf(address,address,uint8)": FunctionFragment;
    "setPriceFeed(address,address)": FunctionFragment;
    "usdPriceFeeds(address)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "HARVESTER_ROLE"
      | "HOUSE_KEEPER_ROLE"
      | "LIQUIDATOR_ROLE"
      | "PAUSER_ROLE"
      | "REBALANCER_ROLE"
      | "UNPAUSER_ROLE"
      | "chief"
      | "getPriceOf"
      | "setPriceFeed"
      | "usdPriceFeeds"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "HARVESTER_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "HOUSE_KEEPER_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "LIQUIDATOR_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "PAUSER_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "REBALANCER_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "UNPAUSER_ROLE",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "chief", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "getPriceOf",
    values: [string, string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "setPriceFeed",
    values: [string, string]
  ): string;
  encodeFunctionData(
    functionFragment: "usdPriceFeeds",
    values: [string]
  ): string;

  decodeFunctionResult(
    functionFragment: "HARVESTER_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "HOUSE_KEEPER_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "LIQUIDATOR_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "PAUSER_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "REBALANCER_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "UNPAUSER_ROLE",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "chief", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getPriceOf", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "setPriceFeed",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "usdPriceFeeds",
    data: BytesLike
  ): Result;

  events: {
    "AssetPriceFeedChanged(address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "AssetPriceFeedChanged"): EventFragment;
}

export interface AssetPriceFeedChangedEventObject {
  asset: string;
  newPriceFeedAddress: string;
}
export type AssetPriceFeedChangedEvent = TypedEvent<
  [string, string],
  AssetPriceFeedChangedEventObject
>;

export type AssetPriceFeedChangedEventFilter =
  TypedEventFilter<AssetPriceFeedChangedEvent>;

export interface FujiOracle extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: FujiOracleInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    HARVESTER_ROLE(overrides?: CallOverrides): Promise<[string]>;

    HOUSE_KEEPER_ROLE(overrides?: CallOverrides): Promise<[string]>;

    LIQUIDATOR_ROLE(overrides?: CallOverrides): Promise<[string]>;

    PAUSER_ROLE(overrides?: CallOverrides): Promise<[string]>;

    REBALANCER_ROLE(overrides?: CallOverrides): Promise<[string]>;

    UNPAUSER_ROLE(overrides?: CallOverrides): Promise<[string]>;

    chief(overrides?: CallOverrides): Promise<[string]>;

    getPriceOf(
      currencyAsset: string,
      commodityAsset: string,
      decimals: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber] & { price: BigNumber }>;

    setPriceFeed(
      asset: string,
      priceFeed: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    usdPriceFeeds(arg0: string, overrides?: CallOverrides): Promise<[string]>;
  };

  HARVESTER_ROLE(overrides?: CallOverrides): Promise<string>;

  HOUSE_KEEPER_ROLE(overrides?: CallOverrides): Promise<string>;

  LIQUIDATOR_ROLE(overrides?: CallOverrides): Promise<string>;

  PAUSER_ROLE(overrides?: CallOverrides): Promise<string>;

  REBALANCER_ROLE(overrides?: CallOverrides): Promise<string>;

  UNPAUSER_ROLE(overrides?: CallOverrides): Promise<string>;

  chief(overrides?: CallOverrides): Promise<string>;

  getPriceOf(
    currencyAsset: string,
    commodityAsset: string,
    decimals: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  setPriceFeed(
    asset: string,
    priceFeed: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  usdPriceFeeds(arg0: string, overrides?: CallOverrides): Promise<string>;

  callStatic: {
    HARVESTER_ROLE(overrides?: CallOverrides): Promise<string>;

    HOUSE_KEEPER_ROLE(overrides?: CallOverrides): Promise<string>;

    LIQUIDATOR_ROLE(overrides?: CallOverrides): Promise<string>;

    PAUSER_ROLE(overrides?: CallOverrides): Promise<string>;

    REBALANCER_ROLE(overrides?: CallOverrides): Promise<string>;

    UNPAUSER_ROLE(overrides?: CallOverrides): Promise<string>;

    chief(overrides?: CallOverrides): Promise<string>;

    getPriceOf(
      currencyAsset: string,
      commodityAsset: string,
      decimals: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    setPriceFeed(
      asset: string,
      priceFeed: string,
      overrides?: CallOverrides
    ): Promise<void>;

    usdPriceFeeds(arg0: string, overrides?: CallOverrides): Promise<string>;
  };

  filters: {
    "AssetPriceFeedChanged(address,address)"(
      asset?: null,
      newPriceFeedAddress?: null
    ): AssetPriceFeedChangedEventFilter;
    AssetPriceFeedChanged(
      asset?: null,
      newPriceFeedAddress?: null
    ): AssetPriceFeedChangedEventFilter;
  };

  estimateGas: {
    HARVESTER_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    HOUSE_KEEPER_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    LIQUIDATOR_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    PAUSER_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    REBALANCER_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    UNPAUSER_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    chief(overrides?: CallOverrides): Promise<BigNumber>;

    getPriceOf(
      currencyAsset: string,
      commodityAsset: string,
      decimals: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    setPriceFeed(
      asset: string,
      priceFeed: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    usdPriceFeeds(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    HARVESTER_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    HOUSE_KEEPER_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    LIQUIDATOR_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    PAUSER_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    REBALANCER_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    UNPAUSER_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    chief(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getPriceOf(
      currencyAsset: string,
      commodityAsset: string,
      decimals: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    setPriceFeed(
      asset: string,
      priceFeed: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    usdPriceFeeds(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}

export interface FujiOracleMulticall {
  address: string;
  abi: Fragment[];
  functions: FunctionFragment[];

  HARVESTER_ROLE(overrides?: CallOverrides): Call<string>;

  HOUSE_KEEPER_ROLE(overrides?: CallOverrides): Call<string>;

  LIQUIDATOR_ROLE(overrides?: CallOverrides): Call<string>;

  PAUSER_ROLE(overrides?: CallOverrides): Call<string>;

  REBALANCER_ROLE(overrides?: CallOverrides): Call<string>;

  UNPAUSER_ROLE(overrides?: CallOverrides): Call<string>;

  chief(overrides?: CallOverrides): Call<string>;

  getPriceOf(
    currencyAsset: string,
    commodityAsset: string,
    decimals: BigNumberish,
    overrides?: CallOverrides
  ): Call<BigNumber>;

  usdPriceFeeds(arg0: string, overrides?: CallOverrides): Call<string>;
}
