// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.9;

/**
 * @title SimpleRouter.
 * @author Fujidao Labs
 * @notice A Router contract without any bridging logic.
 * It facilitates tx bundling meant to be executed on a single chain.
 */

import {BaseRouter} from "../abstracts/BaseRouter.sol";
import {IWETH9, ERC20} from "../helpers/PeripheryPayments.sol";
import {IVault} from "../interfaces/IVault.sol";
import {IFlasher} from "../interfaces/IFlasher.sol";

contract SimpleRouter is BaseRouter {
  error SimpleRouter__noCrossTransfersImplemented();

  IFlasher public flasher;

  constructor(IWETH9 weth, IFlasher _flasher) BaseRouter(weth) {
    flasher = _flasher;
  }

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

  function _initiateFlashloan(bytes memory params) internal override {
    // Decode params
    (IFlasher.FlashloanParams memory flParams, uint8 providerId) =
      abi.decode(params, (IFlasher.FlashloanParams, uint8));

    // Call Flasher
    flasher.initiateFlashloan(flParams, providerId);
  }

  function setFlasher(IFlasher newFlasher) external {
    // TODO onlyOwner
    flasher = newFlasher;
  }

  // TODO replace this with safeIncreaseAllowance in xBundle
  function registerVault(IVault vault) external {
    // TODO onlyOwner
    address asset = vault.asset();
    approve(ERC20(asset), address(vault), type(uint256).max);

    address debtAsset = vault.debtAsset();
    approve(ERC20(debtAsset), address(vault), type(uint256).max);
  }
}
