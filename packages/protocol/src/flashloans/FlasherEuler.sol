// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title FlasherEuler
 * @author Fujidao Labs
 * @notice Handles logic of Euler as a flashloan provider.
 */

import "forge-std/console.sol";
import {BaseFlasher} from "../abstracts/BaseFlasher.sol";
import {IEulerDToken} from "../interfaces/euler/IEulerDToken.sol";
import {IFlashloan} from "../interfaces/euler/IFlashloan.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IEulerMarkets} from "../interfaces/euler/IEulerMarkets.sol";

contract FlasherEuler is BaseFlasher, IFlashloan {
  // IEuler mainnet = 0x27182842E098f60e3D576794A5bFFb0777E025d3
  constructor(address euler) BaseFlasher("FlasherEuler", euler) {}

  /// @inheritdoc BaseFlasher
  function initiateFlashloan(
    address asset,
    uint256 amount,
    address requestor,
    bytes memory requestorCalldata
  )
    external
    override
  {
    bytes memory data = abi.encode(asset, amount, requestor, requestorCalldata);
    _checkAndSetEntryPoint(data);

    IEulerDToken dToken = IEulerDToken(
      IEulerMarkets(0x3520d5a913427E6F0D6A83E07ccD4A4da316e4d3).underlyingToDToken(asset)
    );
    dToken.flashLoan(amount, data);
  }

  function computeFlashloanFee(
    address asset,
    uint256 amount
  )
    external
    view
    override
    returns (uint256 fee)
  {
    fee = 0;
  }

  function onFlashLoan(bytes calldata data) external {
    //this check is being done by the if() revert
    // require(msg.sender == 0x27182842E098f60e3D576794A5bFFb0777E025d3, "not allowed");

    (address asset, uint256 amount, address requestor, bytes memory requestorCalldata) =
      _checkReentryPoint(data);

    if (msg.sender != getFlashloanSourceAddr(asset)) {
      revert BaseFlasher__notAuthorized();
    }
    _requestorExecution(asset, amount, 0, requestor, requestorCalldata);

    //the repay is done in the _requestorExecution??
    //only the approve is done in the requestor execution??
    IERC20(asset).transfer(msg.sender, amount); // repay
  }
}
