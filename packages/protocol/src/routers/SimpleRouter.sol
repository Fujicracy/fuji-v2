// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title SimpleRouter
 *
 * @author Fujidao Labs
 *
 * @notice A Router contract without any bridging logic.
 * It facilitates tx bundling meant to be executed on a single chain.
 */

import {BaseRouter} from "../abstracts/BaseRouter.sol";
import {IWETH9} from "../abstracts/WETH9.sol";
import {IVault} from "../interfaces/IVault.sol";
import {IChief} from "../interfaces/IChief.sol";

contract SimpleRouter is BaseRouter {
  /// @dev Custom Errors
  error SimpleRouter__noCrossTransfersImplemented();

  constructor(IWETH9 weth, IChief chief) BaseRouter(weth, chief) {}

  /// @inheritdoc BaseRouter
  function _crossTransfer(bytes memory params) internal pure override {
    params;
    revert SimpleRouter__noCrossTransfersImplemented();
  }

  /// @inheritdoc BaseRouter
  function _crossTransferWithCalldata(bytes memory params) internal pure override {
    params;
    revert SimpleRouter__noCrossTransfersImplemented();
  }
}
