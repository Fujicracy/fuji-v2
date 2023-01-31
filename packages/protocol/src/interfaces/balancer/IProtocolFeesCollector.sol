// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity 0.8.15;

/**
 * @title IProtocolFeesCollector
 *
 * @author Balancer
 *
 * @notice Required interface to estimate cost of
 * flashloan in Balancer.
 */

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

interface IProtocolFeesCollector {
  event FlashLoanFeePercentageChanged(uint256 newFlashLoanFeePercentage);

  function getFlashLoanFeePercentage() external view returns (uint256);
}
