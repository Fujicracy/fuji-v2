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
} from "../../common";

export declare namespace ConnextHandler {
  export type FailedTxnStruct = {
    transferId: BytesLike;
    amount: BigNumberish;
    asset: string;
    originSender: string;
    originDomain: BigNumberish;
    actions: BigNumberish[];
    args: BytesLike[];
    nonce: BigNumberish;
    executed: boolean;
  };

  export type FailedTxnStructOutput = [
    string,
    BigNumber,
    string,
    string,
    number,
    number[],
    string[],
    BigNumber,
    boolean
  ] & {
    transferId: string;
    amount: BigNumber;
    asset: string;
    originSender: string;
    originDomain: number;
    actions: number[];
    args: string[];
    nonce: BigNumber;
    executed: boolean;
  };
}

export interface ConnextHandlerInterface extends utils.Interface {
  functions: {
    "connextRouter()": FunctionFragment;
    "executeFailedWithUpdatedArgs(bytes32,uint256,uint8[],bytes[])": FunctionFragment;
    "getFailedTxn(bytes32,uint256)": FunctionFragment;
    "getFailedTxnNextNonce(bytes32)": FunctionFragment;
    "recordFailed(bytes32,uint256,address,address,uint32,uint8[],bytes[])": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "connextRouter"
      | "executeFailedWithUpdatedArgs"
      | "getFailedTxn"
      | "getFailedTxnNextNonce"
      | "recordFailed"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "connextRouter",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "executeFailedWithUpdatedArgs",
    values: [BytesLike, BigNumberish, BigNumberish[], BytesLike[]]
  ): string;
  encodeFunctionData(
    functionFragment: "getFailedTxn",
    values: [BytesLike, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "getFailedTxnNextNonce",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "recordFailed",
    values: [
      BytesLike,
      BigNumberish,
      string,
      string,
      BigNumberish,
      BigNumberish[],
      BytesLike[]
    ]
  ): string;

  decodeFunctionResult(
    functionFragment: "connextRouter",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "executeFailedWithUpdatedArgs",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getFailedTxn",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getFailedTxnNextNonce",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "recordFailed",
    data: BytesLike
  ): Result;

  events: {
    "FailedTxnExecuted(bytes32,uint8[],uint8[],bytes[],bytes[],uint256,bool)": EventFragment;
    "FailedTxnRecorded(bytes32,uint256,address,address,uint32,uint8[],bytes[],uint256)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "FailedTxnExecuted"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "FailedTxnRecorded"): EventFragment;
}

export interface FailedTxnExecutedEventObject {
  transferId: string;
  oldActions: number[];
  newActions: number[];
  oldArgs: string[];
  newArgs: string[];
  nonce: BigNumber;
  success: boolean;
}
export type FailedTxnExecutedEvent = TypedEvent<
  [string, number[], number[], string[], string[], BigNumber, boolean],
  FailedTxnExecutedEventObject
>;

export type FailedTxnExecutedEventFilter =
  TypedEventFilter<FailedTxnExecutedEvent>;

export interface FailedTxnRecordedEventObject {
  transferId: string;
  amount: BigNumber;
  asset: string;
  originSender: string;
  originDomain: number;
  actions: number[];
  args: string[];
  nonce: BigNumber;
}
export type FailedTxnRecordedEvent = TypedEvent<
  [string, BigNumber, string, string, number, number[], string[], BigNumber],
  FailedTxnRecordedEventObject
>;

export type FailedTxnRecordedEventFilter =
  TypedEventFilter<FailedTxnRecordedEvent>;

export interface ConnextHandler extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: ConnextHandlerInterface;

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
    connextRouter(overrides?: CallOverrides): Promise<[string]>;

    executeFailedWithUpdatedArgs(
      transferId: BytesLike,
      nonce: BigNumberish,
      actions: BigNumberish[],
      args: BytesLike[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    getFailedTxn(
      transferId: BytesLike,
      nonce: BigNumberish,
      overrides?: CallOverrides
    ): Promise<[ConnextHandler.FailedTxnStructOutput]>;

    getFailedTxnNextNonce(
      transferId: BytesLike,
      overrides?: CallOverrides
    ): Promise<[BigNumber] & { next: BigNumber }>;

    recordFailed(
      transferId: BytesLike,
      amount: BigNumberish,
      asset: string,
      originSender: string,
      originDomain: BigNumberish,
      actions: BigNumberish[],
      args: BytesLike[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  connextRouter(overrides?: CallOverrides): Promise<string>;

  executeFailedWithUpdatedArgs(
    transferId: BytesLike,
    nonce: BigNumberish,
    actions: BigNumberish[],
    args: BytesLike[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  getFailedTxn(
    transferId: BytesLike,
    nonce: BigNumberish,
    overrides?: CallOverrides
  ): Promise<ConnextHandler.FailedTxnStructOutput>;

  getFailedTxnNextNonce(
    transferId: BytesLike,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  recordFailed(
    transferId: BytesLike,
    amount: BigNumberish,
    asset: string,
    originSender: string,
    originDomain: BigNumberish,
    actions: BigNumberish[],
    args: BytesLike[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    connextRouter(overrides?: CallOverrides): Promise<string>;

    executeFailedWithUpdatedArgs(
      transferId: BytesLike,
      nonce: BigNumberish,
      actions: BigNumberish[],
      args: BytesLike[],
      overrides?: CallOverrides
    ): Promise<void>;

    getFailedTxn(
      transferId: BytesLike,
      nonce: BigNumberish,
      overrides?: CallOverrides
    ): Promise<ConnextHandler.FailedTxnStructOutput>;

    getFailedTxnNextNonce(
      transferId: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    recordFailed(
      transferId: BytesLike,
      amount: BigNumberish,
      asset: string,
      originSender: string,
      originDomain: BigNumberish,
      actions: BigNumberish[],
      args: BytesLike[],
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "FailedTxnExecuted(bytes32,uint8[],uint8[],bytes[],bytes[],uint256,bool)"(
      transferId?: BytesLike | null,
      oldActions?: null,
      newActions?: null,
      oldArgs?: null,
      newArgs?: null,
      nonce?: null,
      success?: boolean | null
    ): FailedTxnExecutedEventFilter;
    FailedTxnExecuted(
      transferId?: BytesLike | null,
      oldActions?: null,
      newActions?: null,
      oldArgs?: null,
      newArgs?: null,
      nonce?: null,
      success?: boolean | null
    ): FailedTxnExecutedEventFilter;

    "FailedTxnRecorded(bytes32,uint256,address,address,uint32,uint8[],bytes[],uint256)"(
      transferId?: BytesLike | null,
      amount?: null,
      asset?: null,
      originSender?: null,
      originDomain?: null,
      actions?: null,
      args?: null,
      nonce?: null
    ): FailedTxnRecordedEventFilter;
    FailedTxnRecorded(
      transferId?: BytesLike | null,
      amount?: null,
      asset?: null,
      originSender?: null,
      originDomain?: null,
      actions?: null,
      args?: null,
      nonce?: null
    ): FailedTxnRecordedEventFilter;
  };

  estimateGas: {
    connextRouter(overrides?: CallOverrides): Promise<BigNumber>;

    executeFailedWithUpdatedArgs(
      transferId: BytesLike,
      nonce: BigNumberish,
      actions: BigNumberish[],
      args: BytesLike[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    getFailedTxn(
      transferId: BytesLike,
      nonce: BigNumberish,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getFailedTxnNextNonce(
      transferId: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    recordFailed(
      transferId: BytesLike,
      amount: BigNumberish,
      asset: string,
      originSender: string,
      originDomain: BigNumberish,
      actions: BigNumberish[],
      args: BytesLike[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    connextRouter(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    executeFailedWithUpdatedArgs(
      transferId: BytesLike,
      nonce: BigNumberish,
      actions: BigNumberish[],
      args: BytesLike[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    getFailedTxn(
      transferId: BytesLike,
      nonce: BigNumberish,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getFailedTxnNextNonce(
      transferId: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    recordFailed(
      transferId: BytesLike,
      amount: BigNumberish,
      asset: string,
      originSender: string,
      originDomain: BigNumberish,
      actions: BigNumberish[],
      args: BytesLike[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}

export interface ConnextHandlerMulticall {
  address: string;
  abi: Fragment[];
  functions: FunctionFragment[];

  connextRouter(overrides?: CallOverrides): Call<string>;

  getFailedTxn(
    transferId: BytesLike,
    nonce: BigNumberish,
    overrides?: CallOverrides
  ): Call<ConnextHandler.FailedTxnStructOutput>;

  getFailedTxnNextNonce(
    transferId: BytesLike,
    overrides?: CallOverrides
  ): Call<BigNumber>;
}
