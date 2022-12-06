// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Routines} from "./utils/Routines.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockProvider} from "../src/mocks/MockProvider.sol";
import {MockOracle} from "../src/mocks/MockOracle.sol";
import {ILendingProvider} from "../src/interfaces/ILendingProvider.sol";
import {BorrowingVault} from "../src/vaults/borrowing/BorrowingVault.sol";
import {Chief} from "../src/Chief.sol";
import {CoreRoles} from "../src/access/CoreRoles.sol";
import {LibSigUtils} from "../src/libraries/LibSigUtils.sol";
import {VaultPermissions} from "../src/vaults/VaultPermissions.sol";

contract VaultPermissionsUnitTests is Routines, CoreRoles {
  BorrowingVault public vault;
  Chief public chief;
  TimelockController public timelock;

  ILendingProvider public mockProvider;
  MockOracle public oracle;

  MockERC20 public asset;
  MockERC20 public debtAsset;

  uint256 ownerPkey = 0xA;
  address owner = vm.addr(ownerPkey);
  uint256 operatorPkey = 0xB;
  address operator = vm.addr(operatorPkey);
  uint256 receiverPKey = 0xC;
  address receiver = vm.addr(receiverPKey);

  uint256 public BORROW_LIMIT = 500 * 1e18;

  // WETH and DAI prices: 2000 DAI/WETH
  uint256 public constant TEST_USD_PER_ETH_PRICE = 2000e18;
  uint256 public constant TEST_ETH_PER_USD_PRICE = 5e14;

  function setUp() public {
    vm.label(owner, "owner");
    vm.label(operator, "operator");
    vm.label(receiver, "receiver");

    asset = new MockERC20("Test WETH", "tWETH");
    vm.label(address(asset), "tWETH");
    debtAsset = new MockERC20("Test DAI", "tDAI");
    vm.label(address(debtAsset), "tDAI");

    oracle = new MockOracle();
    _utils_setupOracle(address(asset), address(debtAsset));

    mockProvider = new MockProvider();

    address[] memory admins = new address[](1);
    admins[0] = address(this);
    timelock = new TimelockController(1 days, admins, admins);

    chief = new Chief();
    chief.setTimelock(address(timelock));

    vault = new BorrowingVault(
      address(asset),
      address(debtAsset),
      address(oracle),
      address(chief),
      "Fuji-V2 WETH Vault Shares",
      "fv2WETH"
    );

    _utils_setupVaultProvider(vault);
  }

  function _utils_setPrice(address asset1, address asset2, uint256 price) internal {
    vm.mockCall(
      address(oracle),
      abi.encodeWithSelector(MockOracle.getPriceOf.selector, asset1, asset2, 18),
      abi.encode(price)
    );
  }

  function _utils_setupOracle(address asset1, address asset2) internal {
    _utils_setPrice(asset1, asset2, TEST_ETH_PER_USD_PRICE);
    _utils_setPrice(asset2, asset1, TEST_USD_PER_ETH_PRICE);
  }

  function _utils_setupTestRoles() internal {
    // Grant this test address all roles.
    chief.grantRole(REBALANCER_ROLE, address(this));
    chief.grantRole(LIQUIDATOR_ROLE, address(this));
  }

  function _utils_callWithTimelock(address contract_, bytes memory encodedWithSelectorData)
    internal
  {
    timelock.schedule(contract_, 0, encodedWithSelectorData, 0x00, 0x00, 1.5 days);
    vm.warp(block.timestamp + 2 days);
    timelock.execute(contract_, 0, encodedWithSelectorData, 0x00, 0x00);
    rewind(2 days);
  }

  function _utils_setupVaultProvider(BorrowingVault vault_) internal {
    _utils_setupTestRoles();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = mockProvider;
    bytes memory encodedWithSelectorData =
      abi.encodeWithSelector(vault_.setProviders.selector, providers);
    _utils_callWithTimelock(address(vault_), encodedWithSelectorData);
    vault_.setActiveProvider(mockProvider);
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

  function testFail_operatorTriesWithdraw(uint256 depositAmount_, uint256 withdrawDelegated_)
    public
  {
    vm.assume(depositAmount_ > 0 && withdrawDelegated_ > 0 && withdrawDelegated_ < depositAmount_);
    do_deposit(depositAmount_, vault, owner);

    vm.prank(operator);
    vault.withdraw(withdrawDelegated_, receiver, owner);
  }

  function testFail_receiverTriesWithdraw(uint256 depositAmount_, uint256 withdrawDelegated_)
    public
  {
    vm.assume(depositAmount_ > 0 && withdrawDelegated_ > 0 && withdrawDelegated_ < depositAmount_);
    do_deposit(depositAmount_, vault, owner);

    vm.prank(receiver);
    vault.withdraw(withdrawDelegated_, receiver, owner);
  }

  function test_withdrawWithPermit(uint256 depositAmount_, uint256 withdrawDelegated_) public {
    vm.assume(depositAmount_ > 0 && withdrawDelegated_ > 0 && withdrawDelegated_ < depositAmount_);
    do_deposit(depositAmount_, vault, owner);

    LibSigUtils.Permit memory permit = LibSigUtils.Permit({
      chainid: block.chainid,
      owner: owner,
      operator: operator,
      receiver: receiver,
      amount: withdrawDelegated_,
      nonce: vault.nonces(owner),
      deadline: block.timestamp + 1 days
    });

    bytes32 digest = LibSigUtils.getHashTypedDataV4Digest(
      vault.DOMAIN_SEPARATOR(), // This domain should be obtained from the chain on which state will change.
      LibSigUtils.getStructHashWithdraw(permit)
    );

    // This message signing is supposed to be off-chain
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPkey, digest);
    vm.prank(operator);
    vault.permitWithdraw(permit.owner, permit.receiver, permit.amount, permit.deadline, v, r, s);

    assertEq(vault.withdrawAllowance(owner, operator, receiver), withdrawDelegated_);

    vm.prank(operator);
    vault.withdraw(withdrawDelegated_, receiver, owner);

    assertEq(asset.balanceOf(receiver), withdrawDelegated_);
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
    vm.assume(borrowDelegated_ > 0 && borrowDelegated_ <= BORROW_LIMIT);
    do_deposit(10 ether, vault, owner);

    LibSigUtils.Permit memory permit = LibSigUtils.Permit({
      chainid: block.chainid,
      owner: owner,
      operator: operator,
      receiver: receiver,
      amount: borrowDelegated_,
      nonce: vault.nonces(owner),
      deadline: block.timestamp + 1 days
    });

    bytes32 digest = LibSigUtils.getHashTypedDataV4Digest(
      vault.DOMAIN_SEPARATOR(), // This domain should be obtained from the chain on which state will change.
      LibSigUtils.getStructHashBorrow(permit)
    );

    // This message signing is supposed to be off-chain
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPkey, digest);

    vm.prank(operator);
    vault.permitBorrow(permit.owner, permit.receiver, permit.amount, permit.deadline, v, r, s);

    assertEq(vault.borrowAllowance(owner, operator, receiver), borrowDelegated_);

    vm.prank(operator);
    vault.borrow(borrowDelegated_, receiver, owner);

    assertEq(debtAsset.balanceOf(receiver), borrowDelegated_);
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

    LibSigUtils.Permit memory permit = LibSigUtils.Permit({
      chainid: block.chainid,
      owner: owner,
      operator: operator,
      receiver: receiver,
      amount: 1 ether,
      nonce: vault.nonces(owner),
      deadline: block.timestamp + 1 days
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
    vault.permitWithdraw(permit.owner, permit.receiver, permit.amount, permit.deadline, v, r, s);
  }

  function test_errorExpiredDeadlineBorrowPermit() public {
    do_deposit(1 ether, vault, owner);

    LibSigUtils.Permit memory permit = LibSigUtils.Permit({
      chainid: block.chainid,
      owner: owner,
      operator: operator,
      receiver: receiver,
      amount: BORROW_LIMIT,
      nonce: vault.nonces(owner),
      deadline: block.timestamp + 1 days
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
    vault.permitBorrow(permit.owner, permit.receiver, permit.amount, permit.deadline, v, r, s);
  }

  function test_errorVaultPermissions__invalidSignatureWithdrawPermit() public {
    do_deposit(1 ether, vault, owner);

    LibSigUtils.Permit memory permit = LibSigUtils.Permit({
      chainid: block.chainid,
      owner: owner,
      operator: operator,
      receiver: receiver,
      amount: 1 ether,
      nonce: vault.nonces(owner),
      deadline: block.timestamp + 1 days
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
      wrongPermit.owner, wrongPermit.receiver, wrongPermit.amount, wrongPermit.deadline, v, r, s
    );

    // Change operator
    wrongPermit.operator = receiver;
    vm.expectRevert(VaultPermissions.VaultPermissions__invalidSignature.selector);
    vm.prank(operator);
    vault.permitWithdraw(
      wrongPermit.owner, wrongPermit.receiver, wrongPermit.amount, wrongPermit.deadline, v, r, s
    );

    // Change receiver
    wrongPermit.receiver = operator;
    vm.expectRevert(VaultPermissions.VaultPermissions__invalidSignature.selector);
    vm.prank(operator);
    vault.permitWithdraw(
      wrongPermit.owner, wrongPermit.receiver, wrongPermit.amount, wrongPermit.deadline, v, r, s
    );

    // Change amount
    wrongPermit.amount = 1 ether + 1;
    vm.expectRevert(VaultPermissions.VaultPermissions__invalidSignature.selector);
    vm.prank(operator);
    vault.permitWithdraw(
      wrongPermit.owner, wrongPermit.receiver, wrongPermit.amount, wrongPermit.deadline, v, r, s
    );

    // Change deadline
    wrongPermit.deadline = block.timestamp + 1 days + 1;
    vm.expectRevert(VaultPermissions.VaultPermissions__invalidSignature.selector);
    vm.prank(operator);
    vault.permitWithdraw(
      wrongPermit.owner, wrongPermit.receiver, wrongPermit.amount, wrongPermit.deadline, v, r, s
    );
  }

  function test_errorVaultPermissions__invalidSignatureBorrowPermit() public {
    do_deposit(1 ether, vault, owner);

    LibSigUtils.Permit memory permit = LibSigUtils.Permit({
      chainid: block.chainid,
      owner: owner,
      operator: operator,
      receiver: receiver,
      amount: 1 ether,
      nonce: vault.nonces(owner),
      deadline: block.timestamp + 1 days
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
      wrongPermit.owner, wrongPermit.receiver, wrongPermit.amount, wrongPermit.deadline, v, r, s
    );

    // Change operator
    wrongPermit.operator = receiver;
    vm.expectRevert(VaultPermissions.VaultPermissions__invalidSignature.selector);
    vm.prank(operator);
    vault.permitBorrow(
      wrongPermit.owner, wrongPermit.receiver, wrongPermit.amount, wrongPermit.deadline, v, r, s
    );

    // Change receiver
    wrongPermit.receiver = operator;
    vm.expectRevert(VaultPermissions.VaultPermissions__invalidSignature.selector);
    vm.prank(operator);
    vault.permitBorrow(
      wrongPermit.owner, wrongPermit.receiver, wrongPermit.amount, wrongPermit.deadline, v, r, s
    );

    // Change amount
    wrongPermit.amount = 1 ether + 1;
    vm.expectRevert(VaultPermissions.VaultPermissions__invalidSignature.selector);
    vm.prank(operator);
    vault.permitBorrow(
      wrongPermit.owner, wrongPermit.receiver, wrongPermit.amount, wrongPermit.deadline, v, r, s
    );

    // Change deadline
    wrongPermit.deadline = block.timestamp + 1 days + 1;
    vm.expectRevert(VaultPermissions.VaultPermissions__invalidSignature.selector);
    vm.prank(operator);
    vault.permitBorrow(
      wrongPermit.owner, wrongPermit.receiver, wrongPermit.amount, wrongPermit.deadline, v, r, s
    );
  }
}
