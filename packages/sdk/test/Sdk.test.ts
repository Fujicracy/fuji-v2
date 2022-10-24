import 'dotenv/config';

import { formatUnits } from '@ethersproject/units';
import { BigNumber } from 'ethers';

import { NATIVE, USDC, WNATIVE } from '../src/constants';
import { Address, BorrowingVault, Token } from '../src/entities';
import { ChainId } from '../src/enums';
import { Sdk } from '../src/Sdk';

describe('Sdk', () => {
  const ADDRESS_ONE = Address.from(
    '0x0000000000000000000000000000000000000001'
  );
  //const ADDRESS_TWO = Address.from(
  //'0x0000000000000000000000000000000000000002'
  //);
  const ADDRESS_BOB = Address.from(
    '0x33A875bD262C5cACAa1245ed8AC9734973da6108'
  );

  const sdk = new Sdk({
    infuraId: process.env.INFURA_ID ?? '',
    alchemy: {
      420: process.env.ALCHEMY_ID_CHAIN_420,
    },
  });

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
      bals.forEach(bal => {
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
    it('returns a vault from the same chain', async () => {
      const collateral = WNATIVE[ChainId.GOERLI];
      const debt = USDC[ChainId.GOERLI];
      const vault = await sdk.getBorrowingVaultFor(collateral, debt);
      expect(vault?.chainId).toEqual(ChainId.GOERLI);
    });

    it('returns a vault from chainA based on an APR check', async () => {
      jest
        .spyOn(BorrowingVault.prototype as BorrowingVault, 'getBorrowRate')
        .mockResolvedValueOnce(BigNumber.from(1))
        .mockResolvedValueOnce(BigNumber.from(2));

      const collateralA = WNATIVE[ChainId.GOERLI];
      const debtB = USDC[ChainId.OPTIMISM_GOERLI];

      const vault = await sdk.getBorrowingVaultFor(collateralA, debtB);
      expect(vault?.chainId).toEqual(ChainId.GOERLI);
    });

    it('returns a vault from chainB based on an APR check', async () => {
      jest
        .spyOn(BorrowingVault.prototype as BorrowingVault, 'getBorrowRate')
        .mockResolvedValueOnce(BigNumber.from(2))
        .mockResolvedValueOnce(BigNumber.from(1));

      const collateralA = WNATIVE[ChainId.GOERLI];
      const debtB = USDC[ChainId.OPTIMISM_GOERLI];

      const vault = await sdk.getBorrowingVaultFor(collateralA, debtB);
      expect(vault?.chainId).toEqual(ChainId.OPTIMISM_GOERLI);
    });

    it('returns a vault from chainA because it does not exist on chainB', async () => {
      const collateralA = WNATIVE[ChainId.GOERLI];
      const debtB = USDC[ChainId.OPTIMISM_GOERLI];
      const vaultA = new BorrowingVault(
        ADDRESS_ONE,
        collateralA,
        USDC[ChainId.GOERLI]
      );

      jest
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        .spyOn(Sdk.prototype as any, '_findVaultByTokenSymbol')
        .mockImplementation(chainId =>
          chainId === ChainId.GOERLI ? vaultA : undefined
        );

      const vault = await sdk.getBorrowingVaultFor(collateralA, debtB);
      expect(vault?.chainId).toEqual(ChainId.GOERLI);
    });

    it('returns a vault from chainB because it does not exist on chainA', async () => {
      const collateralA = WNATIVE[ChainId.GOERLI];
      const debtB = USDC[ChainId.OPTIMISM_GOERLI];
      const vaultB = new BorrowingVault(
        ADDRESS_ONE,
        WNATIVE[ChainId.OPTIMISM_GOERLI],
        debtB
      );

      jest
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        .spyOn(Sdk.prototype as any, '_findVaultByTokenSymbol')
        .mockImplementation(chainId =>
          chainId === ChainId.OPTIMISM_GOERLI ? vaultB : undefined
        );

      const vault = await sdk.getBorrowingVaultFor(collateralA, debtB);
      expect(vault?.chainId).toEqual(ChainId.OPTIMISM_GOERLI);
    });

    it('cannot find a vault', async () => {
      const collateral = WNATIVE[ChainId.GOERLI];
      const debt = new Token(ChainId.GOERLI, ADDRESS_BOB, 6, 'Bob');
      const vault = await sdk.getBorrowingVaultFor(collateral, debt);
      expect(vault).toBeUndefined();
    });
  });
});
