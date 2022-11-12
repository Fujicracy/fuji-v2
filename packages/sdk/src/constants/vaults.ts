import { Address, BorrowingVault } from '../entities';
import { ChainId } from '../enums';
import { ChainVaultList } from '../types';
import { DAI, USDC, USDT, WETH9, WNATIVE } from './tokens';

export const VAULT_LIST: ChainVaultList = {
  [ChainId.ETHEREUM]: [],
  [ChainId.GOERLI]: [
    new BorrowingVault(
      Address.from('0xfF4606Aa93e576E61b473f4B11D3e32BB9ec63BB'),
      WNATIVE[ChainId.GOERLI],
      USDC[ChainId.GOERLI]
    ),
  ],
  [ChainId.MATIC]: [],
  [ChainId.MATIC_MUMBAI]: [
    new BorrowingVault(
      Address.from('0xf7AADD07065FCDf32E00eE0872c5e132bcD319DB'),
      WETH9[ChainId.MATIC_MUMBAI],
      DAI[ChainId.MATIC_MUMBAI]
    ),
    new BorrowingVault(
      Address.from('0x25a8870a15B37BBD21021646AA5E67bE31efdBd1'),
      WNATIVE[ChainId.MATIC_MUMBAI],
      USDC[ChainId.MATIC_MUMBAI]
    ),
    new BorrowingVault(
      Address.from('0x7444CD9C5A5BFe507C0e73Cd46be1E99001C2303'),
      WNATIVE[ChainId.MATIC_MUMBAI],
      USDT[ChainId.MATIC_MUMBAI]
    ),
  ],
  [ChainId.FANTOM]: [],
  [ChainId.ARBITRUM]: [],
  [ChainId.OPTIMISM]: [],
  [ChainId.OPTIMISM_GOERLI]: [
    new BorrowingVault(
      Address.from('0x62fd5C9A82991CDc522e4E748A9188E7B3DC7872'),
      WNATIVE[ChainId.OPTIMISM_GOERLI],
      DAI[ChainId.OPTIMISM_GOERLI]
    ),
    new BorrowingVault(
      Address.from('0xBd4153f9757a76a0f0eaeFBAe326aCc6790b2137'),
      WNATIVE[ChainId.OPTIMISM_GOERLI],
      USDC[ChainId.OPTIMISM_GOERLI]
    ),
  ],
};
