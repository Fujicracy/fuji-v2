import 'dotenv/config';

import { AddressZero } from '@ethersproject/constants';
import { BigNumber } from 'ethers';

import { USDC, WNATIVE } from '../../src/constants';
import { Address, BorrowingVault } from '../../src/entities';
import { ChainId, RouterAction } from '../../src/enums';
import { ChainConfig, PermitParams } from '../../src/types';

const config: ChainConfig = {
  infuraId: process.env.INFURA_ID ?? '',
  alchemy: {
    420: process.env.ALCHEMY_ID_CHAIN_420,
  },
};

describe('BorrowingVault', () => {
  const ADDRESS_ONE = Address.from(
    '0x0000000000000000000000000000000000000001'
  );
  const ADDRESS_TWO = Address.from(
    '0x0000000000000000000000000000000000000002'
  );

  describe('#getProviders', () => {
    it('fetches providers and borrowRate', async () => {
      const vault = new BorrowingVault(
        Address.from('0xfF4606Aa93e576E61b473f4B11D3e32BB9ec63BB'),
        WNATIVE[ChainId.GOERLI],
        USDC[ChainId.GOERLI]
      ).setConnection(config);

      const providers = await vault.getProviders();
      expect(providers).toBeTruthy();
    });
  });

  describe('#signPermitFor', () => {
    it('signs a separate borrow permit', async () => {
      const params: PermitParams = {
        action: RouterAction.PERMIT_BORROW,
        vault: Address.from(AddressZero),
        amount: BigNumber.from(1),
        spender: ADDRESS_TWO,
        owner: ADDRESS_ONE,
        deadline: 24 * 60 * 60,
      };

      const vault = new BorrowingVault(
        Address.from('0xfF4606Aa93e576E61b473f4B11D3e32BB9ec63BB'),
        WNATIVE[ChainId.GOERLI],
        USDC[ChainId.GOERLI]
      ).setConnection(config);

      const { digest } = await vault.signPermitFor(params);
      expect(digest).toEqual(
        '0x194a90fe3d33fe2643bce3659ccd2ac8ee1eeaa63b4f1954a35f3eebbbb232b0'
      );
    });

    it('signs a separate withdrawal permit', async () => {
      const params: PermitParams = {
        action: RouterAction.PERMIT_WITHDRAW,
        vault: Address.from(AddressZero),
        amount: BigNumber.from(1),
        spender: ADDRESS_TWO,
        owner: ADDRESS_ONE,
        deadline: 24 * 60 * 60,
      };

      const vault = new BorrowingVault(
        Address.from('0xfF4606Aa93e576E61b473f4B11D3e32BB9ec63BB'),
        WNATIVE[ChainId.GOERLI],
        USDC[ChainId.GOERLI]
      ).setConnection(config);

      const { digest } = await vault.signPermitFor(params);
      expect(digest).toEqual(
        '0x9a7fbfae8f9e80e022f93fd7da27509378374fcee6527c2e04494eae972c04f3'
      );
    });

    it('signs two permits and incrments nonce', async () => {
      const borrowParams: PermitParams = {
        action: RouterAction.PERMIT_BORROW,
        vault: Address.from(AddressZero),
        amount: BigNumber.from(1),
        spender: ADDRESS_TWO,
        owner: ADDRESS_ONE,
        deadline: 24 * 60 * 60,
      };
      const withdrawParams: PermitParams = {
        action: RouterAction.PERMIT_WITHDRAW,
        vault: Address.from(AddressZero),
        amount: BigNumber.from(1),
        spender: ADDRESS_TWO,
        owner: ADDRESS_ONE,
        deadline: 24 * 60 * 60,
      };

      const vault = new BorrowingVault(
        Address.from('0xfF4606Aa93e576E61b473f4B11D3e32BB9ec63BB'),
        WNATIVE[ChainId.GOERLI],
        USDC[ChainId.GOERLI]
      ).setConnection(config);

      const { digest: digestBorrow } = await vault.signPermitFor(borrowParams);
      expect(digestBorrow).toEqual(
        '0x194a90fe3d33fe2643bce3659ccd2ac8ee1eeaa63b4f1954a35f3eebbbb232b0'
      );

      const { digest: digestWithdraw } = await vault.signPermitFor(
        withdrawParams
      );
      expect(digestWithdraw).toEqual(
        '0xebe476294730b15271b46248a4c6e41448357e0293b7a37ed46bb6d64f2b0103'
      );
    });
  });
});
