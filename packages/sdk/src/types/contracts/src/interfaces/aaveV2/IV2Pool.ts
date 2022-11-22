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
} from "../../../common";

export declare namespace IV2Pool {
  export type ReserveConfigurationMapStruct = { data: BigNumberish };

  export type ReserveConfigurationMapStructOutput = [BigNumber] & {
    data: BigNumber;
  };

  export type ReserveDataStruct = {
    configuration: IV2Pool.ReserveConfigurationMapStruct;
    liquidityIndex: BigNumberish;
    variableBorrowIndex: BigNumberish;
    currentLiquidityRate: BigNumberish;
    currentVariableBorrowRate: BigNumberish;
    currentStableBorrowRate: BigNumberish;
    lastUpdateTimestamp: BigNumberish;
    aTokenAddress: string;
    stableDebtTokenAddress: string;
    variableDebtTokenAddress: string;
    interestRateStrategyAddress: string;
    id: BigNumberish;
  };

  export type ReserveDataStructOutput = [
    IV2Pool.ReserveConfigurationMapStructOutput,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    number,
    string,
    string,
    string,
    string,
    number
  ] & {
    configuration: IV2Pool.ReserveConfigurationMapStructOutput;
    liquidityIndex: BigNumber;
    variableBorrowIndex: BigNumber;
    currentLiquidityRate: BigNumber;
    currentVariableBorrowRate: BigNumber;
    currentStableBorrowRate: BigNumber;
    lastUpdateTimestamp: number;
    aTokenAddress: string;
    stableDebtTokenAddress: string;
    variableDebtTokenAddress: string;
    interestRateStrategyAddress: string;
    id: number;
  };
}

export interface IV2PoolInterface extends utils.Interface {
  functions: {
    "FLASHLOAN_PREMIUM_TOTAL()": FunctionFragment;
    "borrow(address,uint256,uint256,uint16,address)": FunctionFragment;
    "deposit(address,uint256,address,uint16)": FunctionFragment;
    "flashLoan(address,address[],uint256[],uint256[],address,bytes,uint16)": FunctionFragment;
    "getReserveData(address)": FunctionFragment;
    "repay(address,uint256,uint256,address)": FunctionFragment;
    "setUserUseReserveAsCollateral(address,bool)": FunctionFragment;
    "withdraw(address,uint256,address)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "FLASHLOAN_PREMIUM_TOTAL"
      | "borrow"
      | "deposit"
      | "flashLoan"
      | "getReserveData"
      | "repay"
      | "setUserUseReserveAsCollateral"
      | "withdraw"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "FLASHLOAN_PREMIUM_TOTAL",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "borrow",
    values: [string, BigNumberish, BigNumberish, BigNumberish, string]
  ): string;
  encodeFunctionData(
    functionFragment: "deposit",
    values: [string, BigNumberish, string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "flashLoan",
    values: [
      string,
      string[],
      BigNumberish[],
      BigNumberish[],
      string,
      BytesLike,
      BigNumberish
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "getReserveData",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "repay",
    values: [string, BigNumberish, BigNumberish, string]
  ): string;
  encodeFunctionData(
    functionFragment: "setUserUseReserveAsCollateral",
    values: [string, boolean]
  ): string;
  encodeFunctionData(
    functionFragment: "withdraw",
    values: [string, BigNumberish, string]
  ): string;

  decodeFunctionResult(
    functionFragment: "FLASHLOAN_PREMIUM_TOTAL",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "borrow", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "deposit", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "flashLoan", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "getReserveData",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "repay", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "setUserUseReserveAsCollateral",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "withdraw", data: BytesLike): Result;

  events: {};
}

export interface IV2Pool extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: IV2PoolInterface;

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
    FLASHLOAN_PREMIUM_TOTAL(overrides?: CallOverrides): Promise<[BigNumber]>;

    borrow(
      _asset: string,
      _amount: BigNumberish,
      _interestRateMode: BigNumberish,
      _referralCode: BigNumberish,
      _onBehalfOf: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    deposit(
      _asset: string,
      _amount: BigNumberish,
      _onBehalfOf: string,
      _referralCode: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    flashLoan(
      receiverAddress: string,
      assets: string[],
      amounts: BigNumberish[],
      modes: BigNumberish[],
      onBehalfOf: string,
      params: BytesLike,
      referralCode: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    getReserveData(
      asset: string,
      overrides?: CallOverrides
    ): Promise<[IV2Pool.ReserveDataStructOutput]>;

    repay(
      _asset: string,
      _amount: BigNumberish,
      _rateMode: BigNumberish,
      _onBehalfOf: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setUserUseReserveAsCollateral(
      _asset: string,
      _useAsCollateral: boolean,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    withdraw(
      _asset: string,
      _amount: BigNumberish,
      _to: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  FLASHLOAN_PREMIUM_TOTAL(overrides?: CallOverrides): Promise<BigNumber>;

  borrow(
    _asset: string,
    _amount: BigNumberish,
    _interestRateMode: BigNumberish,
    _referralCode: BigNumberish,
    _onBehalfOf: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  deposit(
    _asset: string,
    _amount: BigNumberish,
    _onBehalfOf: string,
    _referralCode: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  flashLoan(
    receiverAddress: string,
    assets: string[],
    amounts: BigNumberish[],
    modes: BigNumberish[],
    onBehalfOf: string,
    params: BytesLike,
    referralCode: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  getReserveData(
    asset: string,
    overrides?: CallOverrides
  ): Promise<IV2Pool.ReserveDataStructOutput>;

  repay(
    _asset: string,
    _amount: BigNumberish,
    _rateMode: BigNumberish,
    _onBehalfOf: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setUserUseReserveAsCollateral(
    _asset: string,
    _useAsCollateral: boolean,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  withdraw(
    _asset: string,
    _amount: BigNumberish,
    _to: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    FLASHLOAN_PREMIUM_TOTAL(overrides?: CallOverrides): Promise<BigNumber>;

    borrow(
      _asset: string,
      _amount: BigNumberish,
      _interestRateMode: BigNumberish,
      _referralCode: BigNumberish,
      _onBehalfOf: string,
      overrides?: CallOverrides
    ): Promise<void>;

    deposit(
      _asset: string,
      _amount: BigNumberish,
      _onBehalfOf: string,
      _referralCode: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    flashLoan(
      receiverAddress: string,
      assets: string[],
      amounts: BigNumberish[],
      modes: BigNumberish[],
      onBehalfOf: string,
      params: BytesLike,
      referralCode: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    getReserveData(
      asset: string,
      overrides?: CallOverrides
    ): Promise<IV2Pool.ReserveDataStructOutput>;

    repay(
      _asset: string,
      _amount: BigNumberish,
      _rateMode: BigNumberish,
      _onBehalfOf: string,
      overrides?: CallOverrides
    ): Promise<void>;

    setUserUseReserveAsCollateral(
      _asset: string,
      _useAsCollateral: boolean,
      overrides?: CallOverrides
    ): Promise<void>;

    withdraw(
      _asset: string,
      _amount: BigNumberish,
      _to: string,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {};

  estimateGas: {
    FLASHLOAN_PREMIUM_TOTAL(overrides?: CallOverrides): Promise<BigNumber>;

    borrow(
      _asset: string,
      _amount: BigNumberish,
      _interestRateMode: BigNumberish,
      _referralCode: BigNumberish,
      _onBehalfOf: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    deposit(
      _asset: string,
      _amount: BigNumberish,
      _onBehalfOf: string,
      _referralCode: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    flashLoan(
      receiverAddress: string,
      assets: string[],
      amounts: BigNumberish[],
      modes: BigNumberish[],
      onBehalfOf: string,
      params: BytesLike,
      referralCode: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    getReserveData(
      asset: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    repay(
      _asset: string,
      _amount: BigNumberish,
      _rateMode: BigNumberish,
      _onBehalfOf: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setUserUseReserveAsCollateral(
      _asset: string,
      _useAsCollateral: boolean,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    withdraw(
      _asset: string,
      _amount: BigNumberish,
      _to: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    FLASHLOAN_PREMIUM_TOTAL(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    borrow(
      _asset: string,
      _amount: BigNumberish,
      _interestRateMode: BigNumberish,
      _referralCode: BigNumberish,
      _onBehalfOf: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    deposit(
      _asset: string,
      _amount: BigNumberish,
      _onBehalfOf: string,
      _referralCode: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    flashLoan(
      receiverAddress: string,
      assets: string[],
      amounts: BigNumberish[],
      modes: BigNumberish[],
      onBehalfOf: string,
      params: BytesLike,
      referralCode: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    getReserveData(
      asset: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    repay(
      _asset: string,
      _amount: BigNumberish,
      _rateMode: BigNumberish,
      _onBehalfOf: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setUserUseReserveAsCollateral(
      _asset: string,
      _useAsCollateral: boolean,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    withdraw(
      _asset: string,
      _amount: BigNumberish,
      _to: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}

export interface IV2PoolMulticall {
  address: string;
  abi: Fragment[];
  functions: FunctionFragment[];

  FLASHLOAN_PREMIUM_TOTAL(overrides?: CallOverrides): Call<BigNumber>;

  getReserveData(
    asset: string,
    overrides?: CallOverrides
  ): Call<IV2Pool.ReserveDataStructOutput>;
}
