import 'dotenv/config';

import { AddressZero } from '@ethersproject/constants';
import { formatUnits, parseUnits } from '@ethersproject/units';
import { BigNumber, utils, Wallet } from 'ethers';

import { DAI, NATIVE, USDC, VAULT_LIST, WNATIVE } from '../src/constants';
import { Address, BorrowingVault, Token } from '../src/entities';
import { ChainId, RouterAction } from '../src/enums';
import { Sdk } from '../src/Sdk';
import {
  BorrowParams,
  ChainConfig,
  DepositParams,
  PermitParams,
  RouterActionParams,
  XTransferWithCallParams,
} from '../src/types';

describe('Sdk', () => {
  const JUNK_KEY =
    '911ced1110f043fdfa439651a2e782ac13e188556d5b8658fd121adce4afff98';
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

  const deposit: DepositParams = {
    action: RouterAction.DEPOSIT,
    vault: Address.from(AddressZero),
    amount: BigNumber.from(1),
    sender: Address.from(AddressZero),
    receiver: Address.from(AddressZero),
  };

  const borrow: BorrowParams = {
    action: RouterAction.BORROW,
    vault: Address.from(AddressZero),
    amount: BigNumber.from(1),
    receiver: Address.from(AddressZero),
    owner: Address.from(AddressZero),
  };

  const borrowPermit: PermitParams = {
    action: RouterAction.PERMIT_BORROW,
    vault: Address.from(AddressZero),
    amount: BigNumber.from(1),
    receiver: Address.from(AddressZero),
    owner: Address.from(AddressZero),
  };

  const withdrawPermit: PermitParams = {
    action: RouterAction.PERMIT_WITHDRAW,
    vault: Address.from(AddressZero),
    amount: BigNumber.from(1),
    receiver: Address.from(AddressZero),
    owner: Address.from(AddressZero),
  };

  describe('#needSignature', () => {
    it('returns false with empty array', () => {
      expect(Sdk.needSignature([])).toBeFalsy();
    });

    it('returns false with simple array', () => {
      const actions: RouterActionParams[] = [deposit, borrow];
      expect(Sdk.needSignature(actions)).toBeFalsy();
    });

    it('returns false with compound array', () => {
      const actions: RouterActionParams[] = [
        {
          action: RouterAction.X_TRANSFER_WITH_CALL,
          asset: Address.from(AddressZero),
          destDomain: 1,
          amount: BigNumber.from(1),
          slippage: 0,
          innerActions: [deposit, borrow],
        },
      ];
      expect(Sdk.needSignature(actions)).toBeFalsy();
    });

    it('returns true with simple array for borrows', () => {
      const actions: RouterActionParams[] = [deposit, borrowPermit, borrow];
      expect(Sdk.needSignature(actions)).toBeTruthy();
    });

    it('returns true with simple array for withdrawals', () => {
      const actions: RouterActionParams[] = [deposit, withdrawPermit, borrow];
      expect(Sdk.needSignature(actions)).toBeTruthy();
    });

    it('returns true with compound array (permit in first level) for borrows', () => {
      const actions: RouterActionParams[] = [
        deposit,
        borrowPermit,
        borrow,
        {
          action: RouterAction.X_TRANSFER_WITH_CALL,
          asset: Address.from(AddressZero),
          destDomain: 1,
          amount: BigNumber.from(1),
          slippage: 0,
          innerActions: [deposit, borrow],
        },
      ];
      expect(Sdk.needSignature(actions)).toBeTruthy();
    });

    it('returns true with compound array (permit in first level) for withdrawals', () => {
      const actions: RouterActionParams[] = [
        deposit,
        withdrawPermit,
        borrow,
        {
          action: RouterAction.X_TRANSFER_WITH_CALL,
          asset: Address.from(AddressZero),
          destDomain: 1,
          amount: BigNumber.from(1),
          slippage: 0,
          innerActions: [deposit, borrow],
        },
      ];
      expect(Sdk.needSignature(actions)).toBeTruthy();
    });

    it('returns true with compound array (permit in second level) for borrows', () => {
      const actions: RouterActionParams[] = [
        deposit,
        borrow,
        {
          action: RouterAction.X_TRANSFER_WITH_CALL,
          asset: Address.from(AddressZero),
          destDomain: 1,
          amount: BigNumber.from(1),
          slippage: 0,
          innerActions: [deposit, borrowPermit, borrow],
        },
      ];
      expect(Sdk.needSignature(actions)).toBeTruthy();
    });

    it('returns true with compound array (permit in second level) for withdrawals', () => {
      const actions: RouterActionParams[] = [
        deposit,
        borrow,
        {
          action: RouterAction.X_TRANSFER_WITH_CALL,
          asset: Address.from(AddressZero),
          destDomain: 1,
          amount: BigNumber.from(1),
          slippage: 0,
          innerActions: [deposit, withdrawPermit, borrow],
        },
      ];
      expect(Sdk.needSignature(actions)).toBeTruthy();
    });

    it('returns true with compound array (permit in both levels)', () => {
      const actions: RouterActionParams[] = [
        deposit,
        borrowPermit,
        borrow,
        {
          action: RouterAction.X_TRANSFER_WITH_CALL,
          asset: Address.from(AddressZero),
          destDomain: 1,
          amount: BigNumber.from(1),
          slippage: 0,
          innerActions: [deposit, withdrawPermit, borrow],
        },
      ];
      expect(Sdk.needSignature(actions)).toBeTruthy();
    });
  });

  describe('#getTxDetails', () => {
    it('returns a NON cross-chain calldata for TrasactionRequest', async () => {
      const vault = VAULT_LIST[ChainId.GOERLI][0].setConnection(config);

      const owner = new Wallet(JUNK_KEY);

      const { actions } = await sdk.previewDepositAndBorrow(
        vault,
        parseUnits('1'),
        parseUnits('1'),
        WNATIVE[ChainId.GOERLI],
        DAI[ChainId.GOERLI],
        Address.from(owner.address),
        123456789
      );

      const permitBorrow = actions.find(
        (a) => a.action === RouterAction.PERMIT_BORROW
      ) as PermitParams;
      const { digest } = await vault.signPermitFor(permitBorrow);

      const skey = new utils.SigningKey(`0x${JUNK_KEY}`);
      const signature = skey.signDigest(digest);
      const { data } = sdk.getTxDetails(
        actions,
        ChainId.GOERLI,
        Address.from(owner.address),
        signature
      );
      expect(data).toEqual(
        '0xa3fb20f4000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000000000000000000000000080000000000000000000000000d08b093b4804dec9af22f70bc35e8e132106b5c20000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000007f45cd7792c32bacf461d02d110d9025655fb6b70000000000000000000000007f45cd7792c32bacf461d02d110d9025655fb6b70000000000000000000000000000000000000000000000000000000000000100000000000000000000000000d08b093b4804dec9af22f70bc35e8e132106b5c20000000000000000000000007f45cd7792c32bacf461d02d110d9025655fb6b70000000000000000000000007f45cd7792c32bacf461d02d110d9025655fb6b70000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000075bcd15000000000000000000000000000000000000000000000000000000000000001cde4b708de6561e2d4f1da3a035813221b46c1118af7921f2e123cd2a50aabf98184b4973fdfbda7bf13e6db8cbf7e26cca4fd1e5cc932de6d5a0b0b528ed0a8a0000000000000000000000000000000000000000000000000000000000000080000000000000000000000000d08b093b4804dec9af22f70bc35e8e132106b5c20000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000007f45cd7792c32bacf461d02d110d9025655fb6b70000000000000000000000007f45cd7792c32bacf461d02d110d9025655fb6b7'
      );
    });

    it('returns a cross-chain calldata for TrasactionRequest (deposit+borrow on chain A and transfer to chain B)', async () => {
      const vault = VAULT_LIST[ChainId.GOERLI][0].setConnection(config);

      const owner = new Wallet(JUNK_KEY);

      const { actions } = await sdk.previewDepositAndBorrow(
        vault,
        parseUnits('1'),
        parseUnits('1'),
        WNATIVE[ChainId.GOERLI],
        DAI[ChainId.OPTIMISM_GOERLI],
        Address.from(owner.address),
        123456789
      );

      const permitBorrow = actions.find(
        (a) => a.action === RouterAction.PERMIT_BORROW
      ) as PermitParams;
      const { digest } = await vault.signPermitFor(permitBorrow);

      const skey = new utils.SigningKey(`0x${JUNK_KEY}`);
      const signature = skey.signDigest(digest);
      const { data } = sdk.getTxDetails(
        actions,
        ChainId.GOERLI,
        Address.from(owner.address),
        signature
      );
      expect(data).toEqual(
        '0xa3fb20f4000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000024000000000000000000000000000000000000000000000000000000000000002e00000000000000000000000000000000000000000000000000000000000000080000000000000000000000000d08b093b4804dec9af22f70bc35e8e132106b5c20000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000007f45cd7792c32bacf461d02d110d9025655fb6b70000000000000000000000007f45cd7792c32bacf461d02d110d9025655fb6b70000000000000000000000000000000000000000000000000000000000000100000000000000000000000000d08b093b4804dec9af22f70bc35e8e132106b5c20000000000000000000000007f45cd7792c32bacf461d02d110d9025655fb6b70000000000000000000000007f45cd7792c32bacf461d02d110d9025655fb6b70000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000075bcd15000000000000000000000000000000000000000000000000000000000000001c49b46803d5aab48a622dcfd7a2dafc7a9187da6a959c5e8c083a7df3934b062c4280b66c80046a4e446449a59b63fbc616ef1b8ff0d2cd9c453c417919d207870000000000000000000000000000000000000000000000000000000000000080000000000000000000000000d08b093b4804dec9af22f70bc35e8e132106b5c20000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000007f45cd7792c32bacf461d02d110d9025655fb6b70000000000000000000000007f45cd7792c32bacf461d02d110d9025655fb6b700000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000676f7074000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000918cfff6ab82f5a28623b08babd2893963a27aac0000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000007f45cd7792c32bacf461d02d110d9025655fb6b7'
      );
    });

    it('returns a cross-chain calldata for TrasactionRequest (transfer from chain A and deposit+borrow on chain B)', async () => {
      const vault =
        VAULT_LIST[ChainId.OPTIMISM_GOERLI][0].setConnection(config);

      const owner = new Wallet(JUNK_KEY);

      const { actions } = await sdk.previewDepositAndBorrow(
        vault,
        parseUnits('1'),
        parseUnits('1'),
        WNATIVE[ChainId.GOERLI],
        DAI[ChainId.OPTIMISM_GOERLI],
        Address.from(owner.address),
        123456789
      );
      const innerActions = (actions[0] as XTransferWithCallParams).innerActions;

      const permitBorrow = innerActions.find(
        (a) => a.action === RouterAction.PERMIT_BORROW
      ) as PermitParams;
      const { digest } = await vault.signPermitFor(permitBorrow);

      const skey = new utils.SigningKey(`0x${JUNK_KEY}`);
      const signature = skey.signDigest(digest);
      const { data } = sdk.getTxDetails(
        actions,
        ChainId.GOERLI,
        Address.from(owner.address),
        signature
      );
      expect(data).toEqual(
        '0xa3fb20f4000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000900000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000046000000000000000000000000000000000000000000000000000000000676f7074000000000000000000000000000000000000000000000000000000000000001e0000000000000000000000007ea6ea49b0b0ae9c5db7907d139d9cd3439862a10000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000003a0000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000000000000000000000000080000000000000000000000000f5a39de230ca0dad78534d83f0ea1f8b2a4fc6220000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000007f45cd7792c32bacf461d02d110d9025655fb6b7000000000000000000000000d8863e338cf07460c70daa7bb8ea1f9758569b450000000000000000000000000000000000000000000000000000000000000100000000000000000000000000f5a39de230ca0dad78534d83f0ea1f8b2a4fc6220000000000000000000000007f45cd7792c32bacf461d02d110d9025655fb6b70000000000000000000000007f45cd7792c32bacf461d02d110d9025655fb6b70000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000075bcd15000000000000000000000000000000000000000000000000000000000000001bfe5376505c390e2c213d3b759ba07cc1c40a58452b8472158c86d764d58acf1c64ccafaa19d3cca07d5262efd1c117261c0ae0e0a5c9ac8369b32a6de2e622340000000000000000000000000000000000000000000000000000000000000080000000000000000000000000f5a39de230ca0dad78534d83f0ea1f8b2a4fc6220000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000007f45cd7792c32bacf461d02d110d9025655fb6b70000000000000000000000007f45cd7792c32bacf461d02d110d9025655fb6b7'
      );
    });
  });
});
