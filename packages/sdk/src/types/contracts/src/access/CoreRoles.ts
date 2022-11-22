/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BytesLike,
  CallOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type { Fragment, FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { Call } from "@hovoh/ethcall";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
} from "../../common";

export interface CoreRolesInterface extends utils.Interface {
  functions: {
    "HARVESTER_ROLE()": FunctionFragment;
    "HOUSE_KEEPER_ROLE()": FunctionFragment;
    "LIQUIDATOR_ROLE()": FunctionFragment;
    "PAUSER_ROLE()": FunctionFragment;
    "REBALANCER_ROLE()": FunctionFragment;
    "UNPAUSER_ROLE()": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "HARVESTER_ROLE"
      | "HOUSE_KEEPER_ROLE"
      | "LIQUIDATOR_ROLE"
      | "PAUSER_ROLE"
      | "REBALANCER_ROLE"
      | "UNPAUSER_ROLE"
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

  events: {};
}

export interface CoreRoles extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: CoreRolesInterface;

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
  };

  HARVESTER_ROLE(overrides?: CallOverrides): Promise<string>;

  HOUSE_KEEPER_ROLE(overrides?: CallOverrides): Promise<string>;

  LIQUIDATOR_ROLE(overrides?: CallOverrides): Promise<string>;

  PAUSER_ROLE(overrides?: CallOverrides): Promise<string>;

  REBALANCER_ROLE(overrides?: CallOverrides): Promise<string>;

  UNPAUSER_ROLE(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    HARVESTER_ROLE(overrides?: CallOverrides): Promise<string>;

    HOUSE_KEEPER_ROLE(overrides?: CallOverrides): Promise<string>;

    LIQUIDATOR_ROLE(overrides?: CallOverrides): Promise<string>;

    PAUSER_ROLE(overrides?: CallOverrides): Promise<string>;

    REBALANCER_ROLE(overrides?: CallOverrides): Promise<string>;

    UNPAUSER_ROLE(overrides?: CallOverrides): Promise<string>;
  };

  filters: {};

  estimateGas: {
    HARVESTER_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    HOUSE_KEEPER_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    LIQUIDATOR_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    PAUSER_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    REBALANCER_ROLE(overrides?: CallOverrides): Promise<BigNumber>;

    UNPAUSER_ROLE(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    HARVESTER_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    HOUSE_KEEPER_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    LIQUIDATOR_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    PAUSER_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    REBALANCER_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    UNPAUSER_ROLE(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}

export interface CoreRolesMulticall {
  address: string;
  abi: Fragment[];
  functions: FunctionFragment[];

  HARVESTER_ROLE(overrides?: CallOverrides): Call<string>;

  HOUSE_KEEPER_ROLE(overrides?: CallOverrides): Call<string>;

  LIQUIDATOR_ROLE(overrides?: CallOverrides): Call<string>;

  PAUSER_ROLE(overrides?: CallOverrides): Call<string>;

  REBALANCER_ROLE(overrides?: CallOverrides): Call<string>;

  UNPAUSER_ROLE(overrides?: CallOverrides): Call<string>;
}
