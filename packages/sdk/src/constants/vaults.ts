import { Address, BorrowingVault } from '../entities';
import { ChainId } from '../enums';
import { ChainVaultList } from '../types';
import { DAI, USDC, USDT, WETH9 } from './tokens';

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
      Address.from('0x401fbB3BcB8902cF37d9296d3Fc762eD0F708079'),
      WETH9[ChainId.MATIC],
      USDC[ChainId.MATIC]
    ),
    new BorrowingVault(
      Address.from('0x54b9C5B6ef062C92257bf911E504b817356Ef39A'),
      WETH9[ChainId.MATIC],
      USDC[ChainId.MATIC]
    ),
    new BorrowingVault(
      Address.from('0x98a554825ddad69432507cF8c69c3C775d1507d1'),
      WETH9[ChainId.MATIC],
      DAI[ChainId.MATIC]
    ),
    new BorrowingVault(
      Address.from('0x786105b1ae439a544cCF9E4A76352826546A60B6'),
      WETH9[ChainId.MATIC],
      DAI[ChainId.MATIC]
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
      Address.from('0xCc790B043A60a0F1cfB2b638C74ea0E4a28FD745'),
      WETH9[ChainId.ARBITRUM],
      USDC[ChainId.ARBITRUM]
    ),
    new BorrowingVault(
      Address.from('0x7948F86eded76369385A9cb085DA74d3e01e63c7'),
      WETH9[ChainId.ARBITRUM],
      USDC[ChainId.ARBITRUM]
    ),
  ],
  [ChainId.OPTIMISM]: [
    new BorrowingVault(
      Address.from('0x4de7Bacd810b4D11a309440fdfF2bdBE6047C556'),
      WETH9[ChainId.OPTIMISM],
      USDC[ChainId.OPTIMISM]
    ),
    new BorrowingVault(
      Address.from('0x4ba27a78c021Deab31D7B46aCaBf87DA04445FeF'),
      WETH9[ChainId.OPTIMISM],
      USDC[ChainId.OPTIMISM]
    ),
    new BorrowingVault(
      Address.from('0x930dC8e66Edd2bD6C6E5984EecE95b8729Ae0d6c'),
      WETH9[ChainId.OPTIMISM],
      DAI[ChainId.OPTIMISM]
    ),
    new BorrowingVault(
      Address.from('0x1FCd79114eCdb6713CD479107Bd92272a6C3C85B'),
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
      Address.from('0x6F5d27D6d0541A648e27cB0181e8C8dDcf272Af3'),
      WETH9[ChainId.GNOSIS],
      USDC[ChainId.GNOSIS]
    ),
  ],
};
