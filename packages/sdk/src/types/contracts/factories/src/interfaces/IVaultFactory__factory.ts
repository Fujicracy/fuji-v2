/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import type { Provider } from "@ethersproject/providers";
import { Contract, Signer, utils } from "ethers";
import type {
  IVaultFactory,
  IVaultFactoryInterface,
  IVaultFactoryMulticall,
} from "../../../src/interfaces/IVaultFactory";
import { Contract as MulticallContract } from "@hovoh/ethcall";
const _abi = [
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "data",
        type: "bytes32",
      },
    ],
    name: "configAddress",
    outputs: [
      {
        internalType: "address",
        name: "vault",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "deployData",
        type: "bytes",
      },
    ],
    name: "deployVault",
    outputs: [
      {
        internalType: "address",
        name: "vault",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];
export class IVaultFactory__factory {
  static readonly abi = _abi;
  static createInterface(): IVaultFactoryInterface {
    return new utils.Interface(_abi) as IVaultFactoryInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IVaultFactory {
    return new Contract(address, _abi, signerOrProvider) as IVaultFactory;
  }
  static multicall(address: string): IVaultFactoryMulticall {
    return new MulticallContract(
      address,
      _abi
    ) as unknown as IVaultFactoryMulticall;
  }
}
