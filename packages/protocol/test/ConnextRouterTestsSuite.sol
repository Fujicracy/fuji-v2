// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console2.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IExecutor} from "nxtp/core/connext/interfaces/IExecutor.sol";
import {Setup} from "./utils/Setup.sol";
import {IVault} from "../src/interfaces/IVault.sol";
import {IRouter} from "../src/interfaces/IRouter.sol";

contract ConnextRouterTestsSuite is Setup {
  event Dispatch(bytes32 leaf, uint256 index, bytes32 root, bytes message);

  function test_bridgeOutbound() public {
    uint256 amount = 2 ether;
    deal(connextWETH, alice, amount);
    assertEq(IERC20(connextWETH).balanceOf(alice), amount);

    vm.startPrank(alice);

    SafeERC20.safeApprove(IERC20(connextWETH), address(connextRouter), type(uint256).max);

    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);

    actions[0] = IRouter.Action.XTransferWithCall;
    args[0] = abi.encode(destDomain, connextWETH, amount, "");

    vm.expectEmit(false, false, false, false);
    emit Dispatch("", 1, "", "");

    connextRouter.xBundle(actions, args);
  }

  event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares);

  event Borrow(address indexed caller, address indexed owner, uint256 debt, uint256 shares);

  function test_bridgeInbound() public {
    uint256 amount = 2 ether;
    uint256 borrowAmount = 1000e6;

    address executor = address(connextHandler.executor());

    IRouter.Action[] memory actions = new IRouter.Action[](2);
    actions[0] = IRouter.Action.Deposit;
    actions[1] = IRouter.Action.Borrow;

    bytes[] memory args = new bytes[](2);
    args[0] = abi.encode(address(vault), amount, alice, executor);
    args[1] = abi.encode(address(vault), borrowAmount, alice, alice);

    bytes memory params = abi.encode(actions, args);
    bytes4 selector = bytes4(keccak256("inboundXCall(bytes)"));
    bytes memory callData = abi.encodeWithSelector(selector, params);

    vm.expectEmit(true, true, true, false);
    emit Deposit(address(connextRouter), alice, amount, amount);

    vm.expectEmit(true, true, true, false);
    emit Borrow(address(connextRouter), alice, borrowAmount, borrowAmount);

    IExecutor.ExecutorArgs memory execArgs = IExecutor.ExecutorArgs({
      assetId: collateralAsset,
      amount: amount,
      to: address(connextRouter),
      callData: callData,
      transferId: "",
      recovery: address(0),
      originSender: address(connextRouter),
      originDomain: originDomain
    });
    vm.expectCall(address(connextRouter), callData);

    // connext has to send to the executor "amount"
    // before calling it
    deal(collateralAsset, executor, amount);
    vm.startPrank(address(connextHandler));
    IExecutor(executor).execute(execArgs);

    assertEq(vault.balanceOf(alice), amount);
  }
}
