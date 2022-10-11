// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {DSTestPlus} from "./utils/DSTestPlus.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockProvider} from "../src/mocks/MockProvider.sol";
import {MockOracle} from "../src/mocks/MockOracle.sol";
import {ILendingProvider} from "../src/interfaces/ILendingProvider.sol";
import {BorrowingVault} from "../src/vaults/borrowing/BorrowingVault.sol";
import {LibSigUtils} from "../src/libraries/LibSigUtils.sol";

contract VaultTest is DSTestPlus {
  BorrowingVault public vault;

  ILendingProvider public mockProvider;
  MockOracle public oracle;

  MockERC20 public asset;
  MockERC20 public debtAsset;

  uint256 ownerPkey = 0xA;
  uint256 operatorPkey = 0xB;
  address owner = vm.addr(ownerPkey);
  address operator = vm.addr(operatorPkey);

  uint256 public depositAmount = 10 * 1e18;
  uint256 public withdrawDelegated = 3 * 1e18;
  uint256 public borrowDelegated = 200 * 1e6;

  function utils_setupOracle(address asset1, address asset2) internal {
    // WETH and DAI prices by Aug 12h 2022
    vm.mockCall(
      address(oracle),
      abi.encodeWithSelector(MockOracle.getPriceOf.selector, asset1, asset2, 18),
      abi.encode(528881643782407)
    );
    vm.mockCall(
      address(oracle),
      abi.encodeWithSelector(MockOracle.getPriceOf.selector, asset2, asset1, 18),
      abi.encode(1889069940262927605990)
    );
  }

  function utils_doDeposit(uint256 amount, BorrowingVault v) public {
    deal(address(asset), owner, amount);

    vm.startPrank(owner);
    SafeERC20.safeApprove(asset, address(v), amount);
    v.deposit(amount, owner);
    vm.stopPrank();
  }

  function setUp() public {
    asset = new MockERC20("Test WETH", "tWETH");
    vm.label(address(asset), "tWETH");
    debtAsset = new MockERC20("Test DAI", "tDAI");
    vm.label(address(debtAsset), "tDAI");

    oracle = new MockOracle();
    utils_setupOracle(address(asset), address(debtAsset));

    mockProvider = new MockProvider();

    vault = new BorrowingVault(
      address(asset),
      address(debtAsset),
      address(oracle),
      address(0)
    );

    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = mockProvider;
    vault.setProviders(providers);
    vault.setActiveProvider(mockProvider);
  }

  function testFail_operatorTriesWithdraw() public {
    utils_doDeposit(depositAmount, vault);

    vm.prank(operator);
    vault.withdraw(withdrawDelegated, operator, owner);
  }

  function testWithdrawWithPermit() public {
    utils_doDeposit(depositAmount, vault);

    LibSigUtils.Permit memory permit = LibSigUtils.Permit({
      owner: owner,
      spender: operator,
      amount: withdrawDelegated,
      nonce: vault.nonces(owner),
      deadline: block.timestamp + 1 days
    });

    bytes32 digest = LibSigUtils.getHashTypedDataV4Digest(
      vault.DOMAIN_SEPARATOR(), // This domain should be obtained from the chain on which state will change.
      LibSigUtils.getStructHashAsset(permit)
    );

    // This message signing is supposed to be off-chain
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPkey, digest);
    vault.permitWithdraw(permit.owner, permit.spender, permit.amount, permit.deadline, v, r, s);

    assertEq(vault.withdrawAllowance(owner, operator), withdrawDelegated);

    vm.prank(operator);
    vault.withdraw(withdrawDelegated, operator, owner);

    assertEq(asset.balanceOf(operator), withdrawDelegated);
  }

  function testFail_operatorTriesBorrow() public {
    utils_doDeposit(depositAmount, vault);

    vm.prank(operator);
    vault.borrow(borrowDelegated, operator, owner);
  }

  function test_borrowWithPermit() public {
    utils_doDeposit(depositAmount, vault);

    LibSigUtils.Permit memory permit = LibSigUtils.Permit({
      owner: owner,
      spender: operator,
      amount: borrowDelegated,
      nonce: vault.nonces(owner),
      deadline: block.timestamp + 1 days
    });

    bytes32 digest = LibSigUtils.getHashTypedDataV4Digest(
      vault.DOMAIN_SEPARATOR(), // This domain should be obtained from the chain on which state will change.
      LibSigUtils.getStructHashBorrow(permit)
    );

    // This message signing is supposed to be off-chain
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPkey, digest);
    vault.permitBorrow(permit.owner, permit.spender, permit.amount, permit.deadline, v, r, s);

    assertEq(vault.borrowAllowance(owner, operator), borrowDelegated);

    vm.prank(operator);
    vault.borrow(borrowDelegated, operator, owner);

    assertEq(debtAsset.balanceOf(operator), borrowDelegated);
  }
}
