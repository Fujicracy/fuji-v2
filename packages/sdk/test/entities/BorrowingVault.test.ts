import { AddressZero } from '@ethersproject/constants';
import { BigNumber } from 'ethers';
import { Address, BorrowingVault } from '../../src/entities';
import { RouterAction } from '../../src/enums';
import {
  BorrowParams,
  DepositParams,
  PermitParams,
  RouterActionParams,
} from '../../src/types';

describe('BorrowingVault', () => {
  //const ADDRESS_ONE = Address.from(
  //'0x0000000000000000000000000000000000000001'
  //);
  //const ADDRESS_TWO = Address.from(
  //'0x0000000000000000000000000000000000000002'
  //);
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
      expect(BorrowingVault.needSignature([])).toBeFalsy();
    });

    it('returns false with simple array', () => {
      const actions: RouterActionParams[] = [
        depositActionParams,
        borrowActionParams,
      ];
      expect(BorrowingVault.needSignature(actions)).toBeFalsy();
    });

    it('returns false with compound array', () => {
      const actions: (RouterActionParams | RouterActionParams[])[] = [
        depositActionParams,
        borrowActionParams,
        [depositActionParams, borrowActionParams],
      ];
      expect(BorrowingVault.needSignature(actions)).toBeFalsy();
    });

    it('returns true with simple array for borrows', () => {
      const actions: RouterActionParams[] = [
        depositActionParams,
        borrowPermitActionParams,
        borrowActionParams,
      ];
      expect(BorrowingVault.needSignature(actions)).toBeTruthy();
    });

    it('returns true with simple array for withdrawals', () => {
      const actions: RouterActionParams[] = [
        depositActionParams,
        withdrawPermitActionParams,
        borrowActionParams,
      ];
      expect(BorrowingVault.needSignature(actions)).toBeTruthy();
    });

    it('returns true with compound array (permit in first level) for borrows', () => {
      const actions: (RouterActionParams | RouterActionParams[])[] = [
        depositActionParams,
        borrowPermitActionParams,
        borrowActionParams,
        [depositActionParams, borrowActionParams],
      ];
      expect(BorrowingVault.needSignature(actions)).toBeTruthy();
    });

    it('returns true with compound array (permit in first level) for withdrawals', () => {
      const actions: (RouterActionParams | RouterActionParams[])[] = [
        depositActionParams,
        withdrawPermitActionParams,
        borrowActionParams,
        [depositActionParams, borrowActionParams],
      ];
      expect(BorrowingVault.needSignature(actions)).toBeTruthy();
    });

    it('returns true with compound array (permit in second level) for borrows', () => {
      const actions: (RouterActionParams | RouterActionParams[])[] = [
        depositActionParams,
        borrowActionParams,
        [depositActionParams, borrowPermitActionParams, borrowActionParams],
      ];
      expect(BorrowingVault.needSignature(actions)).toBeTruthy();
    });

    it('returns true with compound array (permit in second level) for withdrawals', () => {
      const actions: (RouterActionParams | RouterActionParams[])[] = [
        depositActionParams,
        borrowActionParams,
        [depositActionParams, withdrawPermitActionParams, borrowActionParams],
      ];
      expect(BorrowingVault.needSignature(actions)).toBeTruthy();
    });

    it('returns true with compound array (permit in both levels)', () => {
      const actions: (RouterActionParams | RouterActionParams[])[] = [
        depositActionParams,
        borrowPermitActionParams,
        borrowActionParams,
        [depositActionParams, withdrawPermitActionParams, borrowActionParams],
      ];
      expect(BorrowingVault.needSignature(actions)).toBeTruthy();
    });
  });
});
