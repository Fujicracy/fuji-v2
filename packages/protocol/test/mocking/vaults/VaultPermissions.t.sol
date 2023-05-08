// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {MockingSetup} from "../MockingSetup.sol";
import {MockRoutines} from "../MockRoutines.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {LibSigUtils} from "../../../src/libraries/LibSigUtils.sol";
import {VaultPermissions} from "../../../src/vaults/VaultPermissions.sol";

contract VaultPermissionsUnitTests is MockingSetup, MockRoutines {
  uint256 ownerPkey = 0x10;
  address owner = vm.addr(ownerPkey);
  uint256 operatorPkey = 0x11;
  address operator = vm.addr(operatorPkey);
  uint256 receiverPKey = 0x12;
  address receiver = vm.addr(receiverPKey);

  uint256 public BORROW_LIMIT = 500 * 1e18;

  function setUp() public {
    vm.label(owner, "owner");
    vm.label(operator, "operator");
    vm.label(receiver, "receiver");
  }

  function test_increaseWithdrawAllowance(uint256 amount) public {
    vm.assume(amount > 0);

    assertEq(vault.withdrawAllowance(owner, operator, receiver), 0);

    vm.prank(owner);
    vault.increaseWithdrawAllowance(operator, receiver, amount);

    assertEq(vault.withdrawAllowance(owner, operator, receiver), amount);
  }

  function test_decreaseWithdrawAllowance(uint256 decreaseAmount_) public {
    vm.assume(decreaseAmount_ > 0 && decreaseAmount_ <= 1 ether);

    uint256 difference = 1 ether - decreaseAmount_;

    vm.startPrank(owner);
    vault.increaseWithdrawAllowance(operator, receiver, 1 ether);
    vault.decreaseWithdrawAllowance(operator, receiver, decreaseAmount_);
    vm.stopPrank();

    assertEq(vault.withdrawAllowance(owner, operator, receiver), difference);
  }

  function test_increaseBorrowAllowance(uint256 amount) public {
    vm.assume(amount > 0);

    assertEq(vault.borrowAllowance(owner, operator, receiver), 0);

    vm.prank(owner);
    vault.increaseBorrowAllowance(operator, receiver, amount);

    assertEq(vault.borrowAllowance(owner, operator, receiver), amount);
  }

  function test_decreaseBorrowAllowance(uint256 decreaseAmount_) public {
    vm.assume(decreaseAmount_ > 0 && decreaseAmount_ <= 1 ether);

    uint256 difference = 1 ether - decreaseAmount_;

    vm.startPrank(owner);
    vault.increaseBorrowAllowance(operator, receiver, 1 ether);
    vault.decreaseBorrowAllowance(operator, receiver, decreaseAmount_);

    assertEq(vault.borrowAllowance(owner, operator, receiver), difference);
  }

  function test_checkAllowanceSetViaERC4626Approve(uint256 amount) public {
    vm.assume(amount > 0);

    assertEq(vault.allowance(owner, receiver), 0);

    vm.prank(owner);
    // BaseVault should override ERC20-approve function and assign `operator` and `receiver` as
    // the same address when calling an "approve".
    vault.approve(receiver, amount);

    assertEq(vault.allowance(owner, receiver), amount);
    assertEq(vault.withdrawAllowance(owner, receiver, receiver), amount);
  }

  function test_checkAllowanceIncreaseViaERC4626IncreaseAllowance(uint256 amount) public {
    vm.assume(amount > 0);

    assertEq(vault.allowance(owner, receiver), 0);

    vm.prank(owner);
    // BaseVault should override ERC20-approve function and assign `operator` and `receiver` as
    // the same address when calling an "approve".
    vault.increaseAllowance(receiver, amount);

    assertEq(vault.allowance(owner, receiver), amount);
    assertEq(vault.withdrawAllowance(owner, receiver, receiver), amount);
  }

  function test_checkAllowanceDecreaseViaERC4626DecreaseAllowance(uint256 decreaseAmount_) public {
    vm.assume(decreaseAmount_ > 0 && decreaseAmount_ <= 1 ether);

    uint256 difference = 1 ether - decreaseAmount_;
    vm.startPrank(owner);
    vault.approve(receiver, 1 ether);
    vault.decreaseAllowance(receiver, decreaseAmount_);

    assertEq(vault.allowance(owner, receiver), difference);
    assertEq(vault.withdrawAllowance(owner, receiver, receiver), difference);
  }

  function testFail_operatorTriesWithdraw(
    uint256 depositAmount_,
    uint256 withdrawDelegated_
  )
    public
  {
    vm.assume(depositAmount_ > 0 && withdrawDelegated_ > 0 && withdrawDelegated_ < depositAmount_);
    do_deposit(depositAmount_, vault, owner);

    vm.prank(operator);
    vault.withdraw(withdrawDelegated_, receiver, owner);
  }

  function testFail_receiverTriesWithdraw(
    uint256 depositAmount_,
    uint256 withdrawDelegated_
  )
    public
  {
    vm.assume(depositAmount_ > 0 && withdrawDelegated_ > 0 && withdrawDelegated_ < depositAmount_);
    do_deposit(depositAmount_, vault, owner);

    vm.prank(receiver);
    vault.withdraw(withdrawDelegated_, receiver, owner);
  }

  function test_withdrawWithPermit(uint128 depositAmount_, uint128 withdrawDelegated_) public {
    uint256 minAmount = vault.minAmount();
    vm.assume(
      depositAmount_ > minAmount && withdrawDelegated_ > 0 && withdrawDelegated_ < depositAmount_
    );
    do_deposit(depositAmount_, vault, owner);

    bytes32 pretendedActionArgsHash = keccak256(abi.encode(1));

    LibSigUtils.Permit memory permit = LibSigUtils.Permit({
      chainid: block.chainid,
      owner: owner,
      operator: operator,
      receiver: receiver,
      amount: withdrawDelegated_,
      nonce: vault.nonces(owner),
      deadline: block.timestamp + 1 days,
      actionArgsHash: pretendedActionArgsHash
    });

    bytes32 digest = LibSigUtils.getHashTypedDataV4Digest(
      vault.DOMAIN_SEPARATOR(), // This domain should be obtained from the chain on which state will change.
      LibSigUtils.getStructHashWithdraw(permit)
    );

    // This message signing is supposed to be off-chain
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPkey, digest);
    vm.prank(operator);
    vault.permitWithdraw(
      permit.owner, permit.receiver, permit.amount, permit.deadline, permit.actionArgsHash, v, r, s
    );

    assertEq(vault.withdrawAllowance(owner, operator, receiver), withdrawDelegated_);

    vm.prank(operator);
    vault.withdraw(withdrawDelegated_, receiver, owner);

    assertEq(IERC20(collateralAsset).balanceOf(receiver), withdrawDelegated_);
  }

  function testFail_operatorTriesBorrow(uint256 depositAmount_, uint256 borrowDelegated_) public {
    vm.assume(depositAmount_ > 0 && borrowDelegated_ > 0 && borrowDelegated_ <= BORROW_LIMIT);
    do_deposit(depositAmount_, vault, owner);

    vm.prank(operator);
    vault.borrow(borrowDelegated_, receiver, owner);
  }

  function testFail_receiverTriesBorrow(uint256 depositAmount_, uint256 borrowDelegated_) public {
    vm.assume(depositAmount_ > 0 && borrowDelegated_ > 0 && borrowDelegated_ <= BORROW_LIMIT);
    do_deposit(depositAmount_, vault, owner);

    vm.prank(receiver);
    vault.borrow(borrowDelegated_, receiver, owner);
  }

  function test_borrowWithPermit(uint256 borrowDelegated_) public {
    uint256 minAmount = vault.minAmount();
    vm.assume(borrowDelegated_ > minAmount && borrowDelegated_ <= BORROW_LIMIT);
    do_deposit(10 ether, vault, owner);

    bytes32 pretendedActionArgsHash = keccak256(abi.encode(1));

    LibSigUtils.Permit memory permit = LibSigUtils.Permit({
      chainid: block.chainid,
      owner: owner,
      operator: operator,
      receiver: receiver,
      amount: borrowDelegated_,
      nonce: vault.nonces(owner),
      deadline: block.timestamp + 1 days,
      actionArgsHash: pretendedActionArgsHash
    });

    bytes32 digest = LibSigUtils.getHashTypedDataV4Digest(
      vault.DOMAIN_SEPARATOR(), // This domain should be obtained from the chain on which state will change.
      LibSigUtils.getStructHashBorrow(permit)
    );

    // This message signing is supposed to be off-chain
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPkey, digest);

    vm.prank(operator);
    vault.permitBorrow(
      permit.owner, permit.receiver, permit.amount, permit.deadline, permit.actionArgsHash, v, r, s
    );

    assertEq(vault.borrowAllowance(owner, operator, receiver), borrowDelegated_);

    vm.prank(operator);
    vault.borrow(borrowDelegated_, receiver, owner);

    assertEq(IERC20(debtAsset).balanceOf(receiver), borrowDelegated_);
  }

  function test_errorZeroAddress() public {
    vm.startPrank(owner);

    vm.expectRevert(VaultPermissions.VaultPermissions__zeroAddress.selector);
    vault.increaseWithdrawAllowance(address(0), receiver, 1 ether);

    vm.expectRevert(VaultPermissions.VaultPermissions__zeroAddress.selector);
    vault.increaseWithdrawAllowance(operator, address(0), 1 ether);

    vault.increaseWithdrawAllowance(operator, receiver, 1 ether);

    vm.expectRevert();
    vault.decreaseWithdrawAllowance(address(0), receiver, 1 ether);

    vm.expectRevert();
    vault.decreaseWithdrawAllowance(operator, address(0), 1 ether);

    vm.expectRevert(VaultPermissions.VaultPermissions__zeroAddress.selector);
    vault.increaseBorrowAllowance(address(0), receiver, 1 ether);

    vm.expectRevert(VaultPermissions.VaultPermissions__zeroAddress.selector);
    vault.increaseBorrowAllowance(operator, address(0), 1 ether);

    vault.increaseBorrowAllowance(operator, receiver, 1 ether);

    vm.expectRevert();
    vault.decreaseBorrowAllowance(address(0), receiver, 1 ether);

    vm.expectRevert();
    vault.decreaseBorrowAllowance(operator, address(0), 1 ether);

    vm.stopPrank();
  }

  function test_errorAllowanceBelowZero() public {
    vm.startPrank(owner);

    vault.increaseWithdrawAllowance(operator, receiver, 1 ether);
    vm.expectRevert(VaultPermissions.VaultPermissions__allowanceBelowZero.selector);
    vault.decreaseWithdrawAllowance(operator, receiver, 1 ether + 1);

    vault.increaseBorrowAllowance(operator, receiver, 1 ether);
    vm.expectRevert(VaultPermissions.VaultPermissions__allowanceBelowZero.selector);
    vault.decreaseBorrowAllowance(operator, receiver, 1 ether + 1);

    vm.stopPrank();
  }

  function test_errorInsufficientWithdrawAllowance() public {
    do_deposit(2 ether, vault, owner);

    vm.prank(owner);
    vault.increaseWithdrawAllowance(operator, receiver, 1 ether);

    vm.expectRevert(VaultPermissions.VaultPermissions__insufficientWithdrawAllowance.selector);
    vm.prank(operator);
    vault.withdraw(1 ether + 1, receiver, owner);
  }

  function test_errorInsufficientBorrowAllowance() public {
    do_deposit(2 ether, vault, owner);

    vm.prank(owner);
    vault.increaseBorrowAllowance(operator, receiver, BORROW_LIMIT);

    vm.expectRevert(VaultPermissions.VaultPermissions__insufficientBorrowAllowance.selector);
    vm.prank(operator);
    vault.borrow(BORROW_LIMIT + 1, receiver, owner);
  }

  function test_errorExpiredDeadlineWithdrawPermit() public {
    do_deposit(1 ether, vault, owner);

    bytes32 pretendedActionArgsHash = keccak256(abi.encode(1));

    LibSigUtils.Permit memory permit = LibSigUtils.Permit({
      chainid: block.chainid,
      owner: owner,
      operator: operator,
      receiver: receiver,
      amount: 1 ether,
      nonce: vault.nonces(owner),
      deadline: block.timestamp + 1 days,
      actionArgsHash: pretendedActionArgsHash
    });

    bytes32 digest = LibSigUtils.getHashTypedDataV4Digest(
      vault.DOMAIN_SEPARATOR(), // This domain should be obtained from the chain on which state will change.
      LibSigUtils.getStructHashWithdraw(permit)
    );

    // This message signing is supposed to be off-chain
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPkey, digest);

    // warp to a timestamp that is expired
    uint256 expiredDeadlineTimestamp = block.timestamp + 1 days + 1;
    vm.warp(expiredDeadlineTimestamp);

    vm.expectRevert(VaultPermissions.VaultPermissions__expiredDeadline.selector);
    vm.prank(operator);
    vault.permitWithdraw(
      permit.owner, permit.receiver, permit.amount, permit.deadline, permit.actionArgsHash, v, r, s
    );
  }

  function test_errorExpiredDeadlineBorrowPermit() public {
    do_deposit(1 ether, vault, owner);

    bytes32 pretendedActionArgsHash = keccak256(abi.encode(1));

    LibSigUtils.Permit memory permit = LibSigUtils.Permit({
      chainid: block.chainid,
      owner: owner,
      operator: operator,
      receiver: receiver,
      amount: BORROW_LIMIT,
      nonce: vault.nonces(owner),
      deadline: block.timestamp + 1 days,
      actionArgsHash: pretendedActionArgsHash
    });

    bytes32 digest = LibSigUtils.getHashTypedDataV4Digest(
      vault.DOMAIN_SEPARATOR(), // This domain should be obtained from the chain on which state will change.
      LibSigUtils.getStructHashBorrow(permit)
    );

    // This message signing is supposed to be off-chain
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPkey, digest);

    // warp to a timestamp that is expired
    uint256 expiredDeadlineTimestamp = block.timestamp + 1 days + 1;
    vm.warp(expiredDeadlineTimestamp);

    vm.expectRevert(VaultPermissions.VaultPermissions__expiredDeadline.selector);
    vm.prank(operator);
    vault.permitBorrow(
      permit.owner, permit.receiver, permit.amount, permit.deadline, permit.actionArgsHash, v, r, s
    );
  }

  function test_errorVaultPermissions__invalidSignatureWithdrawPermit() public {
    do_deposit(1 ether, vault, owner);

    bytes32 pretendedActionArgsHash = keccak256(abi.encode(1));

    LibSigUtils.Permit memory permit = LibSigUtils.Permit({
      chainid: block.chainid,
      owner: owner,
      operator: operator,
      receiver: receiver,
      amount: 1 ether,
      nonce: vault.nonces(owner),
      deadline: block.timestamp + 1 days,
      actionArgsHash: pretendedActionArgsHash
    });

    bytes32 digest = LibSigUtils.getHashTypedDataV4Digest(
      vault.DOMAIN_SEPARATOR(), // This domain should be obtained from the chain on which state will change.
      LibSigUtils.getStructHashWithdraw(permit)
    );

    // This message signing is supposed to be off-chain
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPkey, digest);

    LibSigUtils.Permit memory wrongPermit = permit;

    // Change owner
    wrongPermit.owner = receiver;
    vm.expectRevert(VaultPermissions.VaultPermissions__invalidSignature.selector);
    vm.prank(operator);
    vault.permitWithdraw(
      wrongPermit.owner,
      wrongPermit.receiver,
      wrongPermit.amount,
      wrongPermit.deadline,
      wrongPermit.actionArgsHash,
      v,
      r,
      s
    );

    // Change operator
    wrongPermit.operator = receiver;
    vm.expectRevert(VaultPermissions.VaultPermissions__invalidSignature.selector);
    vm.prank(operator);
    vault.permitWithdraw(
      wrongPermit.owner,
      wrongPermit.receiver,
      wrongPermit.amount,
      wrongPermit.deadline,
      wrongPermit.actionArgsHash,
      v,
      r,
      s
    );

    // Change receiver
    wrongPermit.receiver = operator;
    vm.expectRevert(VaultPermissions.VaultPermissions__invalidSignature.selector);
    vm.prank(operator);
    vault.permitWithdraw(
      wrongPermit.owner,
      wrongPermit.receiver,
      wrongPermit.amount,
      wrongPermit.deadline,
      wrongPermit.actionArgsHash,
      v,
      r,
      s
    );

    // Change amount
    wrongPermit.amount = 1 ether + 1;
    vm.expectRevert(VaultPermissions.VaultPermissions__invalidSignature.selector);
    vm.prank(operator);
    vault.permitWithdraw(
      wrongPermit.owner,
      wrongPermit.receiver,
      wrongPermit.amount,
      wrongPermit.deadline,
      wrongPermit.actionArgsHash,
      v,
      r,
      s
    );

    // Change deadline
    wrongPermit.deadline = block.timestamp + 1 days + 1;
    vm.expectRevert(VaultPermissions.VaultPermissions__invalidSignature.selector);
    vm.prank(operator);
    vault.permitWithdraw(
      wrongPermit.owner,
      wrongPermit.receiver,
      wrongPermit.amount,
      wrongPermit.deadline,
      wrongPermit.actionArgsHash,
      v,
      r,
      s
    );
  }

  function test_errorVaultPermissions__invalidSignatureBorrowPermit() public {
    do_deposit(1 ether, vault, owner);

    bytes32 pretendedActionArgsHash = keccak256(abi.encode(1));

    LibSigUtils.Permit memory permit = LibSigUtils.Permit({
      chainid: block.chainid,
      owner: owner,
      operator: operator,
      receiver: receiver,
      amount: 1 ether,
      nonce: vault.nonces(owner),
      deadline: block.timestamp + 1 days,
      actionArgsHash: pretendedActionArgsHash
    });

    bytes32 digest = LibSigUtils.getHashTypedDataV4Digest(
      vault.DOMAIN_SEPARATOR(), // This domain should be obtained from the chain on which state will change.
      LibSigUtils.getStructHashBorrow(permit)
    );

    // This message signing is supposed to be off-chain
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPkey, digest);

    LibSigUtils.Permit memory wrongPermit = permit;

    // Change owner
    wrongPermit.owner = receiver;
    vm.expectRevert(VaultPermissions.VaultPermissions__invalidSignature.selector);
    vm.prank(operator);
    vault.permitBorrow(
      wrongPermit.owner,
      wrongPermit.receiver,
      wrongPermit.amount,
      wrongPermit.deadline,
      wrongPermit.actionArgsHash,
      v,
      r,
      s
    );

    // Change operator
    wrongPermit.operator = receiver;
    vm.expectRevert(VaultPermissions.VaultPermissions__invalidSignature.selector);
    vm.prank(operator);
    vault.permitBorrow(
      wrongPermit.owner,
      wrongPermit.receiver,
      wrongPermit.amount,
      wrongPermit.deadline,
      wrongPermit.actionArgsHash,
      v,
      r,
      s
    );

    // Change receiver
    wrongPermit.receiver = operator;
    vm.expectRevert(VaultPermissions.VaultPermissions__invalidSignature.selector);
    vm.prank(operator);
    vault.permitBorrow(
      wrongPermit.owner,
      wrongPermit.receiver,
      wrongPermit.amount,
      wrongPermit.deadline,
      wrongPermit.actionArgsHash,
      v,
      r,
      s
    );

    // Change amount
    wrongPermit.amount = 1 ether + 1;
    vm.expectRevert(VaultPermissions.VaultPermissions__invalidSignature.selector);
    vm.prank(operator);
    vault.permitBorrow(
      wrongPermit.owner,
      wrongPermit.receiver,
      wrongPermit.amount,
      wrongPermit.deadline,
      wrongPermit.actionArgsHash,
      v,
      r,
      s
    );

    // Change deadline
    wrongPermit.deadline = block.timestamp + 1 days + 1;
    vm.expectRevert(VaultPermissions.VaultPermissions__invalidSignature.selector);
    vm.prank(operator);
    vault.permitBorrow(
      wrongPermit.owner,
      wrongPermit.receiver,
      wrongPermit.amount,
      wrongPermit.deadline,
      wrongPermit.actionArgsHash,
      v,
      r,
      s
    );
  }

  function testFail_spendAllowanceIssue() public {
    do_deposit(1 ether, vault, owner);

    vm.startPrank(owner);
    vault.approve(receiver, 1 ether);
    uint256 allowance1 = vault.allowance(owner, receiver);
    vm.stopPrank();

    vm.startPrank(receiver);
    vault.transferFrom(owner, receiver, 1 ether);
    uint256 allowance2 = vault.allowance(owner, receiver);
    vm.stopPrank();

    assertEq(allowance1, allowance2);
  }

  function test_spendAllowanceIssue() public {
    do_deposit(1 ether, vault, owner);

    vm.startPrank(owner);
    vault.approve(receiver, 1 ether);
    uint256 allowance1 = vault.allowance(owner, receiver);
    vm.stopPrank();

    vm.startPrank(receiver);
    vault.transferFrom(owner, receiver, 1 ether);
    uint256 allowance2 = vault.allowance(owner, receiver);
    vm.stopPrank();

    assertEq(allowance1, 1 ether);
    assertEq(allowance2, 0);
  }
}
