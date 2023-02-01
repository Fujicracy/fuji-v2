// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

/**
 * @title MockFlasher
 *
 * @author Fuijdao Labs
 *
 * @notice Mock implementation of the a flasher contract.
 *
 * @dev Mock mints the flashloaned amount,
 * and charges no fee.
 */

import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IFlasher} from "../interfaces/IFlasher.sol";
import {MockERC20} from "./MockERC20.sol";
import {Address} from "openzeppelin-contracts/contracts/utils/Address.sol";

contract MockFlasher is IFlasher {
  using SafeERC20 for IERC20;
  using Address for address;

  /// @inheritdoc IFlasher
  function initiateFlashloan(
    address asset,
    uint256 amount,
    address requestor,
    bytes memory requestorCalldata
  )
    external
  {
    MockERC20(asset).mint(address(this), amount);
    IERC20(asset).safeTransfer(requestor, amount);
    requestor.functionCall(requestorCalldata);
  }

  /// @inheritdoc IFlasher
  function getFlashloanSourceAddr(address) external view override returns (address) {
    return address(this);
  }

  /// @inheritdoc IFlasher
  function computeFlashloanFee(address, uint256) external pure override returns (uint256 fee) {
    fee = 0;
  }
}
