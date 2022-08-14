// SPDX-License-Identifier: GPL-2.0-or-later

pragma solidity ^0.8.9;

import {IRouter} from "./IRouter.sol";

interface IFlasher {
  struct FlashloanParams {
    address asset;
    uint256 amount;
    address router;
    IRouter.Action[] actions;
    bytes[] args;
  }

  function initiateFlashloan(FlashloanParams calldata params, uint8 providerId) external;
}
