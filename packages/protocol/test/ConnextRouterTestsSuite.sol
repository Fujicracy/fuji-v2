// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console2.sol";
import {Setup} from "./utils/Setup.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IConnext} from "../src/interfaces/connext/IConnext.sol";
import {IVault} from "../src/interfaces/IVault.sol";
import {IRouter} from "../src/interfaces/IRouter.sol";

contract ConnextRouterTestsSuite is Setup {
  event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares);

  event Borrow(
    address indexed sender,
    address indexed receiver,
    address indexed owner,
    uint256 debt,
    uint256 shares
  );

  event Dispatch(bytes32 leaf, uint256 index, bytes32 root, bytes message);

  function test_bridgeOutbound() public {
    uint256 amount = 0.002 ether;
    deal(collateralAsset, alice, amount);

    uint32 destDomain = originDomain == GOERLI_DOMAIN ? OPTIMISM_GOERLI_DOMAIN : GOERLI_DOMAIN;

    vm.startPrank(alice);

    SafeERC20.safeApprove(IERC20(collateralAsset), address(connextRouter), type(uint256).max);

    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);

    actions[0] = IRouter.Action.XTransferWithCall;
    bytes memory randomData = abi.encode(keccak256("data_data"));
    args[0] = abi.encode(destDomain, collateralAsset, amount, randomData);

    /*bytes4 selector =*/
    /*bytes4(keccak256("xCall(uint32,address,address,address,uint256,uint256,bytes)"));*/
    /*bytes memory callData = abi.encodeWithSelector(*/
    /*selector,*/
    /*destDomain,*/
    /*connextRouter.routerByDomain(destDomain),*/
    /*collateralAsset,*/
    /*alice,*/
    /*amount,*/
    /*30,*/
    /*randomData*/
    /*);*/

    /*vm.expectCall(address(connext), "");*/

    vm.expectEmit(false, false, false, false);
    emit Dispatch("", 1, "", "");

    connextRouter.xBundle(actions, args);
  }

  function test_bridgeInbound() public {
    uint256 amount = 2 ether;
    uint256 borrowAmount = 1000e6;

    IRouter.Action[] memory actions = new IRouter.Action[](3);
    actions[0] = IRouter.Action.Deposit;
    actions[1] = IRouter.Action.PermitBorrow;
    actions[2] = IRouter.Action.Borrow;

    bytes[] memory args = new bytes[](3);
    args[0] = abi.encode(address(vault), amount, alice, address(connextRouter));

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _utils_getPermitBorrowArgs(alice, address(connextRouter), borrowAmount, 0, address(vault));

    args[1] =
      abi.encode(address(vault), alice, address(connextRouter), borrowAmount, deadline, v, r, s);

    args[2] = abi.encode(address(vault), borrowAmount, alice, alice);

    bytes memory callData = abi.encode(actions, args);

    vm.expectEmit(true, true, true, false);
    emit Deposit(address(connextRouter), alice, amount, amount);

    vm.expectEmit(true, true, true, false);
    emit Borrow(address(connextRouter), alice, alice, borrowAmount, borrowAmount);

    // send directly the bridged funds to our router
    // thus mocking Connext behavior
    deal(collateralAsset, address(connextRouter), amount);
    address originSender = connextRouter.routerByDomain(originDomain);

    vm.startPrank(address(connext));
    connextRouter.xReceive("", 0, address(0), originSender, originDomain, callData);

    assertEq(vault.balanceOf(alice), amount);
  }
}
