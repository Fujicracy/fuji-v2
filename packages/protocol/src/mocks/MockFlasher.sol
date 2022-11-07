// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IFlasher} from "../interfaces/IFlasher.sol";
import {IRouter} from "../interfaces/IRouter.sol";
import {MockERC20} from "./MockERC20.sol";

contract MockFlasher is IFlasher {
  using SafeERC20 for IERC20;

  function initiateFlashloan(FlashloanType flashloanType, bytes calldata params) external {
    if (flashloanType == FlashloanType.Normal) {
      (NormalParams memory normalParams) = abi.decode(params, (NormalParams));
      MockERC20(normalParams.asset).mint(address(this), normalParams.amount);
    } else {
      (RouterParams memory routerParams) = abi.decode(params, (RouterParams));
      MockERC20(routerParams.asset).mint(address(this), routerParams.amount);
      IERC20(routerParams.asset).safeApprove(routerParams.router, routerParams.amount);
      // call back Router
      IRouter(routerParams.router).xBundle(routerParams.actions, routerParams.args);
    }
  }

  function getFlashloanSourceAddr(address) external view override returns (address) {
    return address(this);
  }

  function computeFlashloanFee(address, uint256) external pure override returns (uint256 fee) {
    fee = 0;
  }
}
