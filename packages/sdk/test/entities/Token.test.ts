import { Address } from '../../src/entities/Address';
import { Token } from '../../src/entities/Token';
import { ChainId } from '../../src/enums';

describe('Token', () => {
  const ADDRESS_ONE = Address.from(
    '0x0000000000000000000000000000000000000001'
  );
  const ADDRESS_TWO = Address.from(
    '0x0000000000000000000000000000000000000002'
  );
  const SYMBOL = 'USDC';

  describe('#constructor', () => {
    it('fails with invalid address', () => {
      expect(
        () =>
          new Token(
            ChainId.GOERLI,
            Address.from('0xhello00000000000000000000000000000000002'),
            18,
            SYMBOL
          ).address
      ).toThrow(
        '0xhello00000000000000000000000000000000002 is not a valid address'
      );
    });
    it('fails with negative decimals', () => {
      expect(
        () => new Token(ChainId.GOERLI, ADDRESS_ONE, -1, SYMBOL).address
      ).toThrow('DECIMALS');
    });
    it('fails with 256 decimals', () => {
      expect(
        () => new Token(ChainId.GOERLI, ADDRESS_ONE, 256, SYMBOL).address
      ).toThrow('DECIMALS');
    });
    it('fails with non-integer decimals', () => {
      expect(
        () => new Token(ChainId.GOERLI, ADDRESS_ONE, 1.5, SYMBOL).address
      ).toThrow('DECIMALS');
    });
  });

  describe('#equals', () => {
    it('fails if address differs', () => {
      expect(
        new Token(ChainId.ETHEREUM, ADDRESS_ONE, 18, SYMBOL).equals(
          new Token(ChainId.ETHEREUM, ADDRESS_TWO, 18, SYMBOL)
        )
      ).toBe(false);
    });

    it('false if chain id differs', () => {
      expect(
        new Token(ChainId.GOERLI, ADDRESS_ONE, 18, SYMBOL).equals(
          new Token(ChainId.ETHEREUM, ADDRESS_ONE, 18, SYMBOL)
        )
      ).toBe(false);
    });

    it('true if only decimals differs', () => {
      expect(
        new Token(ChainId.ETHEREUM, ADDRESS_ONE, 9, SYMBOL).equals(
          new Token(ChainId.ETHEREUM, ADDRESS_ONE, 18, SYMBOL)
        )
      ).toBe(true);
    });

    it('true if address is the same', () => {
      expect(
        new Token(ChainId.ETHEREUM, ADDRESS_ONE, 18, SYMBOL).equals(
          new Token(ChainId.ETHEREUM, ADDRESS_ONE, 18, SYMBOL)
        )
      ).toBe(true);
    });

    it('true on reference equality', () => {
      const token = new Token(ChainId.ETHEREUM, ADDRESS_ONE, 18, SYMBOL);
      expect(token.equals(token)).toBe(true);
    });

    it('true even if name/symbol/decimals differ', () => {
      const tokenA = new Token(ChainId.ETHEREUM, ADDRESS_ONE, 9, 'abc', 'def');
      const tokenB = new Token(ChainId.ETHEREUM, ADDRESS_ONE, 18, 'ghi', 'jkl');
      expect(tokenA.equals(tokenB)).toBe(true);
    });
  });
});
