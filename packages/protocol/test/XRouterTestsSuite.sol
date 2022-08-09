// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {Setup} from "./utils/Setup.sol";
import {SafeTransferLib} from "solmate/utils/SafeTransferLib.sol";
import {IExecutor} from "nxtp/core/connext/interfaces/IExecutor.sol";
import {IVault} from "../src/interfaces/IVault.sol";
import {XRouter} from "../src/XRouter.sol";

interface IMintable {
  function mint(address, uint256) external;
}

contract XRouterTestsSuite is Setup {
  function testBridgeOutbound() public {
    address userChainA = address(0xA);
    vm.label(address(userChainA), "userChainA");

    uint256 amount = 2 ether;
    uint256 borrowAmount = 1000000000;
    IMintable(address(weth)).mint(userChainA, amount);
    assertEq(weth.balanceOf(userChainA), amount);

    vm.startPrank(userChainA);

    SafeTransferLib.safeApprove(weth, address(router), type(uint256).max);
    uint256 domain = connextHandler.domain();
    router.bridgeDepositAndBorrow(
      domain == 3331 ? 1111 : 3331, address(vault), address(weth), amount, borrowAmount
    );
  }

  function testBridgeInbound() public {
    address userChainA = address(0xA);
    uint256 amount = 2 ether;
    uint256 borrowAmount = 1000000000;

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
    IMintable(connextTestToken).mint(executor, amount);

    XRouter.Action[] memory actions = new XRouter.Action[](2);
    actions[0] = XRouter.Action.Deposit;
    actions[1] = XRouter.Action.Borrow;

    bytes[] memory args = new bytes[](2);
    args[0] = abi.encode(amount, userChainA);
    args[1] = abi.encode(borrowAmount, userChainA, userChainA);

    bytes memory params = abi.encode(address(vault), asset, amount, actions, args);

    vm.startPrank(executor);
    // execute() function of the executor contains approval
    ERC20(connextTestToken).approve(address(router), type(uint256).max);

    router.bridgeCall(domain == 3331 ? 1111 : 3331, params);
    assertEq(vault.balanceOf(userChainA), amount);
  }
}
