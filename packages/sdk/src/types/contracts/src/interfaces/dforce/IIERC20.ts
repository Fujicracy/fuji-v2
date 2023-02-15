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

export interface IIERC20Interface extends utils.Interface {
  functions: {
    "accrualBlockNumber()": FunctionFragment;
    "allowance(address,address)": FunctionFragment;
    "approve(address,uint256)": FunctionFragment;
    "balanceOf(address)": FunctionFragment;
    "borrow(uint256)": FunctionFragment;
    "borrowBalanceCurrent(address)": FunctionFragment;
    "borrowBalanceStored(address)": FunctionFragment;
    "borrowIndex()": FunctionFragment;
    "borrowRatePerBlock()": FunctionFragment;
    "exchangeRateStored()": FunctionFragment;
    "getCash()": FunctionFragment;
    "mint(address,uint256)": FunctionFragment;
    "mintForSelfAndEnterMarket(uint256)": FunctionFragment;
    "redeem(address,uint256)": FunctionFragment;
    "redeemUnderlying(address,uint256)": FunctionFragment;
    "repayBorrow(uint256)": FunctionFragment;
    "repayBorrowBehalf(address,uint256)": FunctionFragment;
    "reserveRatio()": FunctionFragment;
    "supplyRatePerBlock()": FunctionFragment;
    "totalBorrows()": FunctionFragment;
    "totalReserves()": FunctionFragment;
    "totalSupply()": FunctionFragment;
    "transfer(address,uint256)": FunctionFragment;
    "transferFrom(address,address,uint256)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "accrualBlockNumber"
      | "allowance"
      | "approve"
      | "balanceOf"
      | "borrow"
      | "borrowBalanceCurrent"
      | "borrowBalanceStored"
      | "borrowIndex"
      | "borrowRatePerBlock"
      | "exchangeRateStored"
      | "getCash"
      | "mint"
      | "mintForSelfAndEnterMarket"
      | "redeem"
      | "redeemUnderlying"
      | "repayBorrow"
      | "repayBorrowBehalf"
      | "reserveRatio"
      | "supplyRatePerBlock"
      | "totalBorrows"
      | "totalReserves"
      | "totalSupply"
      | "transfer"
      | "transferFrom"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "accrualBlockNumber",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "allowance",
    values: [string, string]
  ): string;
  encodeFunctionData(
    functionFragment: "approve",
    values: [string, BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "balanceOf", values: [string]): string;
  encodeFunctionData(
    functionFragment: "borrow",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "borrowBalanceCurrent",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "borrowBalanceStored",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "borrowIndex",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "borrowRatePerBlock",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "exchangeRateStored",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "getCash", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "mint",
    values: [string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "mintForSelfAndEnterMarket",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "redeem",
    values: [string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "redeemUnderlying",
    values: [string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "repayBorrow",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "repayBorrowBehalf",
    values: [string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "reserveRatio",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "supplyRatePerBlock",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "totalBorrows",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "totalReserves",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "totalSupply",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "transfer",
    values: [string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "transferFrom",
    values: [string, string, BigNumberish]
  ): string;

  decodeFunctionResult(
    functionFragment: "accrualBlockNumber",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "allowance", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "approve", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "balanceOf", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "borrow", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "borrowBalanceCurrent",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "borrowBalanceStored",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "borrowIndex",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "borrowRatePerBlock",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "exchangeRateStored",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "getCash", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "mint", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "mintForSelfAndEnterMarket",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "redeem", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "redeemUnderlying",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "repayBorrow",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "repayBorrowBehalf",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "reserveRatio",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "supplyRatePerBlock",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "totalBorrows",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "totalReserves",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "totalSupply",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "transfer", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "transferFrom",
    data: BytesLike
  ): Result;

  events: {
    "Approval(address,address,uint256)": EventFragment;
    "Transfer(address,address,uint256)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "Approval"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Transfer"): EventFragment;
}

export interface ApprovalEventObject {
  owner: string;
  spender: string;
  value: BigNumber;
}
export type ApprovalEvent = TypedEvent<
  [string, string, BigNumber],
  ApprovalEventObject
>;

export type ApprovalEventFilter = TypedEventFilter<ApprovalEvent>;

export interface TransferEventObject {
  from: string;
  to: string;
  value: BigNumber;
}
export type TransferEvent = TypedEvent<
  [string, string, BigNumber],
  TransferEventObject
>;

export type TransferEventFilter = TypedEventFilter<TransferEvent>;

export interface IIERC20 extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: IIERC20Interface;

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
    accrualBlockNumber(overrides?: CallOverrides): Promise<[BigNumber]>;

    allowance(
      owner: string,
      spender: string,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    approve(
      spender: string,
      amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    balanceOf(account: string, overrides?: CallOverrides): Promise<[BigNumber]>;

    borrow(
      _borrowAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    borrowBalanceCurrent(
      user: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    borrowBalanceStored(
      user: string,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    borrowIndex(overrides?: CallOverrides): Promise<[BigNumber]>;

    borrowRatePerBlock(overrides?: CallOverrides): Promise<[BigNumber]>;

    exchangeRateStored(overrides?: CallOverrides): Promise<[BigNumber]>;

    getCash(overrides?: CallOverrides): Promise<[BigNumber]>;

    mint(
      _recipient: string,
      _mintAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    mintForSelfAndEnterMarket(
      _mintAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    redeem(
      from: string,
      redeemTokens: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    redeemUnderlying(
      _from: string,
      _redeemUnderlying: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    repayBorrow(
      _repayAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    repayBorrowBehalf(
      _borrower: string,
      _repayAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    reserveRatio(overrides?: CallOverrides): Promise<[BigNumber]>;

    supplyRatePerBlock(overrides?: CallOverrides): Promise<[BigNumber]>;

    totalBorrows(overrides?: CallOverrides): Promise<[BigNumber]>;

    totalReserves(overrides?: CallOverrides): Promise<[BigNumber]>;

    totalSupply(overrides?: CallOverrides): Promise<[BigNumber]>;

    transfer(
      to: string,
      amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    transferFrom(
      from: string,
      to: string,
      amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  accrualBlockNumber(overrides?: CallOverrides): Promise<BigNumber>;

  allowance(
    owner: string,
    spender: string,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  approve(
    spender: string,
    amount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  balanceOf(account: string, overrides?: CallOverrides): Promise<BigNumber>;

  borrow(
    _borrowAmount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  borrowBalanceCurrent(
    user: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  borrowBalanceStored(
    user: string,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  borrowIndex(overrides?: CallOverrides): Promise<BigNumber>;

  borrowRatePerBlock(overrides?: CallOverrides): Promise<BigNumber>;

  exchangeRateStored(overrides?: CallOverrides): Promise<BigNumber>;

  getCash(overrides?: CallOverrides): Promise<BigNumber>;

  mint(
    _recipient: string,
    _mintAmount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  mintForSelfAndEnterMarket(
    _mintAmount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  redeem(
    from: string,
    redeemTokens: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  redeemUnderlying(
    _from: string,
    _redeemUnderlying: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  repayBorrow(
    _repayAmount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  repayBorrowBehalf(
    _borrower: string,
    _repayAmount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  reserveRatio(overrides?: CallOverrides): Promise<BigNumber>;

  supplyRatePerBlock(overrides?: CallOverrides): Promise<BigNumber>;

  totalBorrows(overrides?: CallOverrides): Promise<BigNumber>;

  totalReserves(overrides?: CallOverrides): Promise<BigNumber>;

  totalSupply(overrides?: CallOverrides): Promise<BigNumber>;

  transfer(
    to: string,
    amount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  transferFrom(
    from: string,
    to: string,
    amount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    accrualBlockNumber(overrides?: CallOverrides): Promise<BigNumber>;

    allowance(
      owner: string,
      spender: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    approve(
      spender: string,
      amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<boolean>;

    balanceOf(account: string, overrides?: CallOverrides): Promise<BigNumber>;

    borrow(
      _borrowAmount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    borrowBalanceCurrent(
      user: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    borrowBalanceStored(
      user: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    borrowIndex(overrides?: CallOverrides): Promise<BigNumber>;

    borrowRatePerBlock(overrides?: CallOverrides): Promise<BigNumber>;

    exchangeRateStored(overrides?: CallOverrides): Promise<BigNumber>;

    getCash(overrides?: CallOverrides): Promise<BigNumber>;

    mint(
      _recipient: string,
      _mintAmount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    mintForSelfAndEnterMarket(
      _mintAmount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    redeem(
      from: string,
      redeemTokens: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    redeemUnderlying(
      _from: string,
      _redeemUnderlying: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    repayBorrow(
      _repayAmount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    repayBorrowBehalf(
      _borrower: string,
      _repayAmount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    reserveRatio(overrides?: CallOverrides): Promise<BigNumber>;

    supplyRatePerBlock(overrides?: CallOverrides): Promise<BigNumber>;

    totalBorrows(overrides?: CallOverrides): Promise<BigNumber>;

    totalReserves(overrides?: CallOverrides): Promise<BigNumber>;

    totalSupply(overrides?: CallOverrides): Promise<BigNumber>;

    transfer(
      to: string,
      amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<boolean>;

    transferFrom(
      from: string,
      to: string,
      amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<boolean>;
  };

  filters: {
    "Approval(address,address,uint256)"(
      owner?: string | null,
      spender?: string | null,
      value?: null
    ): ApprovalEventFilter;
    Approval(
      owner?: string | null,
      spender?: string | null,
      value?: null
    ): ApprovalEventFilter;

    "Transfer(address,address,uint256)"(
      from?: string | null,
      to?: string | null,
      value?: null
    ): TransferEventFilter;
    Transfer(
      from?: string | null,
      to?: string | null,
      value?: null
    ): TransferEventFilter;
  };

  estimateGas: {
    accrualBlockNumber(overrides?: CallOverrides): Promise<BigNumber>;

    allowance(
      owner: string,
      spender: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    approve(
      spender: string,
      amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    balanceOf(account: string, overrides?: CallOverrides): Promise<BigNumber>;

    borrow(
      _borrowAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    borrowBalanceCurrent(
      user: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    borrowBalanceStored(
      user: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    borrowIndex(overrides?: CallOverrides): Promise<BigNumber>;

    borrowRatePerBlock(overrides?: CallOverrides): Promise<BigNumber>;

    exchangeRateStored(overrides?: CallOverrides): Promise<BigNumber>;

    getCash(overrides?: CallOverrides): Promise<BigNumber>;

    mint(
      _recipient: string,
      _mintAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    mintForSelfAndEnterMarket(
      _mintAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    redeem(
      from: string,
      redeemTokens: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    redeemUnderlying(
      _from: string,
      _redeemUnderlying: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    repayBorrow(
      _repayAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    repayBorrowBehalf(
      _borrower: string,
      _repayAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    reserveRatio(overrides?: CallOverrides): Promise<BigNumber>;

    supplyRatePerBlock(overrides?: CallOverrides): Promise<BigNumber>;

    totalBorrows(overrides?: CallOverrides): Promise<BigNumber>;

    totalReserves(overrides?: CallOverrides): Promise<BigNumber>;

    totalSupply(overrides?: CallOverrides): Promise<BigNumber>;

    transfer(
      to: string,
      amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    transferFrom(
      from: string,
      to: string,
      amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    accrualBlockNumber(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    allowance(
      owner: string,
      spender: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    approve(
      spender: string,
      amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    balanceOf(
      account: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    borrow(
      _borrowAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    borrowBalanceCurrent(
      user: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    borrowBalanceStored(
      user: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    borrowIndex(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    borrowRatePerBlock(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    exchangeRateStored(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getCash(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    mint(
      _recipient: string,
      _mintAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    mintForSelfAndEnterMarket(
      _mintAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    redeem(
      from: string,
      redeemTokens: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    redeemUnderlying(
      _from: string,
      _redeemUnderlying: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    repayBorrow(
      _repayAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    repayBorrowBehalf(
      _borrower: string,
      _repayAmount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    reserveRatio(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    supplyRatePerBlock(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    totalBorrows(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    totalReserves(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    totalSupply(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    transfer(
      to: string,
      amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    transferFrom(
      from: string,
      to: string,
      amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}

export interface IIERC20Multicall {
  address: string;
  abi: Fragment[];
  functions: FunctionFragment[];

  accrualBlockNumber(overrides?: CallOverrides): Call<BigNumber>;

  allowance(
    owner: string,
    spender: string,
    overrides?: CallOverrides
  ): Call<BigNumber>;

  balanceOf(account: string, overrides?: CallOverrides): Call<BigNumber>;

  borrowBalanceStored(user: string, overrides?: CallOverrides): Call<BigNumber>;

  borrowIndex(overrides?: CallOverrides): Call<BigNumber>;

  borrowRatePerBlock(overrides?: CallOverrides): Call<BigNumber>;

  exchangeRateStored(overrides?: CallOverrides): Call<BigNumber>;

  getCash(overrides?: CallOverrides): Call<BigNumber>;

  reserveRatio(overrides?: CallOverrides): Call<BigNumber>;

  supplyRatePerBlock(overrides?: CallOverrides): Call<BigNumber>;

  totalBorrows(overrides?: CallOverrides): Call<BigNumber>;

  totalReserves(overrides?: CallOverrides): Call<BigNumber>;

  totalSupply(overrides?: CallOverrides): Call<BigNumber>;
}