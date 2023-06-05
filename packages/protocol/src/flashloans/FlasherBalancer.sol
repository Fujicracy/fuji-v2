// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title FlasherBalancer
 *
 * @author Fujidao Labs
 *
 * @notice Handles logic of Balancer as a flashloan provider.
 */

import {BaseFlasher} from "../abstracts/BaseFlasher.sol";
import {IFlasher} from "../interfaces/IFlasher.sol";
import {IBalancerVault} from "../interfaces/balancer/IBalancerVault.sol";
import {IFlashLoanRecipient} from "../interfaces/balancer/IFlashLoanRecipient.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IProtocolFeesCollector} from "../interfaces/balancer/IProtocolFeesCollector.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

contract FlasherBalancer is BaseFlasher, IFlashLoanRecipient {
  constructor(address balancerVault) BaseFlasher("FlasherBalancer", balancerVault) {}

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

    IERC20[] memory tokens = new IERC20[](1);
    tokens[0] = IERC20(asset);
    uint256[] memory amounts = new uint256[](1);
    amounts[0] = amount;

    IBalancerVault(getFlashloanSourceAddr(asset)).flashLoan(this, tokens, amounts, data);
  }

  /// @inheritdoc IFlasher
  function computeFlashloanFee(
    address asset,
    uint256 amount
  )
    external
    view
    override
    returns (uint256 fee)
  {
    uint256 feePercentage = IBalancerVault(getFlashloanSourceAddr(asset)).getProtocolFeesCollector()
      .getFlashLoanFeePercentage();
    fee = amount * feePercentage / 1e18;
  }

  /// @inheritdoc IFlashLoanRecipient
  function receiveFlashLoan(
    IERC20[] memory tokens,
    uint256[] memory amounts,
    uint256[] memory feeAmounts,
    bytes calldata userData
  )
    external
  {
    (address asset, uint256 amount, address requestor, bytes memory requestorCalldata) =
      _checkReentryPoint(userData);

    if (
      address(tokens[0]) != asset || amounts[0] != amount
        || msg.sender != getFlashloanSourceAddr(asset)
    ) {
      revert BaseFlasher__notAuthorized();
    }

    _requestorExecution(address(tokens[0]), amounts[0], feeAmounts[0], requestor, requestorCalldata);

    SafeERC20.safeTransfer(tokens[0], getFlashloanSourceAddr(asset), amounts[0] + feeAmounts[0]);
  }
}
