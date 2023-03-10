/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import type { Provider } from "@ethersproject/providers";
import { Contract, Signer, utils } from "ethers";
import type {
  VaultDeployer,
  VaultDeployerInterface,
  VaultDeployerMulticall,
} from "../../../src/abstracts/VaultDeployer";
import { Contract as MulticallContract } from "@hovoh/ethcall";
const _abi = [
  {
    inputs: [],
    name: "VaultDeployer__onlyChief_notAuthorized",
    type: "error",
  },
  {
    inputs: [],
    name: "VaultDeployer__onlyTimelock_notAuthorized",
    type: "error",
  },
  {
    inputs: [],
    name: "VaultDeployer__zeroAddress",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "vault",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "salt",
        type: "bytes32",
      },
    ],
    name: "VaultRegistered",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "allVaults",
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
    inputs: [],
    name: "chief",
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
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    name: "configAddress",
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
        name: "startIndex",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "count",
        type: "uint256",
      },
    ],
    name: "getVaults",
    outputs: [
      {
        internalType: "address[]",
        name: "vaults",
        type: "address[]",
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
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "vaultsByAsset",
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
    ],
    name: "vaultsCount",
    outputs: [
      {
        internalType: "uint256",
        name: "count",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
export class VaultDeployer__factory {
  static readonly abi = _abi;
  static createInterface(): VaultDeployerInterface {
    return new utils.Interface(_abi) as VaultDeployerInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): VaultDeployer {
    return new Contract(address, _abi, signerOrProvider) as VaultDeployer;
  }
  static multicall(address: string): VaultDeployerMulticall {
    return new MulticallContract(
      address,
      _abi
    ) as unknown as VaultDeployerMulticall;
  }
}
