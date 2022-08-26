// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

interface IPoolAddressProvider {
  function getPoolDataProvider() external view returns (address);

  function getPool() external view returns (address);
}
