// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title FlasherAaveV3s
 * @author Fujidao Labs
 * @notice Handles logic of AaveV3 as a flashloan provider.
 */

import {BaseFlasher} from "../abstracts/BaseFlasher.sol";
import {IV3Pool} from "../interfaces/aaveV3/IV3Pool.sol";
import {IFlashLoanSimpleReceiver} from "../interfaces/aaveV3/IFlashLoanSimpleReceiver.sol";

contract FlasherAaveV3 is BaseFlasher, IFlashLoanSimpleReceiver {
  // aaveV3Pool Goerli = 0x368EedF3f56ad10b9bC57eed4Dac65B26Bb667f6
  constructor(address aaveV3Pool) BaseFlasher("FlasherAaveV3", aaveV3Pool) {}

  /// @inheritdoc BaseFlasher
  function initiateFlashloan(FlashloanType flashloanType, bytes calldata params) external override {
    bytes memory data = _checkAndSetEntryPoint(flashloanType, params);
    address receiverAddress = address(this);

    if (flashloanType == FlashloanType.Normal) {
      (NormalParams memory normalParams) = abi.decode(params, (NormalParams));
      // AaveV3 Flashloan call.
      IV3Pool(getFlashloanSourceAddr(normalParams.asset)).flashLoanSimple(
        receiverAddress, normalParams.asset, normalParams.amount, data, 0
      );
    } else if (flashloanType == FlashloanType.Router) {
      (RouterParams memory routerParams) = abi.decode(params, (RouterParams));
      // AaveV3 Flashloan call.
      IV3Pool(getFlashloanSourceAddr(routerParams.asset)).flashLoanSimple(
        receiverAddress, routerParams.asset, routerParams.amount, data, 0
      );
    } else {
      revert BaseFlasher__invalidFlashloanType();
    }
  }

  function computeFlashloanFee(address, uint256) external view override returns (uint256 fee) {
    // TODO proper implementation of this method
  }

  /**
   * @dev Callback enforced by AaveV3 Flashloan
   */
  function executeOperation(
    address asset,
    uint256 amount,
    uint256 premium,
    address initiator,
    bytes calldata data
  )
    external
    override
    returns (bool success)
  {
    _checkReentryPoint(data);

    if (msg.sender != getFlashloanSourceAddr(asset) || initiator != address(this)) {
      revert BaseFlasher__notAuthorized();
    }

    (FlashloanType flashloanType, bytes memory moreParams) =
      abi.decode(data, (FlashloanType, bytes));

    if (flashloanType == FlashloanType.Normal) {
      _normalOperation(asset, amount, premium, moreParams);
    } else if (flashloanType == FlashloanType.Router) {
      _routerOperation(asset, amount, premium, moreParams);
    } else {
      revert BaseFlasher__invalidFlashloanType();
    }
    success = true;
  }
}
