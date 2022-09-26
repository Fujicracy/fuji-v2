import { formatUnits } from '@ethersproject/units';
import { BigNumber } from 'ethers';
import { NATIVE, WNATIVE, USDC } from '../src/constants';
import { Address, Token } from '../src/entities';
import { ChainId } from '../src/enums';
import { Sdk } from '../src/Sdk';

describe('Sdk', () => {
  //const ADDRESS_ONE = Address.from(
  //'0x0000000000000000000000000000000000000001'
  //);
  //const ADDRESS_TWO = Address.from(
  //'0x0000000000000000000000000000000000000002'
  //);
  const ADDRESS_BOB = Address.from(
    '0x33A875bD262C5cACAa1245ed8AC9734973da6108'
  );

  const sdk = new Sdk();

  describe('#getBalanceFor', () => {
    it('returns balance', async () => {
      const bal = await sdk.getBalanceFor(
        NATIVE[ChainId.ETHEREUM],
        ADDRESS_BOB
      );
      expect(parseFloat(formatUnits(bal))).toBeGreaterThan(0);
    });
  });

  describe('#getBorrowingVaultFor', () => {
    it('returns a vault from the same chain', async () => {
      const collateral = WNATIVE[ChainId.GOERLI];
      const debt = USDC[ChainId.GOERLI];
      const vault = await sdk.getBorrowingVaultFor(collateral, debt);
      expect(vault?.chainId).toEqual(ChainId.GOERLI);
    });

    it('returns a vault from chainA', async () => {
      sdk.getBorrowRateFor = jest
        .fn()
        .mockResolvedValueOnce(BigNumber.from(1))
        .mockResolvedValueOnce(BigNumber.from(2));

      const collateralA = WNATIVE[ChainId.GOERLI];
      const debtB = USDC[ChainId.OPTIMISM_GOERLI];

      const vault = await sdk.getBorrowingVaultFor(collateralA, debtB);
      expect(vault?.chainId).toEqual(ChainId.GOERLI);
    });

    it('returns a vault from chainB', async () => {
      sdk.getBorrowRateFor = jest
        .fn()
        .mockResolvedValueOnce(BigNumber.from(2))
        .mockResolvedValueOnce(BigNumber.from(1));

      const collateralA = WNATIVE[ChainId.GOERLI];
      const debtB = USDC[ChainId.OPTIMISM_GOERLI];

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
