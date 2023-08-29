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
  [ChainId.GNOSIS]: Address.from('0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1'),
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
  [ChainId.GNOSIS]: Address.from('0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d'),
};

export const WSTETH_ADDRESS: AddressMap = {
  [ChainId.ETHEREUM]: Address.from(
    '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0'
  ),
  [ChainId.MATIC]: Address.from('0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD'),
  [ChainId.FANTOM]: Address.from(AddressZero),
  [ChainId.ARBITRUM]: Address.from(
    '0x5979D7b546E38E414F7E9822514be443A4800529'
  ),
  [ChainId.OPTIMISM]: Address.from(
    '0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb'
  ),
  [ChainId.GOERLI]: Address.from(AddressZero),
  [ChainId.OPTIMISM_GOERLI]: Address.from(AddressZero),
  [ChainId.MATIC_MUMBAI]: Address.from(AddressZero),
  [ChainId.GNOSIS]: Address.from('0x6C76971f98945AE98dD7d4DFcA8711ebea946eA6'),
};

export const CBETH_ADDRESS: AddressMap = {
  [ChainId.ETHEREUM]: Address.from(
    '0xBe9895146f7AF43049ca1c1AE358B0541Ea49704'
  ),
  [ChainId.MATIC]: Address.from('0x4b4327dB1600B8B1440163F667e199CEf35385f5'),
  [ChainId.FANTOM]: Address.from(AddressZero),
  [ChainId.ARBITRUM]: Address.from(
    '0x1DEBd73E752bEaF79865Fd6446b0c970EaE7732f'
  ),
  [ChainId.OPTIMISM]: Address.from(
    '0xadDb6A0412DE1BA0F936DCaeb8Aaa24578dcF3B2'
  ),
  [ChainId.GOERLI]: Address.from(AddressZero),
  [ChainId.OPTIMISM_GOERLI]: Address.from(AddressZero),
  [ChainId.MATIC_MUMBAI]: Address.from(AddressZero),
  [ChainId.GNOSIS]: Address.from(AddressZero),
};

export const RETH_ADDRESS: AddressMap = {
  [ChainId.ETHEREUM]: Address.from(
    '0xae78736Cd615f374D3085123A210448E74Fc6393'
  ),
  [ChainId.MATIC]: Address.from('0x0266F4F08D82372CF0FcbCCc0Ff74309089c74d1'),
  [ChainId.FANTOM]: Address.from(AddressZero),
  [ChainId.ARBITRUM]: Address.from(
    '0xEC70Dcb4A1EFa46b8F2D97C310C9c4790ba5ffA8'
  ),
  [ChainId.OPTIMISM]: Address.from(
    '0x9Bcef72be871e61ED4fBbc7630889beE758eb81D'
  ),
  [ChainId.GOERLI]: Address.from(AddressZero),
  [ChainId.OPTIMISM_GOERLI]: Address.from(AddressZero),
  [ChainId.MATIC_MUMBAI]: Address.from(AddressZero),
  [ChainId.GNOSIS]: Address.from(AddressZero),
};

export const WBTC_ADDRESS: AddressMap = {
  [ChainId.ETHEREUM]: Address.from(
    '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
  ),
  [ChainId.MATIC]: Address.from('0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6'),
  [ChainId.FANTOM]: Address.from(AddressZero),
  [ChainId.ARBITRUM]: Address.from(
    '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f'
  ),
  [ChainId.OPTIMISM]: Address.from(
    '0x68f180fcCe6836688e9084f035309E29Bf0A2095'
  ),
  [ChainId.GOERLI]: Address.from(AddressZero),
  [ChainId.OPTIMISM_GOERLI]: Address.from(AddressZero),
  [ChainId.MATIC_MUMBAI]: Address.from(AddressZero),
  [ChainId.GNOSIS]: Address.from('0x8e5bBbb09Ed1ebdE8674Cda39A0c169401db4252'),
};

export const GNO_ADDRESS: AddressMap = {
  [ChainId.ETHEREUM]: Address.from(
    '0x6810e776880C02933D47DB1b9fc05908e5386b96'
  ),
  [ChainId.MATIC]: Address.from(AddressZero),
  [ChainId.FANTOM]: Address.from(AddressZero),
  [ChainId.ARBITRUM]: Address.from(
    '0xa0b862F60edEf4452F25B4160F177db44DeB6Cf1'
  ),
  [ChainId.OPTIMISM]: Address.from(AddressZero),
  [ChainId.GOERLI]: Address.from(AddressZero),
  [ChainId.OPTIMISM_GOERLI]: Address.from(AddressZero),
  [ChainId.MATIC_MUMBAI]: Address.from(AddressZero),
  [ChainId.GNOSIS]: Address.from('0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb'),
};

export const GHO_ADDRESS: AddressMap = {
  [ChainId.ETHEREUM]: Address.from(
    '0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f'
  ),
  [ChainId.MATIC]: Address.from(AddressZero),
  [ChainId.FANTOM]: Address.from(AddressZero),
  [ChainId.ARBITRUM]: Address.from(
    '0xa0b862F60edEf4452F25B4160F177db44DeB6Cf1'
  ),
  [ChainId.OPTIMISM]: Address.from(AddressZero),
  [ChainId.GOERLI]: Address.from(AddressZero),
  [ChainId.OPTIMISM_GOERLI]: Address.from(AddressZero),
  [ChainId.MATIC_MUMBAI]: Address.from(AddressZero),
  [ChainId.GNOSIS]: Address.from(AddressZero),
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
  [ChainId.GNOSIS]: Address.from(AddressZero),
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
  [ChainId.GNOSIS]: Address.from('0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83'),
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
  [ChainId.GNOSIS]: Address.from('0x4ECaBa5870353805a9F068101A40E0f32ed605C6'),
};

export const FUJI_ORACLE_ADDRESS: AddressMap = {
  [ChainId.ETHEREUM]: Address.from(
    '0x52b23b09fF03669fbD2203902d83F4c4d2DEe0D4'
  ),
  [ChainId.ARBITRUM]: Address.from(
    '0x527B279fe61E459e0c0a0a1bb9De08a49Cdc689a'
  ),
  [ChainId.OPTIMISM]: Address.from(
    '0xb71073364B78Debe996d041Bb340ff4F03Ff23D9'
  ),
  [ChainId.FANTOM]: Address.from(AddressZero),
  [ChainId.MATIC]: Address.from('0x3d140C9208330aC0d2b3aB4922dD4Bb9B119111F'),
  [ChainId.GOERLI]: Address.from('0x4f1A1C86849104c4d92810F7CdD127FbaCF98301'),
  [ChainId.OPTIMISM_GOERLI]: Address.from(
    '0xE4903ba1b082b678bd5C935f43988811eE85aD48'
  ),
  [ChainId.MATIC_MUMBAI]: Address.from(
    '0x5DA1DAAeBe3bc266fa34FFc22F233b07C2F8658C'
  ),
  [ChainId.GNOSIS]: Address.from('0x9907F34FbA2336C3Ce8758dd80c301BFf921dEc2'),
};

export const CHIEF_ADDRESS: AddressMap = {
  [ChainId.ETHEREUM]: Address.from(
    '0x88ed3B8D03e5a70Bf23286872b24cFFd76e91922'
  ),
  [ChainId.ARBITRUM]: Address.from(
    '0x31F6556A61637839aA8bC3b55d8DBefd9DB8865c'
  ),
  [ChainId.OPTIMISM]: Address.from(
    '0xd1Aa6767ba125fF8cE187ba8810ba781094F66e3'
  ),
  [ChainId.FANTOM]: Address.from(AddressZero),
  [ChainId.MATIC]: Address.from('0x69097538190AC1bceAa0C8ebFA7C512b1eb8D24a'),
  [ChainId.GOERLI]: Address.from('0x5C18e88352dF0305236a4471030A5aFfB11d9592'),
  [ChainId.OPTIMISM_GOERLI]: Address.from(
    '0xbdB78Cf6f7c3E7345f06e7e076CDEB5e964eFD21'
  ),
  [ChainId.MATIC_MUMBAI]: Address.from(
    '0xE652f6e7b27EB4E19Fa9cAe4315cff36868B319F'
  ),
  [ChainId.GNOSIS]: Address.from('0x95964aB419300F67e562F7c86DCa02C480252369'),
};

export const CONNEXT_ROUTER_ADDRESS: AddressMap = {
  [ChainId.ETHEREUM]: Address.from(
    '0x9907F34FbA2336C3Ce8758dd80c301BFf921dEc2'
  ),
  [ChainId.ARBITRUM]: Address.from(
    '0xBE1a14779411fA2ea6C426C123248F48a30fc5F4'
  ),
  [ChainId.OPTIMISM]: Address.from(
    '0xcdc1448Aa5180211bBf1Cf2976FBB68ed0c3013e'
  ),
  [ChainId.FANTOM]: Address.from(AddressZero),
  [ChainId.MATIC]: Address.from('0x1c539BB7057eC2a3d1FEc1CF4d34c3bF46525Bb1'),
  [ChainId.GOERLI]: Address.from('0xa678C43f04ce286434E32731dD9Ab0721763f953'),
  [ChainId.MATIC_MUMBAI]: Address.from(
    '0x62607f1AF5980DFccB94FcbAd42afaC4dDAd32Ff'
  ),
  [ChainId.OPTIMISM_GOERLI]: Address.from(
    '0x1C7c4623C4b83805968603a5312928CC6E1Bf3C8'
  ),
  [ChainId.GNOSIS]: Address.from('0x1E302dfc2A25C294eEFf8f19175D90351de6542F'),
};
