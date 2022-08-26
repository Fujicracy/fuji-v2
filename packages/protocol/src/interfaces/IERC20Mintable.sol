// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

// -------> On testnet ONLY
interface IERC20Mintable {
  function mint(address to, uint256 amount) external;

  function burn(uint256 amount) external;
} // <--------
