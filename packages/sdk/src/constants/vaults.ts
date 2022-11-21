import { Address, BorrowingVault } from '../entities';
import { ChainId } from '../enums';
import { ChainVaultList } from '../types';
import { DAI, USDC, USDT, WNATIVE } from './tokens';

export const VAULT_LIST: ChainVaultList = {
  [ChainId.ETHEREUM]: [],
  [ChainId.GOERLI]: [
    new BorrowingVault(
      Address.from('0xa11c1C510a316377702D8f8F8f1aEacfB42D8944'),
      WNATIVE[ChainId.GOERLI],
      DAI[ChainId.GOERLI]
    ),
  ],
  [ChainId.MATIC]: [],
  [ChainId.MATIC_MUMBAI]: [
    new BorrowingVault(
      Address.from('0xCA7Ac57Caec6381a45e1e4E0329DEbA430209575'),
      WNATIVE[ChainId.MATIC_MUMBAI],
      DAI[ChainId.MATIC_MUMBAI]
    ),
    new BorrowingVault(
      Address.from('0x57bfAc279472472eB4a4826cB425c85A2E7c23fd'),
      WNATIVE[ChainId.MATIC_MUMBAI],
      USDC[ChainId.MATIC_MUMBAI]
    ),
    new BorrowingVault(
      Address.from('0x702eb2acD65bE65C75289ad95332bB6267F01d0C'),
      WNATIVE[ChainId.MATIC_MUMBAI],
      USDT[ChainId.MATIC_MUMBAI]
    ),
  ],
  [ChainId.FANTOM]: [],
  [ChainId.ARBITRUM]: [],
  [ChainId.OPTIMISM]: [],
  [ChainId.OPTIMISM_GOERLI]: [
    new BorrowingVault(
      Address.from('0xC69176FADFeF7A1570540a99Faf827b3138659D1'),
      WNATIVE[ChainId.OPTIMISM_GOERLI],
      DAI[ChainId.OPTIMISM_GOERLI]
    ),
    new BorrowingVault(
      Address.from('0x144B88F20eACe4000a46649843Fe8327b4e5Fd3e'),
      WNATIVE[ChainId.OPTIMISM_GOERLI],
      USDC[ChainId.OPTIMISM_GOERLI]
    ),
    new BorrowingVault(
      Address.from('0x96ea8dF41134b77649E8bC785be4dEEB450A948f'),
      WNATIVE[ChainId.OPTIMISM_GOERLI],
      USDT[ChainId.OPTIMISM_GOERLI]
    ),
  ],
};
