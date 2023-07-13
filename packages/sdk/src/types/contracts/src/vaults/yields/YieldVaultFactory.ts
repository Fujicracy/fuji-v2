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
} from "../../../common";

export interface YieldVaultFactoryInterface extends utils.Interface {
  functions: {
    "allVaults(uint256)": FunctionFragment;
    "chief()": FunctionFragment;
    "configAddress(bytes32)": FunctionFragment;
    "deployVault(bytes)": FunctionFragment;
    "getVaults(address,uint256,uint256)": FunctionFragment;
    "nonce()": FunctionFragment;
    "vaultsByAsset(address,uint256)": FunctionFragment;
    "vaultsCount(address)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "allVaults"
      | "chief"
      | "configAddress"
      | "deployVault"
      | "getVaults"
      | "nonce"
      | "vaultsByAsset"
      | "vaultsCount"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "allVaults",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "chief", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "configAddress",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "deployVault",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getVaults",
    values: [string, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "nonce", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "vaultsByAsset",
    values: [string, BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "vaultsCount", values: [string]): string;

  decodeFunctionResult(functionFragment: "allVaults", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "chief", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "configAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "deployVault",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "getVaults", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "nonce", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "vaultsByAsset",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "vaultsCount",
    data: BytesLike
  ): Result;

  events: {
    "VaultRegistered(address,address,bytes32)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "VaultRegistered"): EventFragment;
}

export interface VaultRegisteredEventObject {
  vault: string;
  asset: string;
  salt: string;
}
export type VaultRegisteredEvent = TypedEvent<
  [string, string, string],
  VaultRegisteredEventObject
>;

export type VaultRegisteredEventFilter = TypedEventFilter<VaultRegisteredEvent>;

export interface YieldVaultFactory extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: YieldVaultFactoryInterface;

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
    allVaults(arg0: BigNumberish, overrides?: CallOverrides): Promise<[string]>;

    chief(overrides?: CallOverrides): Promise<[string]>;

    configAddress(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<[string]>;

    deployVault(
      deployData: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    getVaults(
      asset: string,
      startIndex: BigNumberish,
      count: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[string[]] & { vaults: string[] }>;

    nonce(overrides?: CallOverrides): Promise<[BigNumber]>;

    vaultsByAsset(
      arg0: string,
      arg1: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[string]>;

    vaultsCount(
      asset: string,
      overrides?: CallOverrides
    ): Promise<[BigNumber] & { count: BigNumber }>;
  };

  allVaults(arg0: BigNumberish, overrides?: CallOverrides): Promise<string>;

  chief(overrides?: CallOverrides): Promise<string>;

  configAddress(arg0: BytesLike, overrides?: CallOverrides): Promise<string>;

  deployVault(
    deployData: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  getVaults(
    asset: string,
    startIndex: BigNumberish,
    count: BigNumberish,
    overrides?: CallOverrides
  ): Promise<string[]>;

  nonce(overrides?: CallOverrides): Promise<BigNumber>;

  vaultsByAsset(
    arg0: string,
    arg1: BigNumberish,
    overrides?: CallOverrides
  ): Promise<string>;

  vaultsCount(asset: string, overrides?: CallOverrides): Promise<BigNumber>;

  callStatic: {
    allVaults(arg0: BigNumberish, overrides?: CallOverrides): Promise<string>;

    chief(overrides?: CallOverrides): Promise<string>;

    configAddress(arg0: BytesLike, overrides?: CallOverrides): Promise<string>;

    deployVault(
      deployData: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    getVaults(
      asset: string,
      startIndex: BigNumberish,
      count: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string[]>;

    nonce(overrides?: CallOverrides): Promise<BigNumber>;

    vaultsByAsset(
      arg0: string,
      arg1: BigNumberish,
      overrides?: CallOverrides
    ): Promise<string>;

    vaultsCount(asset: string, overrides?: CallOverrides): Promise<BigNumber>;
  };

  filters: {
    "VaultRegistered(address,address,bytes32)"(
      vault?: null,
      asset?: null,
      salt?: null
    ): VaultRegisteredEventFilter;
    VaultRegistered(
      vault?: null,
      asset?: null,
      salt?: null
    ): VaultRegisteredEventFilter;
  };

  estimateGas: {
    allVaults(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    chief(overrides?: CallOverrides): Promise<BigNumber>;

    configAddress(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    deployVault(
      deployData: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    getVaults(
      asset: string,
      startIndex: BigNumberish,
      count: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    nonce(overrides?: CallOverrides): Promise<BigNumber>;

    vaultsByAsset(
      arg0: string,
      arg1: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    vaultsCount(asset: string, overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    allVaults(
      arg0: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    chief(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    configAddress(
      arg0: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    deployVault(
      deployData: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    getVaults(
      asset: string,
      startIndex: BigNumberish,
      count: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    nonce(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    vaultsByAsset(
      arg0: string,
      arg1: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    vaultsCount(
      asset: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}

export interface YieldVaultFactoryMulticall {
  address: string;
  abi: Fragment[];
  functions: FunctionFragment[];

  allVaults(arg0: BigNumberish, overrides?: CallOverrides): Call<string>;

  chief(overrides?: CallOverrides): Call<string>;

  configAddress(arg0: BytesLike, overrides?: CallOverrides): Call<string>;

  getVaults(
    asset: string,
    startIndex: BigNumberish,
    count: BigNumberish,
    overrides?: CallOverrides
  ): Call<string[]>;

  nonce(overrides?: CallOverrides): Call<BigNumber>;

  vaultsByAsset(
    arg0: string,
    arg1: BigNumberish,
    overrides?: CallOverrides
  ): Call<string>;

  vaultsCount(asset: string, overrides?: CallOverrides): Call<BigNumber>;
}