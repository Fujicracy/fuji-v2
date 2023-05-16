import 'dotenv/config';

import { AddressZero } from '@ethersproject/constants';
import { formatUnits, parseUnits } from '@ethersproject/units';
import { BigNumber, utils, Wallet } from 'ethers';

import { NATIVE, USDC, VAULT_LIST, WETH9, WNATIVE } from '../src/constants';
import { Address, BorrowingVault } from '../src/entities';
import { ChainId, PreviewName, RouterAction } from '../src/enums';
import * as batchLoad from '../src/functions/batchLoad';
import { Sdk } from '../src/Sdk';
import {
  BorrowParams,
  ChainConfig,
  DepositParams,
  PermitParams,
  RouterActionParams,
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
      const bals = await sdk.getBalancesFor(
        [WNATIVE[ChainId.ETHEREUM], USDC[ChainId.ETHEREUM]],
        // vitalik.eth
        Address.from('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'),
        ChainId.ETHEREUM
      );
      expect(bals.success).toBeTruthy();
      if (!bals.success) return;

      bals.data.forEach((bal) => {
        expect(parseFloat(formatUnits(bal))).toBeGreaterThan(0);
      });
    });

    it('fails with tokens from different chains', async () => {
      const result = await sdk.getBalancesFor(
        [WNATIVE[ChainId.ETHEREUM], USDC[ChainId.MATIC]],
        Address.from('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'),
        ChainId.ETHEREUM
      );
      expect(result.success).toBeFalsy();
      if (result.success) return;
      expect(result.error.message).toEqual('Currency from a different chain!');
    });

    it('fails when tokens and chain differ', async () => {
      const result = await sdk.getBalancesFor(
        [WNATIVE[ChainId.ETHEREUM], USDC[ChainId.ETHEREUM]],
        Address.from('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'),
        ChainId.MATIC
      );
      expect(result.success).toBeFalsy();
      if (result.success) return;
      expect(result.error.message).toEqual('Currency from a different chain!');
    });
  });

  describe('#getBorrowingVaultFor', () => {
    it('returns a first vault from chainA based on an APR check', async () => {
      const vaults = [
        new BorrowingVault(
          ADDRESS_ONE,
          WNATIVE[ChainId.MATIC],
          USDC[ChainId.MATIC]
        ),
        new BorrowingVault(
          ADDRESS_ONE,
          WNATIVE[ChainId.MATIC],
          USDC[ChainId.MATIC]
        ),
        new BorrowingVault(
          ADDRESS_ONE,
          WNATIVE[ChainId.OPTIMISM],
          USDC[ChainId.OPTIMISM]
        ),
      ];
      const financials = vaults.map((vault, i) => ({
        vault,
        activeProvider: {
          borrowAprBase: BigNumber.from(i + 1),
        },
      }));
      jest
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        .spyOn(Sdk.prototype as any, '_findVaultsByTokens')
        .mockImplementation(() => vaults);
      jest
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        .spyOn(batchLoad as any, 'batchLoad')
        .mockImplementation(() => ({ success: true, data: financials }));

      const collateralA = WNATIVE[ChainId.MATIC];
      const debtB = USDC[ChainId.OPTIMISM];

      const result = await sdk.getBorrowingVaultsFor(collateralA, debtB);
      expect(result.success).toBeTruthy();
      if (!result.success) return;

      expect(result.data[0].vault.chainId).toEqual(ChainId.MATIC);
    });

    it('returns a first vault from chainB based on an APR check', async () => {
      const vaults = [
        new BorrowingVault(
          ADDRESS_ONE,
          WNATIVE[ChainId.MATIC],
          USDC[ChainId.MATIC]
        ),
        new BorrowingVault(
          ADDRESS_ONE,
          WNATIVE[ChainId.MATIC],
          USDC[ChainId.MATIC]
        ),
        new BorrowingVault(
          ADDRESS_ONE,
          WNATIVE[ChainId.OPTIMISM],
          USDC[ChainId.OPTIMISM]
        ),
      ];
      const financials = vaults.map((vault, i) => ({
        vault,
        activeProvider: {
          borrowAprBase: BigNumber.from(3 - i),
        },
      }));
      jest
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        .spyOn(Sdk.prototype as any, '_findVaultsByTokens')
        .mockImplementation(() => vaults);
      jest
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        .spyOn(batchLoad as any, 'batchLoad')
        .mockImplementation(() => ({ success: true, data: financials }));

      const collateralA = WNATIVE[ChainId.MATIC];
      const debtB = USDC[ChainId.OPTIMISM];

      const result = await sdk.getBorrowingVaultsFor(collateralA, debtB);
      expect(result.success).toBeTruthy();
      if (!result.success) return;
      expect(result.data[0].vault.chainId).toEqual(ChainId.OPTIMISM);
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
    jest.setTimeout(20000);

    it('returns a NON cross-chain calldata for TrasactionRequest', async () => {
      const vault = VAULT_LIST[ChainId.MATIC][0].setConnection(config);

      const owner = new Wallet(JUNK_KEY);

      const preview = await sdk.previews.get({
        name: PreviewName.DEPOSIT_AND_BORROW,
        vault,
        srcChainId: ChainId.MATIC,
        amountIn: parseUnits('1'),
        amountOut: parseUnits('1', 6),
        tokenIn: WETH9[ChainId.MATIC],
        tokenOut: USDC[ChainId.MATIC],
        account: Address.from(owner.address),
      });

      expect(preview.success).toBeTruthy();
      if (!preview.success) return;
      const { actions } = preview.data;
      const permitBorrow = actions.find(
        (a) => a.action === RouterAction.PERMIT_BORROW
      ) as PermitParams;
      const { digest } = await vault.signPermitFor(permitBorrow);

      const skey = new utils.SigningKey(`0x${JUNK_KEY}`);
      const signature = skey.signDigest(digest);
      const result = sdk.getTxDetails(
        actions,
        ChainId.MATIC,
        Address.from(owner.address),
        signature
      );
      expect(result.success).toBeTruthy();
      if (!result.success) return;
      const { data } = result.data;
      expect(data).toBeTruthy();
    });

    it('returns a cross-chain calldata for TrasactionRequest (deposit+borrow on chain A and transfer to chain B)', async () => {
      const vault = new BorrowingVault(
        Address.from('0x653D89d7548EB859f86Ab9011f7B960d52910Abf'),
        USDC[ChainId.MATIC],
        WETH9[ChainId.MATIC]
      ).setConnection(config);

      const owner = new Wallet(JUNK_KEY);

      const preview = await sdk.previews.get({
        name: PreviewName.DEPOSIT_AND_BORROW,
        vault,
        srcChainId: ChainId.OPTIMISM,
        amountOut: parseUnits('1'),
        amountIn: parseUnits('1', 6),
        tokenOut: WETH9[ChainId.MATIC],
        tokenIn: USDC[ChainId.OPTIMISM],
        account: Address.from(owner.address),
      });

      expect(preview.success).toBeTruthy();
      if (!preview.success) return;
      const { actions } = preview.data;

      const permitBorrow = Sdk.findPermitAction(actions) as PermitParams;
      const { digest } = await vault.signPermitFor(permitBorrow);

      const skey = new utils.SigningKey(`0x${JUNK_KEY}`);
      const signature = skey.signDigest(digest);
      const result = sdk.getTxDetails(
        actions,
        ChainId.MATIC,
        Address.from(owner.address),
        signature
      );
      expect(result.success).toBeTruthy();
      if (!result.success) return;
      const { data } = result.data;
      expect(data).toBeTruthy();
    });

    it('returns a cross-chain calldata for TrasactionRequest (transfer from chain A and deposit+borrow on chain B)', async () => {
      const vault = VAULT_LIST[ChainId.OPTIMISM][0].setConnection(config);

      const owner = new Wallet(JUNK_KEY);

      const preview = await sdk.previews.get({
        name: PreviewName.DEPOSIT_AND_BORROW,
        vault,
        srcChainId: ChainId.OPTIMISM,
        amountOut: parseUnits('1'),
        amountIn: parseUnits('1', 6),
        tokenOut: WETH9[ChainId.MATIC],
        tokenIn: USDC[ChainId.OPTIMISM],
        account: Address.from(owner.address),
      });

      expect(preview.success).toBeTruthy();
      if (!preview.success) return;
      const { actions } = preview.data;

      const permitBorrow = Sdk.findPermitAction(actions) as PermitParams;
      const { digest } = await vault.signPermitFor(permitBorrow);

      const skey = new utils.SigningKey(`0x${JUNK_KEY}`);
      const signature = skey.signDigest(digest);
      const result = sdk.getTxDetails(
        actions,
        ChainId.MATIC,
        Address.from(owner.address),
        signature
      );
      expect(result.success).toBeTruthy();
      if (!result.success) return;
      const { data } = result.data;
      expect(data).toBeTruthy();
    });
  });
});
