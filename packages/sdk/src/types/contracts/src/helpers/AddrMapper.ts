/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
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
} from "../../common";

export interface AddrMapperInterface extends utils.Interface {
  functions: {
    "HARVESTER_ROLE()": FunctionFragment;
    "HOUSE_KEEPER_ROLE()": FunctionFragment;
    "LIQUIDATOR_ROLE()": FunctionFragment;
    "PAUSER_ROLE()": FunctionFragment;
    "REBALANCER_ROLE()": FunctionFragment;
    "UNPAUSER_ROLE()": FunctionFragment;
    "chief()": FunctionFragment;
    "getAddressMapping(string,address)": FunctionFragment;
    "getAddressNestedMapping(string,address,address)": FunctionFragment;
    "getProviders()": FunctionFragment;
    "setMapping(string,address,address)": FunctionFragment;
    "setNestedMapping(string,address,address,address)": FunctionFragment;
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
      | "getAddressMapping"
      | "getAddressNestedMapping"
      | "getProviders"
      | "setMapping"
      | "setNestedMapping"
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
    functionFragment: "getAddressMapping",
    values: [string, string]
  ): string;
  encodeFunctionData(
    functionFragment: "getAddressNestedMapping",
    values: [string, string, string]
  ): string;
  encodeFunctionData(
    functionFragment: "getProviders",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "setMapping",
    values: [string, string, string]
  ): string;
  encodeFunctionData(
    functionFragment: "setNestedMapping",
    values: [string, string, string, string]
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
  decodeFunctionResult(
    functionFragment: "getAddressMapping",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getAddressNestedMapping",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getProviders",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "setMapping", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "setNestedMapping",
    data: BytesLike
  ): Result;

  events: {
    "MappingChanged(address[],address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "MappingChanged"): EventFragment;
}

export interface MappingChangedEventObject {
  keyAddress: string[];
  mappedAddress: string;
}
export type MappingChangedEvent = TypedEvent<
  [string[], string],
  MappingChangedEventObject
>;

export type MappingChangedEventFilter = TypedEventFilter<MappingChangedEvent>;

export interface AddrMapper extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: AddrMapperInterface;

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

    getAddressMapping(
      providerName: string,
      inputAddr: string,
      overrides?: CallOverrides
    ): Promise<[string]>;

    getAddressNestedMapping(
      providerName: string,
      inputAddr1: string,
      inputAddr2: string,
      overrides?: CallOverrides
    ): Promise<[string]>;

    getProviders(overrides?: CallOverrides): Promise<[string[]]>;

    setMapping(
      providerName: string,
      keyAddr: string,
      returnedAddr: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setNestedMapping(
      providerName: string,
      keyAddr1: string,
      keyAddr2: string,
      returnedAddr: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  HARVESTER_ROLE(overrides?: CallOverrides): Promise<string>;

  HOUSE_KEEPER_ROLE(overrides?: CallOverrides): Promise<string>;

  LIQUIDATOR_ROLE(overrides?: CallOverrides): Promise<string>;

  PAUSER_ROLE(overrides?: CallOverrides): Promise<string>;

  REBALANCER_ROLE(overrides?: CallOverrides): Promise<string>;

  UNPAUSER_ROLE(overrides?: CallOverrides): Promise<string>;

  chief(overrides?: CallOverrides): Promise<string>;

  getAddressMapping(
    providerName: string,
    inputAddr: string,
    overrides?: CallOverrides
  ): Promise<string>;

  getAddressNestedMapping(
    providerName: string,
    inputAddr1: string,
    inputAddr2: string,
    overrides?: CallOverrides
  ): Promise<string>;

  getProviders(overrides?: CallOverrides): Promise<string[]>;

  setMapping(
    providerName: string,
    keyAddr: string,
    returnedAddr: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setNestedMapping(
    providerName: string,
    keyAddr1: string,
    keyAddr2: string,
    returnedAddr: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    HARVESTER_ROLE(overrides?: CallOverrides): Promise<string>;

    HOUSE_KEEPER_ROLE(overrides?: CallOverrides): Promise<string>;

    LIQUIDATOR_ROLE(overrides?: CallOverrides): Promise<string>;

    PAUSER_ROLE(overrides?: CallOverrides): Promise<string>;

    REBALANCER_ROLE(overrides?: CallOverrides): Promise<string>;

    UNPAUSER_ROLE(overrides?: CallOverrides): Promise<string>;

    chief(overrides?: CallOverrides): Promise<string>;

    getAddressMapping(
      providerName: string,
      inputAddr: string,
      overrides?: CallOverrides
    ): Promise<string>;

    getAddressNestedMapping(
      providerName: string,
      inputAddr1: string,
      inputAddr2: string,
      overrides?: CallOverrides
    ): Promise<string>;

    getProviders(overrides?: CallOverrides): Promise<string[]>;

    setMapping(
      providerName: string,
      keyAddr: string,
      returnedAddr: string,
      overrides?: CallOverrides
    ): Promise<void>;

    setNestedMapping(
      providerName: string,
      keyAddr1: string,
      keyAddr2: string,
      returnedAddr: string,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "MappingChanged(address[],address)"(
      keyAddress?: null,
      mappedAddress?: null
    ): MappingChangedEventFilter;
    MappingChanged(
      keyAddress?: null,
      mappedAddress?: null
    ): MappingChangedEventFilter;
  };

  estimateGas: {
    HARVESTER_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    HOUSE_KEEPER_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    LIQUIDATOR_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    PAUSER_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    REBALANCER_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    UNPAUSER_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    chief(overrides?: CallOverrides): Promise<BigNumber>;

    getAddressMapping(
      providerName: string,
      inputAddr: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getAddressNestedMapping(
      providerName: string,
      inputAddr1: string,
      inputAddr2: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getProviders(overrides?: CallOverrides): Promise<BigNumber>;

    setMapping(
      providerName: string,
      keyAddr: string,
      returnedAddr: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setNestedMapping(
      providerName: string,
      keyAddr1: string,
      keyAddr2: string,
      returnedAddr: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    HARVESTER_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    HOUSE_KEEPER_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    LIQUIDATOR_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    PAUSER_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    REBALANCER_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    UNPAUSER_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    chief(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getAddressMapping(
      providerName: string,
      inputAddr: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getAddressNestedMapping(
      providerName: string,
      inputAddr1: string,
      inputAddr2: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getProviders(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    setMapping(
      providerName: string,
      keyAddr: string,
      returnedAddr: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setNestedMapping(
      providerName: string,
      keyAddr1: string,
      keyAddr2: string,
      returnedAddr: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}

export interface AddrMapperMulticall {
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

  getAddressMapping(
    providerName: string,
    inputAddr: string,
    overrides?: CallOverrides
  ): Call<string>;

  getAddressNestedMapping(
    providerName: string,
    inputAddr1: string,
    inputAddr2: string,
    overrides?: CallOverrides
  ): Call<string>;

  getProviders(overrides?: CallOverrides): Call<string[]>;
}
