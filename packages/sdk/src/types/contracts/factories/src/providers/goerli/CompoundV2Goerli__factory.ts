/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import type { Provider } from "@ethersproject/providers";
import { Contract, Signer, utils } from "ethers";
import type {
  CompoundV2Goerli,
  CompoundV2GoerliInterface,
  CompoundV2GoerliMulticall,
} from "../../../../src/providers/goerli/CompoundV2Goerli";
import { Contract as MulticallContract } from "@hovoh/ethcall";
const _abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "status",
        type: "uint256",
      },
    ],
    name: "CompoundV2__borrow_failed",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "status",
        type: "uint256",
      },
    ],
    name: "CompoundV2__deposit_failed",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "status",
        type: "uint256",
      },
    ],
    name: "CompoundV2__payback_failed",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "status",
        type: "uint256",
      },
    ],
    name: "CompoundV2__withdraw_failed",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "keyAsset",
        type: "address",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "approvedOperator",
    outputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "contract IVault",
        name: "vault",
        type: "address",
      },
    ],
    name: "borrow",
    outputs: [
      {
        internalType: "bool",
        name: "success",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "contract IVault",
        name: "vault",
        type: "address",
      },
    ],
    name: "deposit",
    outputs: [
      {
        internalType: "bool",
        name: "success",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "contract IVault",
        name: "vault",
        type: "address",
      },
    ],
    name: "getBorrowBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "balance",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
    ],
    name: "getBorrowBalanceTest_1",
    outputs: [
      {
        internalType: "uint256",
        name: "balance",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
    ],
    name: "getBorrowBalanceTest_2",
    outputs: [
      {
        internalType: "uint256",
        name: "balance",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IVault",
        name: "vault",
        type: "address",
      },
    ],
    name: "getBorrowRateFor",
    outputs: [
      {
        internalType: "uint256",
        name: "rate",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "contract IVault",
        name: "vault",
        type: "address",
      },
    ],
    name: "getDepositBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "balance",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IVault",
        name: "vault",
        type: "address",
      },
    ],
    name: "getDepositRateFor",
    outputs: [
      {
        internalType: "uint256",
        name: "rate",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMapper",
    outputs: [
      {
        internalType: "contract IAddrMapper",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "contract IVault",
        name: "vault",
        type: "address",
      },
    ],
    name: "payback",
    outputs: [
      {
        internalType: "bool",
        name: "success",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "providerName",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "contract IVault",
        name: "vault",
        type: "address",
      },
    ],
    name: "withdraw",
    outputs: [
      {
        internalType: "bool",
        name: "success",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];
export class CompoundV2Goerli__factory {
  static readonly abi = _abi;
  static createInterface(): CompoundV2GoerliInterface {
    return new utils.Interface(_abi) as CompoundV2GoerliInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): CompoundV2Goerli {
    return new Contract(address, _abi, signerOrProvider) as CompoundV2Goerli;
  }
  static multicall(address: string): CompoundV2GoerliMulticall {
    return new MulticallContract(
      address,
      _abi
    ) as unknown as CompoundV2GoerliMulticall;
  }
}
