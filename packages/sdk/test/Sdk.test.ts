import 'dotenv/config';

import { AddressZero } from '@ethersproject/constants';
import { formatUnits, parseUnits } from '@ethersproject/units';
import { BigNumber, utils, Wallet } from 'ethers';

import { NATIVE, USDC, WNATIVE } from '../src/constants';
import { Address, BorrowingVault, Token } from '../src/entities';
import { ChainId, RouterAction } from '../src/enums';
import { Sdk } from '../src/Sdk';
import {
  BorrowParams,
  ChainConfig,
  DepositParams,
  PermitParams,
  RouterActionParams,
} from '../src/types';

describe('Sdk', () => {
  const PRIVATE_KEY = process.env.PRIVATE_KEY ?? 'test test junk';

  const ADDRESS_ONE = Address.from(
    '0x0000000000000000000000000000000000000001'
  );
  //const ADDRESS_TWO = Address.from(
  //'0x0000000000000000000000000000000000000002'
  //);
  const ADDRESS_BOB = Address.from(
    '0x33A875bD262C5cACAa1245ed8AC9734973da6108'
  );

  const config: ChainConfig = {
    infuraId: process.env.INFURA_ID ?? '',
    alchemy: {
      420: process.env.ALCHEMY_ID_CHAIN_420,
    },
  };

  const sdk = new Sdk(config);

  describe('#getBalanceFor', () => {
    it('returns balance', async () => {
      const bal = await sdk.getBalanceFor(
        NATIVE[ChainId.ETHEREUM],
        ADDRESS_BOB
      );
      expect(parseFloat(formatUnits(bal))).toBeGreaterThan(0);
    });
  });

  describe('#getTokenBalancesFor', () => {
    it('returns multiple balances', async () => {
      const bals = await sdk.getTokenBalancesFor(
        [WNATIVE[ChainId.ETHEREUM], USDC[ChainId.ETHEREUM]],
        // vitalik.eth
        Address.from('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'),
        ChainId.ETHEREUM
      );
      bals.forEach((bal) => {
        expect(parseFloat(formatUnits(bal))).toBeGreaterThan(0);
      });
    });

    it('fails with tokens from different chains', async () => {
      await expect(
        async () =>
          await sdk.getTokenBalancesFor(
            [WNATIVE[ChainId.ETHEREUM], USDC[ChainId.GOERLI]],
            Address.from('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'),
            ChainId.ETHEREUM
          )
      ).rejects.toThrowError('Token from a different chain!');
    });

    it('fails when tokens and chain differ', async () => {
      await expect(
        async () =>
          await sdk.getTokenBalancesFor(
            [WNATIVE[ChainId.ETHEREUM], USDC[ChainId.ETHEREUM]],
            Address.from('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'),
            ChainId.GOERLI
          )
      ).rejects.toThrowError('Token from a different chain!');
    });
  });

  describe('#getBorrowingVaultFor', () => {
    it('returns a first vault from chainA based on an APR check', async () => {
      jest
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        .spyOn(Sdk.prototype as any, '_findVaultsByTokens')
        .mockImplementation(() => [
          new BorrowingVault(
            ADDRESS_ONE,
            WNATIVE[ChainId.GOERLI],
            USDC[ChainId.GOERLI]
          ),
          new BorrowingVault(
            ADDRESS_ONE,
            WNATIVE[ChainId.GOERLI],
            USDC[ChainId.GOERLI]
          ),
          new BorrowingVault(
            ADDRESS_ONE,
            WNATIVE[ChainId.OPTIMISM_GOERLI],
            USDC[ChainId.OPTIMISM_GOERLI]
          ),
        ]);

      jest
        .spyOn(BorrowingVault.prototype as BorrowingVault, 'getBorrowRate')
        .mockResolvedValueOnce(BigNumber.from(1))
        .mockResolvedValueOnce(BigNumber.from(2))
        .mockResolvedValueOnce(BigNumber.from(3));

      const collateralA = WNATIVE[ChainId.GOERLI];
      const debtB = USDC[ChainId.OPTIMISM_GOERLI];

      const vaults = await sdk.getBorrowingVaultsFor(collateralA, debtB);
      expect(vaults[0].chainId).toEqual(ChainId.GOERLI);
    });

    it('returns a first vault from chainB based on an APR check', async () => {
      jest
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        .spyOn(Sdk.prototype as any, '_findVaultsByTokens')
        .mockImplementation(() => [
          new BorrowingVault(
            ADDRESS_ONE,
            WNATIVE[ChainId.GOERLI],
            USDC[ChainId.GOERLI]
          ),
          new BorrowingVault(
            ADDRESS_ONE,
            WNATIVE[ChainId.GOERLI],
            USDC[ChainId.GOERLI]
          ),
          new BorrowingVault(
            ADDRESS_ONE,
            WNATIVE[ChainId.OPTIMISM_GOERLI],
            USDC[ChainId.OPTIMISM_GOERLI]
          ),
        ]);
      jest
        .spyOn(BorrowingVault.prototype as BorrowingVault, 'getBorrowRate')
        .mockResolvedValueOnce(BigNumber.from(3))
        .mockResolvedValueOnce(BigNumber.from(2))
        .mockResolvedValueOnce(BigNumber.from(1));

      const collateralA = WNATIVE[ChainId.GOERLI];
      const debtB = USDC[ChainId.OPTIMISM_GOERLI];

      const vaults = await sdk.getBorrowingVaultsFor(collateralA, debtB);
      expect(vaults[0].chainId).toEqual(ChainId.OPTIMISM_GOERLI);
    });

    it('returns a first vault from same chain although it is with the highest borrow rate', async () => {
      jest
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        .spyOn(Sdk.prototype as any, '_findVaultsByTokens')
        .mockImplementation(() => [
          new BorrowingVault(
            ADDRESS_ONE,
            WNATIVE[ChainId.OPTIMISM_GOERLI],
            USDC[ChainId.OPTIMISM_GOERLI]
          ),
          new BorrowingVault(
            ADDRESS_ONE,
            WNATIVE[ChainId.GOERLI],
            USDC[ChainId.GOERLI]
          ),
          new BorrowingVault(
            ADDRESS_ONE,
            WNATIVE[ChainId.GOERLI],
            USDC[ChainId.GOERLI]
          ),
        ]);
      jest
        .spyOn(BorrowingVault.prototype as BorrowingVault, 'getBorrowRate')
        .mockResolvedValueOnce(BigNumber.from(3))
        .mockResolvedValueOnce(BigNumber.from(2))
        .mockResolvedValueOnce(BigNumber.from(1));

      const collateralA = WNATIVE[ChainId.OPTIMISM_GOERLI];
      const debtB = USDC[ChainId.OPTIMISM_GOERLI];

      const vaults = await sdk.getBorrowingVaultsFor(collateralA, debtB);
      expect(vaults[0].chainId).toEqual(ChainId.OPTIMISM_GOERLI);
    });

    it('cannot find a vault', async () => {
      jest
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        .spyOn(Sdk.prototype as any, '_findVaultsByTokens')
        .mockImplementation(() => []);
      const collateral = WNATIVE[ChainId.GOERLI];
      const debt = new Token(ChainId.GOERLI, ADDRESS_BOB, 6, 'Bob');
      const vaults = await sdk.getBorrowingVaultsFor(collateral, debt);
      expect(vaults.length).toEqual(0);
    });
  });

  const depositActionParams: DepositParams = {
    action: RouterAction.DEPOSIT,
    vault: Address.from(AddressZero),
    amount: BigNumber.from(1),
    sender: Address.from(AddressZero),
    receiver: Address.from(AddressZero),
  };

  const borrowActionParams: BorrowParams = {
    action: RouterAction.BORROW,
    vault: Address.from(AddressZero),
    amount: BigNumber.from(1),
    receiver: Address.from(AddressZero),
    owner: Address.from(AddressZero),
  };

  const borrowPermitActionParams: PermitParams = {
    action: RouterAction.PERMIT_BORROW,
    vault: Address.from(AddressZero),
    amount: BigNumber.from(1),
    spender: Address.from(AddressZero),
    owner: Address.from(AddressZero),
  };

  const withdrawPermitActionParams: PermitParams = {
    action: RouterAction.PERMIT_BORROW,
    vault: Address.from(AddressZero),
    amount: BigNumber.from(1),
    spender: Address.from(AddressZero),
    owner: Address.from(AddressZero),
  };

  describe('#needSignature', () => {
    it('returns false with empty array', () => {
      expect(Sdk.needSignature([])).toBeFalsy();
    });

    it('returns false with simple array', () => {
      const actions: RouterActionParams[] = [
        depositActionParams,
        borrowActionParams,
      ];
      expect(Sdk.needSignature(actions)).toBeFalsy();
    });

    it('returns false with compound array', () => {
      const actions: (RouterActionParams | RouterActionParams[])[] = [
        depositActionParams,
        borrowActionParams,
        [depositActionParams, borrowActionParams],
      ];
      expect(Sdk.needSignature(actions)).toBeFalsy();
    });

    it('returns true with simple array for borrows', () => {
      const actions: RouterActionParams[] = [
        depositActionParams,
        borrowPermitActionParams,
        borrowActionParams,
      ];
      expect(Sdk.needSignature(actions)).toBeTruthy();
    });

    it('returns true with simple array for withdrawals', () => {
      const actions: RouterActionParams[] = [
        depositActionParams,
        withdrawPermitActionParams,
        borrowActionParams,
      ];
      expect(Sdk.needSignature(actions)).toBeTruthy();
    });

    it('returns true with compound array (permit in first level) for borrows', () => {
      const actions: (RouterActionParams | RouterActionParams[])[] = [
        depositActionParams,
        borrowPermitActionParams,
        borrowActionParams,
        [depositActionParams, borrowActionParams],
      ];
      expect(Sdk.needSignature(actions)).toBeTruthy();
    });

    it('returns true with compound array (permit in first level) for withdrawals', () => {
      const actions: (RouterActionParams | RouterActionParams[])[] = [
        depositActionParams,
        withdrawPermitActionParams,
        borrowActionParams,
        [depositActionParams, borrowActionParams],
      ];
      expect(Sdk.needSignature(actions)).toBeTruthy();
    });

    it('returns true with compound array (permit in second level) for borrows', () => {
      const actions: (RouterActionParams | RouterActionParams[])[] = [
        depositActionParams,
        borrowActionParams,
        [depositActionParams, borrowPermitActionParams, borrowActionParams],
      ];
      expect(Sdk.needSignature(actions)).toBeTruthy();
    });

    it('returns true with compound array (permit in second level) for withdrawals', () => {
      const actions: (RouterActionParams | RouterActionParams[])[] = [
        depositActionParams,
        borrowActionParams,
        [depositActionParams, withdrawPermitActionParams, borrowActionParams],
      ];
      expect(Sdk.needSignature(actions)).toBeTruthy();
    });

    it('returns true with compound array (permit in both levels)', () => {
      const actions: (RouterActionParams | RouterActionParams[])[] = [
        depositActionParams,
        borrowPermitActionParams,
        borrowActionParams,
        [depositActionParams, withdrawPermitActionParams, borrowActionParams],
      ];
      expect(Sdk.needSignature(actions)).toBeTruthy();
    });
  });

  //const deposit: DepositParams = {
  //action: RouterAction.DEPOSIT,
  //vault: vault.address,
  //amount: BigNumber.from(1),
  //sender: Address.from(owner.address),
  //receiver: Address.from(owner.address),
  //};
  //const permitBorrow: PermitParams = {
  //action: RouterAction.PERMIT_BORROW,
  //vault: vault.address,
  //amount: BigNumber.from(1),
  //owner: Address.from(owner.address),
  //spender: ADDRESS_TWO,
  //deadline: 24 * 60 * 60,
  //};
  //const borrow: BorrowParams = {
  //action: RouterAction.BORROW,
  //vault: vault.address,
  //amount: BigNumber.from(1),
  //receiver: Address.from(owner.address),
  //owner: Address.from(owner.address),
  //};
  describe('#getTxDetails', () => {
    it('signs a separate borrow permit', async () => {
      const vault = new BorrowingVault(
        Address.from('0xfF4606Aa93e576E61b473f4B11D3e32BB9ec63BB'),
        WNATIVE[ChainId.GOERLI],
        USDC[ChainId.GOERLI]
      ).setConnection(config);
      const owner = new Wallet(PRIVATE_KEY);

      const { actions } = sdk.previewDepositAndBorrow(
        vault,
        parseUnits('1'),
        parseUnits('1'),
        ChainId.GOERLI,
        ChainId.GOERLI,
        Address.from(owner.address)
      );

      const permitBorrow = actions.find(
        (a) => a.action === RouterAction.PERMIT_BORROW
      ) as PermitParams;
      const digest = await vault.signPermitFor(permitBorrow);

      const skey = new utils.SigningKey('0x' + PRIVATE_KEY);
      const signature = skey.signDigest(digest);
      sdk.getTxDetails(
        actions,
        ChainId.GOERLI,
        Address.from(owner.address),
        signature.compact
      );
    });
  });
});
