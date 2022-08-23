// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

interface IWETH {
  function approve(address, uint256) external;

  function deposit() external payable;

  function withdraw(uint256) external;
}
