import { AddressZero } from '@ethersproject/constants';

import { Address } from '../entities/Address';
import { ChainId } from '../enums';
import { AddressMap } from '../types';

export const WETH9_ADDRESS: AddressMap = {
  [ChainId.ETHEREUM]: Address.from(
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
  ),
  [ChainId.ARBITRUM]: Address.from(
    '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
  ),
  [ChainId.FANTOM]: Address.from('0x74b23882a30290451A17c44f4F05243b6b58C76d'),
  [ChainId.MATIC]: Address.from('0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'),
  [ChainId.OPTIMISM]: Address.from(
    '0x4200000000000000000000000000000000000006'
  ),
  [ChainId.GOERLI]: Address.from('0x7ea6eA49B0b0Ae9c5db7907d139D9Cd3439862a1'),
  [ChainId.OPTIMISM_GOERLI]: Address.from(
    '0x68Db1c8d85C09d546097C65ec7DCBFF4D6497CbF'
  ),
  [ChainId.MATIC_MUMBAI]: Address.from(
    '0xeDb95D8037f769B72AAab41deeC92903A98C9E16'
  ),
};

export const WNATIVE_ADDRESS: AddressMap = {
  [ChainId.ETHEREUM]: WETH9_ADDRESS[ChainId.ETHEREUM],
  [ChainId.OPTIMISM]: WETH9_ADDRESS[ChainId.OPTIMISM],
  [ChainId.ARBITRUM]: WETH9_ADDRESS[ChainId.ARBITRUM],
  [ChainId.FANTOM]: Address.from('0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83'),
  [ChainId.MATIC]: Address.from('0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'),
  [ChainId.GOERLI]: WETH9_ADDRESS[ChainId.GOERLI],
  [ChainId.OPTIMISM_GOERLI]: WETH9_ADDRESS[ChainId.OPTIMISM_GOERLI],
  [ChainId.MATIC_MUMBAI]: Address.from(
    '0xeDb95D8037f769B72AAab41deeC92903A98C9E16'
  ),
};

export const DAI_ADDRESS: AddressMap = {
  [ChainId.ETHEREUM]: Address.from(
    '0x6B175474E89094C44Da98b954EedeAC495271d0F'
  ),
  [ChainId.MATIC]: Address.from('0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'),
  [ChainId.FANTOM]: Address.from('0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E'),
  [ChainId.ARBITRUM]: Address.from(
    '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'
  ),
  [ChainId.OPTIMISM]: Address.from(
    '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'
  ),
  [ChainId.GOERLI]: Address.from('0x918Cfff6AB82f5a28623b08Babd2893963A27AAC'),
  [ChainId.OPTIMISM_GOERLI]: Address.from(
    '0xc1323Ec9DFcbCCc95adE570787fc28967aDf6855'
  ),
  [ChainId.MATIC_MUMBAI]: Address.from(
    '0xD7766dCa9aD66b1980D5A5B30Db0D76F291be9cC'
  ),
};

export const USDC_ADDRESS: AddressMap = {
  [ChainId.ETHEREUM]: Address.from(
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  ),
  [ChainId.MATIC]: Address.from('0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'),
  [ChainId.FANTOM]: Address.from('0x04068DA6C83AFCFA0e13ba15A6696662335D5B75'),
  [ChainId.ARBITRUM]: Address.from(
    '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'
  ),
  [ChainId.OPTIMISM]: Address.from(
    '0x7F5c764cBc14f9669B88837ca1490cCa17c31607'
  ),
  [ChainId.GOERLI]: Address.from('0x5FfbaC75EFc9547FBc822166feD19B05Cd5890bb'),
  [ChainId.OPTIMISM_GOERLI]: Address.from(
    '0xf3f8fa801F86e79849436e41E58c73d705085E9b'
  ),
  [ChainId.MATIC_MUMBAI]: Address.from(
    '0x3EF9FA25C53554dc78E01189642847A442AA6f80'
  ),
};

export const USDT_ADDRESS: AddressMap = {
  [ChainId.ETHEREUM]: Address.from(
    '0xdAC17F958D2ee523a2206206994597C13D831ec7'
  ),
  [ChainId.MATIC]: Address.from('0xc2132D05D31c914a87C6611C10748AEb04B58e8F'),
  [ChainId.FANTOM]: Address.from('0x049d68029688eAbF473097a2fC38ef61633A3C7A'),
  [ChainId.ARBITRUM]: Address.from(
    '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'
  ),
  [ChainId.OPTIMISM]: Address.from(
    '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58'
  ),
  [ChainId.GOERLI]: Address.from(AddressZero),
  [ChainId.OPTIMISM_GOERLI]: Address.from(
    '0xc5b91019e10136fa312b9A8D5B6afAC5D466fAC7'
  ),
  [ChainId.MATIC_MUMBAI]: Address.from(
    '0xa541e0Bde9604Dd548f8d863578f7Ce0cB7778F2'
  ),
};

export const FUJI_ORACLE_ADDRESS: AddressMap = {
  [ChainId.ETHEREUM]: Address.from(AddressZero),
  [ChainId.ARBITRUM]: Address.from(AddressZero),
  [ChainId.OPTIMISM]: Address.from(AddressZero),
  [ChainId.FANTOM]: Address.from(AddressZero),
  [ChainId.MATIC]: Address.from(AddressZero),
  [ChainId.GOERLI]: Address.from('0x4f1A1C86849104c4d92810F7CdD127FbaCF98301'),
  [ChainId.OPTIMISM_GOERLI]: Address.from(
    '0xE4903ba1b082b678bd5C935f43988811eE85aD48'
  ),
  [ChainId.MATIC_MUMBAI]: Address.from(
    '0x5DA1DAAeBe3bc266fa34FFc22F233b07C2F8658C'
  ),
};

export const CONNEXT_ROUTER_ADDRESS: AddressMap = {
  [ChainId.ETHEREUM]: Address.from(AddressZero),
  [ChainId.ARBITRUM]: Address.from(AddressZero),
  [ChainId.OPTIMISM]: Address.from(AddressZero),
  [ChainId.FANTOM]: Address.from(AddressZero),
  [ChainId.MATIC]: Address.from(AddressZero),
  [ChainId.GOERLI]: Address.from('0xB88de8C986b800b01F89e45EccCE6B7ca5FDf109'),
  [ChainId.MATIC_MUMBAI]: Address.from(
    '0x4D0bCE5F2524E80C85965c28B56AD6231C0e5c7c'
  ),
  [ChainId.OPTIMISM_GOERLI]: Address.from(
    '0xD8863e338Cf07460C70DAa7BB8eA1F9758569B45'
  ),
};
