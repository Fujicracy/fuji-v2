// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title IFlashloan
 *
 * @author Euler
 *
 * @notice Interface to implement on receiver
 * of an Euler flashloan.
 */

interface IFlashloan {
  function onFlashLoan(bytes memory data) external;
}
