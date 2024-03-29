/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import type { Provider } from "@ethersproject/providers";
import { Contract, Signer, utils } from "ethers";
import type {
  FlasherBalancer,
  FlasherBalancerInterface,
  FlasherBalancerMulticall,
} from "../../../src/flashloans/FlasherBalancer";
import { Contract as MulticallContract } from "@hovoh/ethcall";
const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "balancerVault",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "BaseFlasher__invalidEntryPoint",
    type: "error",
  },
  {
    inputs: [],
    name: "BaseFlasher__invalidFlashloanType",
    type: "error",
  },
  {
    inputs: [],
    name: "BaseFlasher__lastActionMustBeSwap",
    type: "error",
  },
  {
    inputs: [],
    name: "BaseFlasher__notAuthorized",
    type: "error",
  },
  {
    inputs: [],
    name: "BaseFlasher__notEmptyEntryPoint",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "computeFlashloanFee",
    outputs: [
      {
        internalType: "uint256",
        name: "fee",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "flasherProviderName",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "getFlashloanSourceAddr",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "requestor",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "requestorCalldata",
        type: "bytes",
      },
    ],
    name: "initiateFlashloan",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20[]",
        name: "tokens",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "amounts",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "feeAmounts",
        type: "uint256[]",
      },
      {
        internalType: "bytes",
        name: "userData",
        type: "bytes",
      },
    ],
    name: "receiveFlashLoan",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
export class FlasherBalancer__factory {
  static readonly abi = _abi;
  static createInterface(): FlasherBalancerInterface {
    return new utils.Interface(_abi) as FlasherBalancerInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): FlasherBalancer {
    return new Contract(address, _abi, signerOrProvider) as FlasherBalancer;
  }
  static multicall(address: string): FlasherBalancerMulticall {
    return new MulticallContract(
      address,
      _abi
    ) as unknown as FlasherBalancerMulticall;
  }
}
