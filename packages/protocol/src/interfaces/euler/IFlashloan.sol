// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/// @notice Definition of callback method that flashLoan will invoke on your contract
interface IFlashloan {
  function onFlashLoan(bytes memory data) external;
}
