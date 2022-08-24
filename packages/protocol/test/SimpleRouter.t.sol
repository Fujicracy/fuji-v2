// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/Test.sol";

import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {BorrowingVault} from "../src/vaults/borrowing/BorrowingVault.sol";
import {SimpleRouter} from "../src/routers/SimpleRouter.sol";
import {IWETH9} from "../src/helpers/PeripheryPayments.sol";
import {ILendingProvider} from "../src/interfaces/ILendingProvider.sol";
import {IVault} from "../src/interfaces/IVault.sol";
import {IRouter} from "../src/interfaces/IRouter.sol";
import {DSTestPlus} from "./utils/DSTestPlus.sol";
import {MockProvider} from "./utils/mocks/MockProvider.sol";
import {MockERC20} from "./utils/mocks/MockERC20.sol";
import {MockOracle} from "./utils/mocks/MockOracle.sol";
import {IVaultPermissions} from "../src/interfaces/IVaultPermissions.sol";
import {SigUtilsHelper} from "./utils/SigUtilsHelper.sol";

contract SimpleRouterTest is DSTestPlus {
  using stdStorage for StdStorage;

  event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares);

  event Withdraw(
    address indexed caller,
    address indexed receiver,
    address indexed owner,
    uint256 assets,
    uint256 shares
  );

  event Borrow(address indexed caller, address indexed owner, uint256 debt, uint256 shares);

  event Payback(address indexed caller, address indexed owner, uint256 debt, uint256 shares);

  IVault public vault;
  ILendingProvider public mockProvider;
  IRouter public simpleRouter;
  SigUtilsHelper public sigUtils;

  MockOracle public oracle;
  MockERC20 public asset;
  MockERC20 public debtAsset;

  uint256 alicePkey = 0xA;
  address alice = vm.addr(alicePkey);

  function utils_setupOracle(address asset1, address asset2) internal {
    oracle = new MockOracle();
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

  function utils_setupSigUtils() internal {
    sigUtils = new SigUtilsHelper();
  }

  function setUp() public {
    asset = new MockERC20("Test WETH", "tWETH");
    vm.label(address(asset), "tWETH");
    debtAsset = new MockERC20("Test DAI", "tDAI");
    vm.label(address(debtAsset), "tDAI");

    utils_setupOracle(address(asset), address(debtAsset));
    utils_setupSigUtils();

    mockProvider = new MockProvider();

    vault = new BorrowingVault(
            address(asset),
            address(debtAsset),
            address(oracle),
            address(0)
        );
    simpleRouter = new SimpleRouter(IWETH9(address(1)));

    vault.setActiveProvider(mockProvider);
  }

  function testDepositAndBorrow() public {
    uint256 amount = 2 ether;
    uint256 borrowAmount = 100e18;

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitBorrowArgs(alice, address(simpleRouter), borrowAmount);

    IRouter.Action[] memory actions = new IRouter.Action[](3);
    actions[0] = IRouter.Action.Deposit;
    actions[1] = IRouter.Action.PermitBorrow;
    actions[2] = IRouter.Action.Borrow;

    bytes[] memory args = new bytes[](3);
    args[0] = abi.encode(address(vault), amount, alice);
    args[1] =
      abi.encode(address(vault), alice, address(simpleRouter), borrowAmount, deadline, v, r, s);
    args[2] = abi.encode(address(vault), borrowAmount, alice, alice);

    vm.expectEmit(true, true, true, true);
    emit Deposit(address(simpleRouter), alice, amount, amount);

    vm.expectEmit(true, true, true, true);
    emit Borrow(address(simpleRouter), alice, borrowAmount, borrowAmount);

    deal(address(asset), alice, amount);

    vm.startPrank(alice);
    SafeERC20.safeApprove(asset, address(simpleRouter), type(uint256).max);

    simpleRouter.xBundle(actions, args);

    assertEq(vault.balanceOf(alice), amount);
  }

  function testPaybackAndWithdraw() public {
    uint256 amount = 2 ether;
    uint256 borrowAmount = 1000e18;

    testDepositAndBorrow();

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitAssetsArgs(alice, address(simpleRouter), amount);

    IRouter.Action[] memory actions = new IRouter.Action[](3);
    actions[0] = IRouter.Action.Payback;
    actions[1] = IRouter.Action.PermitAssets;
    actions[2] = IRouter.Action.Withdraw;

    bytes[] memory args = new bytes[](3);
    args[0] = abi.encode(address(vault), borrowAmount, alice);
    args[1] = abi.encode(address(vault), alice, address(simpleRouter), amount, deadline, v, r, s);
    args[1] = abi.encode(address(vault), amount, alice, alice);

    vm.expectEmit(true, true, true, true);
    emit Payback(address(simpleRouter), alice, borrowAmount, borrowAmount);

    vm.expectEmit(true, true, true, true);
    emit Withdraw(address(simpleRouter), alice, alice, amount, amount);

    stdstore
    .target(address(debtAsset))
    .sig("allowance(address,address)")
    .with_key(alice)
    .with_key(address(simpleRouter))
    .checked_write(borrowAmount);
    console.log("debtAsset.allowance(alice,address(vault))", debtAsset.allowance(alice,address(simpleRouter)));
  
    stdstore
    .target(address(debtAsset))
    .sig("allowance(address,address)")
    .with_key(address(simpleRouter))
    .with_key(address(vault))
    .checked_write(borrowAmount);

    console.log("debtAsset.allowance(address(simpleRouter),address(vault))", debtAsset.allowance(address(simpleRouter),address(vault)));

    simpleRouter.xBundle(actions, args);

    assertEq(vault.balanceOf(alice), 0);
  }

  function _getPermitBorrowArgs(address owner, address operator, uint256 borrowAmount)
    internal
    returns (uint256 deadline, uint8 v, bytes32 r, bytes32 s)
  {
    deadline = block.timestamp + 1 days;
    SigUtilsHelper.Permit memory permit = SigUtilsHelper.Permit({
      owner: owner,
      spender: operator,
      value: borrowAmount,
      nonce: IVaultPermissions(address(vault)).nonces(owner),
      deadline: deadline
    });
    bytes32 digest = sigUtils.gethashTypedDataV4Digest(
      // This domain should be obtained from the chain on which state will change.
      IVaultPermissions(address(vault)).DOMAIN_SEPARATOR(),
      sigUtils.getStructHashBorrow(permit)
    );
    (v, r, s) = vm.sign(alicePkey, digest);
  }

  function _getPermitAssetsArgs(address owner, address operator, uint256 amount)
    internal
    returns (uint256 deadline, uint8 v, bytes32 r, bytes32 s)
  {
    deadline = block.timestamp + 1 days;
    SigUtilsHelper.Permit memory permit = SigUtilsHelper.Permit({
      owner: owner,
      spender: operator,
      value: amount,
      nonce: IVaultPermissions(address(vault)).nonces(owner),
      deadline: deadline
    });
    bytes32 digest = sigUtils.gethashTypedDataV4Digest(
      // This domain should be obtained from the chain on which state will change.
      IVaultPermissions(address(vault)).DOMAIN_SEPARATOR(),
      sigUtils.getStructHashAsset(permit)
    );
    (v, r, s) = vm.sign(alicePkey, digest);
  }
}
