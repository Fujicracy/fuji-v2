// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {DSTestPlus} from "./utils/DSTestPlus.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockProvider} from "../src/mocks/MockProvider.sol";
import {MockOracle} from "../src/mocks/MockOracle.sol";
import {IVault} from "../src/interfaces/IVault.sol";
import {ILendingProvider} from "../src/interfaces/ILendingProvider.sol";
import {BorrowingVault} from "../src/vaults/borrowing/BorrowingVault.sol";

contract VaultTest is DSTestPlus {
  IVault public vault;

  ILendingProvider public mockProvider;
  MockOracle public oracle;

  MockERC20 public asset;
  MockERC20 public debtAsset;

  uint256 alicePkey = 0xA;
  address alice = vm.addr(alicePkey);

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

  function utils_doDeposit(uint256 amount, IVault v) public {
    deal(address(asset), alice, amount);

    vm.startPrank(alice);
    SafeERC20.safeApprove(asset, address(v), amount);
    v.deposit(amount, alice);
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

    vault.setActiveProvider(mockProvider);
  }

  function test_deposit() public {
    uint amount = 2 ether;
    utils_doDeposit(amount, vault);
    assertEq(vault.balanceOf(alice), amount);
  }

  function test_withdraw() public {
    uint amount = 2 ether;
    utils_doDeposit(amount, vault);

    vm.prank(alice);
    vault.withdraw(amount, alice, alice);

    assertEq(vault.balanceOf(alice), 0);
  }
}
