// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title SimpleRouter.
 * @author Fujidao Labs
 * @notice A Router contract without any bridging logic.
 * It facilitates tx bundling meant to be executed on a single chain.
 */

import {BaseRouter} from "../abstracts/BaseRouter.sol";
import {IWETH9, ERC20} from "../helpers/PeripheryPayments.sol";
import {IVault} from "../interfaces/IVault.sol";

contract SimpleRouter is BaseRouter {
  error SimpleRouter__noCrossTransfersImplemented();

  constructor(IWETH9 weth) BaseRouter(weth) {}

  function inboundXCall(bytes memory params) external pure {
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
