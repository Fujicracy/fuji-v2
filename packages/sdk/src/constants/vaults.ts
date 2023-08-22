import { Address } from '../entities';
import { BorrowingVault } from '../entities/BorrowingVault';
import { LendingVault } from '../entities/LendingVault';
import { ChainId } from '../enums';
import { ChainVaultList } from '../types';
import {
  CBETH,
  DAI,
  GHO,
  GNO,
  MATICX,
  RETH,
  USDC,
  USDT,
  WETH9,
  WNATIVE,
  WSTETH,
} from './tokens';

export const VAULT_LIST: ChainVaultList = {
  [ChainId.ETHEREUM]: [
    new LendingVault(
      Address.from('0x47949980636697AeBF93111097DB2537E8eB317f'),
      WETH9[ChainId.ETHEREUM]
    ),
    new LendingVault(
      Address.from('0x22B6251935dA74a69b63A52d993924904559B76a'),
      USDC[ChainId.ETHEREUM]
    ),
    new LendingVault(
      Address.from('0x69612f144e7B6933D26Ea6E254b3E76A47a0B4D9'),
      DAI[ChainId.ETHEREUM]
    ),
    new LendingVault(
      Address.from('0xe70B3C4B76F5Ae4505D553427FA50aD75f34ff86'),
      DAI[ChainId.ETHEREUM]
    ),
    new LendingVault(
      Address.from('0x337688b46dA29A3B47b3C88941d26754898faA99'),
      USDT[ChainId.ETHEREUM]
    ),
    new BorrowingVault(
      Address.from('0xf58456695406E04E748010c065A5F5861665B6a9'),
      WETH9[ChainId.ETHEREUM],
      USDC[ChainId.ETHEREUM]
    ),
    new BorrowingVault(
      Address.from('0x26cb668F87Fff93F2c3F1865124D51DD900a77E3'),
      WETH9[ChainId.ETHEREUM],
      USDC[ChainId.ETHEREUM]
    ),
    new BorrowingVault(
      Address.from('0xC5A93F0EEaB26ef8f6bE7D35451E2f4B55Dfd25d'),
      WETH9[ChainId.ETHEREUM],
      USDC[ChainId.ETHEREUM]
    ),
    new BorrowingVault(
      Address.from('0xf7a7cf71d9986f7fcBC2A71eE6bcF271ACb3DC7A'),
      WSTETH[ChainId.ETHEREUM],
      USDC[ChainId.ETHEREUM]
    ),
    new BorrowingVault(
      Address.from('0xBf2b58B962cB951FCEa3F32e3afd54661aA2A78e'),
      WSTETH[ChainId.ETHEREUM],
      WETH9[ChainId.ETHEREUM]
    ),
    new BorrowingVault(
      Address.from('0x288465D0385aed5971467E84718BDCE553e24498'),
      CBETH[ChainId.ETHEREUM],
      WETH9[ChainId.ETHEREUM]
    ),
    new BorrowingVault(
      Address.from('0xb2a57D48a1553B071B99353CC07dCc1a2D2730c9'),
      RETH[ChainId.ETHEREUM],
      WETH9[ChainId.ETHEREUM]
    ),
    new BorrowingVault(
      Address.from('0xF735AbC0E7284D734d711870Eb2340015d370ECE'),
      WSTETH[ChainId.ETHEREUM],
      GHO[ChainId.ETHEREUM]
    ),
  ],
  [ChainId.GOERLI]: [
    new BorrowingVault(
      Address.from('0xD08b093b4804DEC9af22f70Bc35E8e132106B5C2'),
      WETH9[ChainId.GOERLI],
      DAI[ChainId.GOERLI]
    ),
  ],
  [ChainId.MATIC]: [
    new LendingVault(
      Address.from('0x1e49eCB017D30BcC1b179198f8d447CF0fb6bd09'),
      WETH9[ChainId.MATIC]
    ),
    new LendingVault(
      Address.from('0xF84a6A6D6a584b0Bad8BbD4B0B70d902e821f11b'),
      USDC[ChainId.MATIC]
    ),
    new LendingVault(
      Address.from('0xd8Fe153C5c44535017657f52C36BA1c64FDeC7b3'),
      DAI[ChainId.MATIC]
    ),
    new LendingVault(
      Address.from('0x973d2990F829662f2415317384c680247Be46AaE'),
      USDT[ChainId.MATIC]
    ),
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
    new LendingVault(
      Address.from('0xcF6381f528E813B12476399E8471D5689aD4736b'),
      WETH9[ChainId.ARBITRUM]
    ),
    new LendingVault(
      Address.from('0x9830d653A63F8910d229F3Fbf60361535782436d'),
      USDC[ChainId.ARBITRUM]
    ),
    new LendingVault(
      Address.from('0x542CD48cb7Da98E3ff644bC6b92D74dDD2CcdAD7'),
      USDT[ChainId.ARBITRUM]
    ),
    new LendingVault(
      Address.from('0xA49Bb23EF1936F98E6c31E2d752B3F7bD6a378b9'),
      DAI[ChainId.ARBITRUM]
    ),
    new BorrowingVault(
      Address.from('0x78c5A2b6AD8CC824ad28DecCe82a3be9Ba12785B'),
      WETH9[ChainId.ARBITRUM],
      USDC[ChainId.ARBITRUM]
    ),
    new BorrowingVault(
      Address.from('0x3DDa51f1658519AC9DaB865Eb2900221CcD29421'),
      WETH9[ChainId.ARBITRUM],
      USDC[ChainId.ARBITRUM]
    ),
    new BorrowingVault(
      Address.from('0xe671d60816Fce03B9d6204dce0B5CF31F4262947'),
      WETH9[ChainId.ARBITRUM],
      DAI[ChainId.ARBITRUM]
    ),
    new BorrowingVault(
      Address.from('0xCbeEd94Ad7Bd3725103899450A528fE690E91d8e'),
      WETH9[ChainId.ARBITRUM],
      DAI[ChainId.ARBITRUM]
    ),
    new BorrowingVault(
      Address.from('0xeF754bbDCcAdBc8DE1afc64796537D81d8C9cCeb'),
      WSTETH[ChainId.ARBITRUM],
      USDC[ChainId.ARBITRUM]
    ),
    //new BorrowingVault(
    //Address.from('0xe2A42570C5b0d764f615368A50bE40EfB5D91D9A'),
    //WETH9[ChainId.ARBITRUM],
    //USDT[ChainId.ARBITRUM]
    //),
    new BorrowingVault(
      Address.from('0x9E41477315c4045B129351428147761082762AEE'),
      RETH[ChainId.ARBITRUM],
      WETH9[ChainId.ARBITRUM]
    ),
    new BorrowingVault(
      Address.from('0x4DB1d229170417eDE991E20BE159C0847D67c9aD'),
      WSTETH[ChainId.ARBITRUM],
      WETH9[ChainId.ARBITRUM]
    ),
    new BorrowingVault(
      Address.from('0x30E214b05CdA6438ad35b2597130C338cA8AEF74'),
      WSTETH[ChainId.ARBITRUM],
      WETH9[ChainId.ARBITRUM]
    ),
  ],
  [ChainId.OPTIMISM]: [
    new LendingVault(
      Address.from('0x84cd7471D74b7D50c7eE67b443354593D5Bfc31C'),
      WETH9[ChainId.OPTIMISM]
    ),
    new LendingVault(
      Address.from('0xD21C55092E7D9599302Cb735117136C3dB1855b9'),
      USDC[ChainId.OPTIMISM]
    ),
    new LendingVault(
      Address.from('0x0C7C321e8F41018e93876f967f1Aa2667f9DEE2b'),
      USDT[ChainId.OPTIMISM]
    ),
    new LendingVault(
      Address.from('0xE8a2fcaC6f1CA5F5BafEe5f7bBE6020b1c489a72'),
      DAI[ChainId.OPTIMISM]
    ),
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
    new BorrowingVault(
      Address.from('0x24B76CD2693856FaDe3027c4cc69DaC9Fd6f71c4'),
      WSTETH[ChainId.OPTIMISM],
      USDC[ChainId.OPTIMISM]
    ),
    new BorrowingVault(
      Address.from('0xEaBDA502948192D8dF49AB91Fc278ec9C8C65ef8'),
      RETH[ChainId.OPTIMISM],
      USDC[ChainId.OPTIMISM]
    ),
    new BorrowingVault(
      Address.from('0x389f1739053D2273bAe38CBb878b938AF4cDfC85'),
      WSTETH[ChainId.OPTIMISM],
      WETH9[ChainId.OPTIMISM]
    ),
    new BorrowingVault(
      Address.from('0x0C6d8Acae1150B8D0bbb5972E46D7615f0B87a07'),
      RETH[ChainId.OPTIMISM],
      WETH9[ChainId.OPTIMISM]
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
    new LendingVault(
      Address.from('0xA55c0132903F1Ed2c756f31bCc9772fcCD0efaB2'),
      WETH9[ChainId.GNOSIS]
    ),
    new LendingVault(
      Address.from('0xfa813845CfA88EED4599670A6B63B0025FE2963b'),
      USDC[ChainId.GNOSIS]
    ),
    new LendingVault(
      Address.from('0x8696566396421016B1065ee6F2a3906c9D54de67'),
      WNATIVE[ChainId.GNOSIS]
    ),
    new LendingVault(
      Address.from('0x9f364Afe3d592B749404B21cCdC04A119a379528'),
      USDT[ChainId.GNOSIS]
    ),
    new BorrowingVault(
      Address.from('0x8bDdE35081db12e503F95D2263d9949f78393000'),
      WETH9[ChainId.GNOSIS],
      USDC[ChainId.GNOSIS]
    ),
    new BorrowingVault(
      Address.from('0xa99F739Bd55f95D4F0958B629d3522e64A282c7c'),
      WSTETH[ChainId.GNOSIS],
      GNO[ChainId.GNOSIS]
    ),
  ],
};
