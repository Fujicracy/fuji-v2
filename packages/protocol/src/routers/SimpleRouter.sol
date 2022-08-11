// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.9;

import {BaseRouter} from "../abstracts/BaseRouter.sol";
import {IWETH9} from "../helpers/PeripheryPayments.sol";

contract SimpleRouter is BaseRouter {
  error SimpleRouter__noCrossTransfersImplemented();

  constructor(IWETH9 weth) BaseRouter(weth) {}

  function onXCall(bytes memory params) external pure {
    params;
    revert SimpleRouter__noCrossTransfersImplemented();
  }

  function _crossTransfer(bytes memory params) internal pure override {
    params;
    revert SimpleRouter__noCrossTransfersImplemented();
  }

  function _crossTransferWithCalldata(bytes memory params) internal pure override {
    params;
    revert SimpleRouter__noCrossTransfersImplemented();
  }
}
