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
  [ChainId.GOERLI]: Address.from('0xbB141B172096e6a5B2683269444302c9ca793b85'),
  [ChainId.OPTIMISM_GOERLI]: Address.from(
    '0x267C950378eeDacE9D4285F1b4EF59fD78aB0169'
  ),
  [ChainId.MATIC_MUMBAI]: Address.from(
    '0x0A5AE664dE0E74b8b433Fb276d1DCe3C6B09B709'
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
    '0x345889dEb3F296B69719322537F53C4E0b1fd9BE'
  ),
  [ChainId.MATIC_MUMBAI]: Address.from(
    '0xfC6c77DCddBDDdca077b5Ed2680cbe44E94081C4'
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
    '0xB55A6a28B0C83aAFA0D7aD4099665d513871d8eE'
  ),
  [ChainId.MATIC_MUMBAI]: Address.from(
    '0xd0F5f1904e332ab204966e810DdbCeA923d71A15'
  ),
};

export const FUJI_ORACLE_ADDRESS: AddressMap = {
  [ChainId.ETHEREUM]: Address.from(AddressZero),
  [ChainId.ARBITRUM]: Address.from(AddressZero),
  [ChainId.OPTIMISM]: Address.from(AddressZero),
  [ChainId.FANTOM]: Address.from(AddressZero),
  [ChainId.MATIC]: Address.from(AddressZero),
  [ChainId.GOERLI]: Address.from('0x69157Cf289eA39Dc3272ccA38155DD1B697C7d54'),
  [ChainId.OPTIMISM_GOERLI]: Address.from(
    '0x3170b2acc6e47edeF7052709C8cC577995e96Ee7'
  ),
  [ChainId.MATIC_MUMBAI]: Address.from(
    '0x75A090a3a0F3c1F1b476A9c88998B472c4105815'
  ),
};

export const CONNEXT_ROUTER_ADDRESS: AddressMap = {
  [ChainId.ETHEREUM]: Address.from(AddressZero),
  [ChainId.ARBITRUM]: Address.from(AddressZero),
  [ChainId.OPTIMISM]: Address.from(AddressZero),
  [ChainId.FANTOM]: Address.from(AddressZero),
  [ChainId.MATIC]: Address.from(AddressZero),
  [ChainId.GOERLI]: Address.from('0x58Ec012028925E0A9eb8136e1037a1be683558B6'),
  [ChainId.MATIC_MUMBAI]: Address.from(
    '0xb359F343512eAF2d026911726173a149D330bA8F'
  ),
  [ChainId.OPTIMISM_GOERLI]: Address.from(
    '0xdA1a42056BcBDd35b8E1C4f55773f0f11c171634'
  ),
};
