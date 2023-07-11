import { Address, BorrowingVault } from '../entities';
import { ChainId } from '../enums';
import { ChainVaultList } from '../types';
import { DAI, MATICX, USDC, USDT, WETH9 } from './tokens';

export const VAULT_LIST: ChainVaultList = {
  [ChainId.ETHEREUM]: [],
  [ChainId.GOERLI]: [
    new BorrowingVault(
      Address.from('0xD08b093b4804DEC9af22f70Bc35E8e132106B5C2'),
      WETH9[ChainId.GOERLI],
      DAI[ChainId.GOERLI]
    ),
  ],
  [ChainId.MATIC]: [
    new BorrowingVault(
      Address.from('0xD0fE6F0CFEfCb46662b616340098e6eb4Bd29f09'),
      WETH9[ChainId.MATIC],
      USDC[ChainId.MATIC]
    ),
    new BorrowingVault(
      Address.from('0xc214d5C18c5191afbFeb60F70F32dCd4d13149ED'),
      WETH9[ChainId.MATIC],
      USDC[ChainId.MATIC]
    ),
    new BorrowingVault(
      Address.from('0x4d8fAfA3A38404440a91EC22d88fb72E47215332'),
      WETH9[ChainId.MATIC],
      DAI[ChainId.MATIC]
    ),
    new BorrowingVault(
      Address.from('0x4c56f523cD3167bF08301f9Cc503321736448377'),
      WETH9[ChainId.MATIC],
      DAI[ChainId.MATIC]
    ),
    new BorrowingVault(
      Address.from('0x37F943A180A9E31A0633ad493A52CA18BECD1B5c'),
      MATICX,
      USDC[ChainId.MATIC]
    ),
  ],
  [ChainId.MATIC_MUMBAI]: [
    new BorrowingVault(
      Address.from('0xDdd86428204f12f296954c9CdFC73F3275f0D8a0'),
      WETH9[ChainId.MATIC_MUMBAI],
      DAI[ChainId.MATIC_MUMBAI]
    ),
    new BorrowingVault(
      Address.from('0xE4903ba1b082b678bd5C935f43988811eE85aD48'),
      WETH9[ChainId.MATIC_MUMBAI],
      USDC[ChainId.MATIC_MUMBAI]
    ),
    new BorrowingVault(
      Address.from('0x03c9BA7110F17c080E1B05df507D9dcba8FB157e'),
      WETH9[ChainId.MATIC_MUMBAI],
      USDT[ChainId.MATIC_MUMBAI]
    ),
  ],
  [ChainId.FANTOM]: [],
  [ChainId.ARBITRUM]: [
    new BorrowingVault(
      Address.from('0x9201E10E4C269D6528d2d153f2145348A399f540'),
      WETH9[ChainId.ARBITRUM],
      USDC[ChainId.ARBITRUM]
    ),
    new BorrowingVault(
      Address.from('0x4181d63c414327682B1cb1d6265CA47d82C46e93'),
      WETH9[ChainId.ARBITRUM],
      USDC[ChainId.ARBITRUM]
    ),
    new BorrowingVault(
      Address.from('0xA68DD672f0D52277a740a5f6864Bd3A0a30462f8'),
      WETH9[ChainId.ARBITRUM],
      DAI[ChainId.ARBITRUM]
    ),
    new BorrowingVault(
      Address.from('0xB9E7aCCb61031CA364C3232E986D9152b61006c2'),
      WETH9[ChainId.ARBITRUM],
      DAI[ChainId.ARBITRUM]
    ),
    //new BorrowingVault(
    //Address.from('0xe2A42570C5b0d764f615368A50bE40EfB5D91D9A'),
    //WETH9[ChainId.ARBITRUM],
    //USDT[ChainId.ARBITRUM]
    //),
  ],
  [ChainId.OPTIMISM]: [
    new BorrowingVault(
      Address.from('0xeaAfbf9b8aCEA243cf8a7aAa9a26497E98802cc9'),
      WETH9[ChainId.OPTIMISM],
      USDC[ChainId.OPTIMISM]
    ),
    new BorrowingVault(
      Address.from('0x3e79537100bfc39893EdCa1311dF5f70F946B7d2'),
      WETH9[ChainId.OPTIMISM],
      USDC[ChainId.OPTIMISM]
    ),
    new BorrowingVault(
      Address.from('0x00cD7CbC64B8Ca27BaCE9ee23Ab87Cb3C6ECe01C'),
      WETH9[ChainId.OPTIMISM],
      DAI[ChainId.OPTIMISM]
    ),
    new BorrowingVault(
      Address.from('0xD7ef0e95Fc9cf815247d8110d4Cf102F59eDF871'),
      WETH9[ChainId.OPTIMISM],
      DAI[ChainId.OPTIMISM]
    ),
  ],
  [ChainId.OPTIMISM_GOERLI]: [
    new BorrowingVault(
      Address.from('0xf5A39De230ca0DaD78534D83f0eA1F8b2a4FC622'),
      WETH9[ChainId.OPTIMISM_GOERLI],
      DAI[ChainId.OPTIMISM_GOERLI]
    ),
    new BorrowingVault(
      Address.from('0xBAe6e16818b2748bf769be230a4ED323f29Ba9aF'),
      WETH9[ChainId.OPTIMISM_GOERLI],
      USDC[ChainId.OPTIMISM_GOERLI]
    ),
    new BorrowingVault(
      Address.from('0x0C3A3A2a49CACE680011D91f7bbc01d7EC8a0788'),
      WETH9[ChainId.OPTIMISM_GOERLI],
      USDT[ChainId.OPTIMISM_GOERLI]
    ),
  ],
  [ChainId.GNOSIS]: [
    new BorrowingVault(
      Address.from('0x8bDdE35081db12e503F95D2263d9949f78393000'),
      WETH9[ChainId.GNOSIS],
      USDC[ChainId.GNOSIS]
    ),
  ],
};
