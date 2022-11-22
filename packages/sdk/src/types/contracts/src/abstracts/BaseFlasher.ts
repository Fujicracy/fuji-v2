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
import type { Fragment, FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type { Call } from "@hovoh/ethcall";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
} from "../../common";

export interface BaseFlasherInterface extends utils.Interface {
  functions: {
    "computeFlashloanFee(address,uint256)": FunctionFragment;
    "flasherProviderName()": FunctionFragment;
    "getFlashloanSourceAddr(address)": FunctionFragment;
    "initiateFlashloan(address,uint256,address,bytes)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "computeFlashloanFee"
      | "flasherProviderName"
      | "getFlashloanSourceAddr"
      | "initiateFlashloan"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "computeFlashloanFee",
    values: [string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "flasherProviderName",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getFlashloanSourceAddr",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "initiateFlashloan",
    values: [string, BigNumberish, string, BytesLike]
  ): string;

  decodeFunctionResult(
    functionFragment: "computeFlashloanFee",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "flasherProviderName",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getFlashloanSourceAddr",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "initiateFlashloan",
    data: BytesLike
  ): Result;

  events: {};
}

export interface BaseFlasher extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: BaseFlasherInterface;

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
    computeFlashloanFee(
      asset: string,
      amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[BigNumber] & { fee: BigNumber }>;

    flasherProviderName(overrides?: CallOverrides): Promise<[string]>;

    getFlashloanSourceAddr(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<[string]>;

    initiateFlashloan(
      asset: string,
      amount: BigNumberish,
      requestor: string,
      requestorCall: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  computeFlashloanFee(
    asset: string,
    amount: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  flasherProviderName(overrides?: CallOverrides): Promise<string>;

  getFlashloanSourceAddr(
    arg0: string,
    overrides?: CallOverrides
  ): Promise<string>;

  initiateFlashloan(
    asset: string,
    amount: BigNumberish,
    requestor: string,
    requestorCall: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    computeFlashloanFee(
      asset: string,
      amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    flasherProviderName(overrides?: CallOverrides): Promise<string>;

    getFlashloanSourceAddr(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<string>;

    initiateFlashloan(
      asset: string,
      amount: BigNumberish,
      requestor: string,
      requestorCall: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {};

  estimateGas: {
    computeFlashloanFee(
      asset: string,
      amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    flasherProviderName(overrides?: CallOverrides): Promise<BigNumber>;

    getFlashloanSourceAddr(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    initiateFlashloan(
      asset: string,
      amount: BigNumberish,
      requestor: string,
      requestorCall: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    computeFlashloanFee(
      asset: string,
      amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    flasherProviderName(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getFlashloanSourceAddr(
      arg0: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    initiateFlashloan(
      asset: string,
      amount: BigNumberish,
      requestor: string,
      requestorCall: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}

export interface BaseFlasherMulticall {
  address: string;
  abi: Fragment[];
  functions: FunctionFragment[];

  computeFlashloanFee(
    asset: string,
    amount: BigNumberish,
    overrides?: CallOverrides
  ): Call<BigNumber>;

  flasherProviderName(overrides?: CallOverrides): Call<string>;

  getFlashloanSourceAddr(arg0: string, overrides?: CallOverrides): Call<string>;
}
