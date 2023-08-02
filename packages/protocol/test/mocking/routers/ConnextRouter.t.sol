// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/Test.sol";

import "forge-std/console2.sol";
import {MockRoutines} from "../MockRoutines.sol";
import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {SafeERC20, IERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";
import {BaseRouter} from "../../../src/abstracts/BaseRouter.sol";
import {ConnextRouter} from "../../../src/routers/ConnextRouter.sol";
import {SystemAccessControl} from "../../../src/access/SystemAccessControl.sol";
import {IWETH9} from "../../../src/abstracts/WETH9.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {IFlasher} from "../../../src/interfaces/IFlasher.sol";
import {IRouter} from "../../../src/interfaces/IRouter.sol";
import {IConnext} from "../../../src/interfaces/connext/IConnext.sol";
import {LibSigUtils} from "../../../src/libraries/LibSigUtils.sol";
import {MockFlasher} from "../../../src/mocks/MockFlasher.sol";
import {MockProvider} from "../../../src/mocks/MockProvider.sol";
import {MockERC20} from "../../../src/mocks/MockERC20.sol";
import {MockOracle} from "../../../src/mocks/MockOracle.sol";
import {MockSwapper} from "../../../src/mocks/MockSwapper.sol";
import {Chief} from "../../../src/Chief.sol";
import {CoreRoles} from "../../../src/access/CoreRoles.sol";
import {IVaultPermissions} from "../../../src/interfaces/IVaultPermissions.sol";
import {MockingSetup} from "../MockingSetup.sol";

uint32 constant MUMBAI_DOMAIN = 9991;

contract MockConnext {
  using SafeERC20 for IERC20;

  event Dispatch(bytes32 leaf, uint256 index, bytes32 root, bytes message);

  function xcall(
    uint32 _destination,
    address _to,
    address _asset,
    address _delegate,
    uint256 _amount,
    uint256 _slippage,
    bytes calldata _callData
  )
    external
    payable
    returns (bytes32 hashed)
  {
    IERC20(_asset).safeTransferFrom(msg.sender, address(this), _amount);
    bytes memory message;
    {
      message = abi.encode(_destination, _to, _asset, _delegate, _amount, _slippage, _callData);
    }
    hashed = keccak256(message);
    // Just throw some mock data
    emit Dispatch(hashed, 1, keccak256(abi.encode(hashed, 1)), message);
  }
}

contract ConnextRouterUnitTests is MockingSetup, MockRoutines {
  IConnext public mockConnext;
  IRouter public connextRouter;

  function setUp() public {
    mockConnext = IConnext(address(new MockConnext()));
    connextRouter = new ConnextRouter(IWETH9(collateralAsset), mockConnext, chief);
    vm.label(address(connextRouter), "connextRouter");
    vm.warp(1690848000);
  }

  function test_permitWithdrawPartialThenCross(uint32 amount) public {
    vm.assume(amount > 10 * 1e6);
    uint256 withdrawAmount = amount / 4;
    do_deposit(amount, vault, ALICE);

    IRouter.Action[] memory actions = new IRouter.Action[](3);
    actions[0] = IRouter.Action.PermitWithdraw;
    actions[1] = IRouter.Action.Withdraw;
    actions[2] = IRouter.Action.XTransfer;

    bytes[] memory args = new bytes[](3);
    args[0] = LibSigUtils.getZeroPermitEncodedArgs(
      address(vault), ALICE, address(connextRouter), withdrawAmount
    );
    args[1] = abi.encode(address(vault), withdrawAmount, address(connextRouter), ALICE);
    args[2] =
      abi.encode(MUMBAI_DOMAIN, 30, vault.asset(), withdrawAmount, ALICE, address(connextRouter));

    bytes32 actionArgsHash = LibSigUtils.getActionArgsHash(actions, args);

    LibSigUtils.Permit memory permit = LibSigUtils.buildPermitStruct(
      ALICE,
      address(connextRouter),
      address(connextRouter),
      withdrawAmount,
      0,
      address(vault),
      actionArgsHash
    );

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitWithdrawArgs(permit, ALICE_PK, address(vault));

    // Replace permit action arguments, now with the signature values.
    args[0] =
      abi.encode(address(vault), ALICE, address(connextRouter), withdrawAmount, deadline, v, r, s);

    vm.prank(ALICE);
    connextRouter.xBundle(actions, args);
  }
}
