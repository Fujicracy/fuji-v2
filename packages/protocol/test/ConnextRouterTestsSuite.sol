// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/console2.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IExecutor} from "nxtp/core/connext/interfaces/IExecutor.sol";
import {Setup} from "./utils/Setup.sol";
import {IVault} from "../src/interfaces/IVault.sol";
import {IRouter} from "../src/interfaces/IRouter.sol";
import {LibConnextBundler} from "../src/libraries/LibConnextBundler.sol";

contract ConnextRouterTestsSuite is Setup {
  function testBridgeOutbound() public {
    address alice = address(0xA);
    vm.label(address(alice), "alice");

    uint256 amount = 2 ether;
    uint256 borrowAmount = 1000e6;
    deal(address(weth), alice, amount);
    assertEq(weth.balanceOf(alice), amount);

    /*deal(address(weth), address(connextRouter), 10e18);*/

    vm.startPrank(alice);

    SafeERC20.safeApprove(IERC20(address(weth)), address(connextRouter), type(uint256).max);

    uint256 domain = connextHandler.domain();
    uint256 destDomain = domain == 3331 ? 1111 : 3331;
    (IRouter.Action[] memory actions, bytes[] memory args) = LibConnextBundler
      .bridgeDepositAndBorrow(destDomain, address(0), address(weth), amount, borrowAmount);

    connextRouter.xBundle(actions, args);
  }

  function testBridgeInbound() public {
    address alice = address(0xA);
    uint256 amount = 2 ether;
    uint256 borrowAmount = 1000e6;

    uint256 domain = connextHandler.domain();
    address executor = address(connextHandler.executor());

    vm.mockCall(
      executor,
      abi.encodeWithSelector(IExecutor(executor).originSender.selector),
      abi.encode(address(0xAbc1))
    );
    vm.mockCall(
      executor,
      abi.encodeWithSelector(IExecutor(executor).origin.selector),
      abi.encode(domain == 3331 ? 1111 : 3331)
    );

    IRouter.Action[] memory actions = new IRouter.Action[](2);
    actions[0] = IRouter.Action.Deposit;
    actions[1] = IRouter.Action.Borrow;

    bytes[] memory args = new bytes[](2);
    args[0] = abi.encode(address(vault), amount, alice);
    args[1] = abi.encode(address(vault), borrowAmount, alice, alice);

    bytes memory params = abi.encode(actions, args);

    deal(address(weth), executor, amount);
    vm.startPrank(executor);
    // execute() function of the executor contains approval
    SafeERC20.safeApprove(IERC20(address(weth)), address(connextRouter), type(uint256).max);

    connextRouter.inboundXCall(params);
    assertEq(vault.balanceOf(alice), amount);
  }
}
