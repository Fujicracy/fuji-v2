// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title IFlashloan
 * @author Euler
 */
interface IFlashloan {
  function onFlashLoan(bytes memory data) external;
}
