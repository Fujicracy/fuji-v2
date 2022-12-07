import 'dotenv/config';

import { AddressZero } from '@ethersproject/constants';
import { BigNumber } from 'ethers';

import { USDC, VAULT_LIST, WNATIVE } from '../../src/constants';
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
      const vault = VAULT_LIST[ChainId.GOERLI][0].setConnection(config);

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
        receiver: ADDRESS_TWO,
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
        '0xb4fafa4b87e1f8fdfae888fb531c450f5e53242d141373ec5518998445bfa035'
      );
    });

    it('signs a separate withdrawal permit', async () => {
      const params: PermitParams = {
        action: RouterAction.PERMIT_WITHDRAW,
        vault: Address.from(AddressZero),
        amount: BigNumber.from(1),
        receiver: ADDRESS_TWO,
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
        '0x7d1251df98cf427d302af373c5830e4376c37c6f66ee36a988a41c652a118973'
      );
    });

    it('signs two permits and incrments nonce', async () => {
      const borrowParams: PermitParams = {
        action: RouterAction.PERMIT_BORROW,
        vault: Address.from(AddressZero),
        amount: BigNumber.from(1),
        receiver: ADDRESS_TWO,
        owner: ADDRESS_ONE,
        deadline: 24 * 60 * 60,
      };
      const withdrawParams: PermitParams = {
        action: RouterAction.PERMIT_WITHDRAW,
        vault: Address.from(AddressZero),
        amount: BigNumber.from(1),
        receiver: ADDRESS_TWO,
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
        '0xb4fafa4b87e1f8fdfae888fb531c450f5e53242d141373ec5518998445bfa035'
      );

      const { digest: digestWithdraw } = await vault.signPermitFor(
        withdrawParams
      );
      expect(digestWithdraw).toEqual(
        '0x7d1251df98cf427d302af373c5830e4376c37c6f66ee36a988a41c652a118973'
      );
    });
  });
});
