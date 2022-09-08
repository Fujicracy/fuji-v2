// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IFlasher} from "../interfaces/IFlasher.sol";
import {IRouter} from "../interfaces/IRouter.sol";
import {MockERC20} from "./MockERC20.sol";

contract MockFlasher is IFlasher {
  using SafeERC20 for IERC20;

  function initiateFlashloan(FlashloanParams calldata params, uint8 providerId) external {
    providerId;

    MockERC20(params.asset).mint(address(this), params.amount);

    IERC20(params.asset).safeApprove(params.router, params.amount);
    // call back Router
    IRouter(params.router).xBundle(params.actions, params.args);
  }
}
