// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../ForkingSetup.sol";
import {AgaveGnosis} from "../../../src/providers/gnosis/AgaveGnosis.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {IRouter} from "../../../src/interfaces/IRouter.sol";
import {IConnext} from "../../../src/interfaces/connext/IConnext.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";
import {ConnextRouter} from "../../../src/routers/ConnextRouter.sol";
import {ConnextHandler} from "../../../src/routers/ConnextHandler.sol";
import {IWETH9} from "../../../src/abstracts/WETH9.sol";
import {LibSigUtils} from "../../../src/libraries/LibSigUtils.sol";

contract ConnextRouterForkingTests is Routines, ForkingSetup {
  event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares);

  event Borrow(
    address indexed sender,
    address indexed receiver,
    address indexed owner,
    uint256 debt,
    uint256 shares
  );

  event Dispatch(bytes32 leaf, uint256 index, bytes32 root, bytes message);

  ConnextRouter public connextRouter;
  ConnextHandler public connextHandler;
  uint32 domain;

  function setUp() public {
    domain = GNOSIS_DOMAIN;
    setUpFork(domain);

    AgaveGnosis agave = new AgaveGnosis();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = agave;

    deploy(providers);

    connextRouter = new ConnextRouter(
      IWETH9(collateralAsset),
      IConnext(registry[domain].connext),
      chief
    );

    connextHandler = connextRouter.handler();

    // _setVaultProviders(vault, providers);
    // vault.setActiveProvider(mockProvider);
  }

  function test_depositAndBorrow() public {
    uint256 amount = 1 ether;
    uint256 borrowAmount = 1000e6;

    IRouter.Action[] memory actions = new IRouter.Action[](3);
    actions[0] = IRouter.Action.Deposit;
    actions[1] = IRouter.Action.PermitBorrow;
    actions[2] = IRouter.Action.Borrow;

    bytes[] memory args = new bytes[](3);
    args[0] = abi.encode(address(vault), amount, ALICE, ALICE);
    args[1] = LibSigUtils.getZeroPermitEncodedArgs(address(vault), ALICE, ALICE, borrowAmount);
    args[2] = abi.encode(address(vault), borrowAmount, ALICE, ALICE);
    bytes32 actionArgsHash = LibSigUtils.getActionArgsHash(actions, args);

    LibSigUtils.Permit memory permit = LibSigUtils.buildPermitStruct(
      ALICE, address(connextRouter), ALICE, borrowAmount, 0, address(vault), actionArgsHash
    );

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitBorrowArgs(permit, ALICE_PK, address(vault));

    // Replace permit action arguments, now with the signature values.
    args[1] = abi.encode(address(vault), ALICE, ALICE, borrowAmount, deadline, v, r, s);

    deal(collateralAsset, ALICE, amount);

    vm.startPrank(ALICE);
    SafeERC20.safeApprove(IERC20(collateralAsset), address(connextRouter), amount);

    connextRouter.xBundle(actions, args);
    vm.stopPrank();

    assertApproxEqAbs(vault.balanceOf(ALICE), amount, 1);
    assertApproxEqAbs(vault.balanceOfDebt(ALICE), borrowAmount, 1);
  }

  function test_depositAndBorrowaAndTransfer() public {
    uint256 amount = 2 ether;
    uint256 borrowAmount = 1000e6;

    IRouter.Action[] memory actions = new IRouter.Action[](4);
    actions[0] = IRouter.Action.Deposit;
    actions[1] = IRouter.Action.PermitBorrow;
    actions[2] = IRouter.Action.Borrow;
    actions[3] = IRouter.Action.XTransfer;

    bytes[] memory args = new bytes[](4);
    args[0] = abi.encode(address(vault), amount, ALICE, ALICE);
    args[1] = LibSigUtils.getZeroPermitEncodedArgs(
      address(vault), ALICE, address(connextRouter), borrowAmount
    );
    args[2] = abi.encode(address(vault), borrowAmount, address(connextRouter), ALICE);
    args[3] =
      abi.encode(OPTIMISM_DOMAIN, 30, debtAsset, borrowAmount, ALICE, address(connextRouter));

    bytes32 actionArgsHash = LibSigUtils.getActionArgsHash(actions, args);

    LibSigUtils.Permit memory permit = LibSigUtils.buildPermitStruct(
      ALICE,
      address(connextRouter),
      address(connextRouter),
      borrowAmount,
      0,
      address(vault),
      actionArgsHash
    );

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitBorrowArgs(permit, ALICE_PK, address(vault));

    // Replace permit action arguments, now with the signature values.
    args[1] =
      abi.encode(address(vault), ALICE, address(connextRouter), borrowAmount, deadline, v, r, s);

    deal(collateralAsset, ALICE, amount);

    // mock Connext because it doesn't allow bridging of assets other than TEST token
    vm.mockCall(
      registry[OPTIMISM_DOMAIN].connext,
      abi.encodeWithSelector(IConnext.xcall.selector),
      abi.encode(1)
    );

    // mock balanceOf to avoid BaseRouter__bundleInternal_noRemnantBalance error
    vm.mockCall(
      debtAsset,
      abi.encodeWithSelector(IERC20.balanceOf.selector, address(connextRouter)),
      abi.encode(0)
    );

    vm.startPrank(ALICE);
    SafeERC20.safeApprove(IERC20(collateralAsset), address(connextRouter), amount);

    vm.expectEmit(true, true, true, true);
    emit Deposit(address(connextRouter), ALICE, amount, amount);
    vm.expectEmit(true, true, true, true);
    emit Borrow(address(connextRouter), address(connextRouter), ALICE, borrowAmount, borrowAmount);

    connextRouter.xBundle(actions, args);
    vm.stopPrank();

    assertApproxEqAbs(vault.balanceOf(ALICE), amount, 1);
    assertApproxEqAbs(vault.balanceOfDebt(ALICE), borrowAmount, 1);
  }
}
