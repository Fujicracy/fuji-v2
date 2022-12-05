// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

interface ILens {
  function getCurrentSupplyBalanceInOf(
    address _poolToken,
    address _user
  )
    external
    view
    returns (uint256 balanceOnPool, uint256 balanceInP2P, uint256 totalBalance);

  function getCurrentBorrowBalanceInOf(
    address _poolToken,
    address _user
  )
    external
    view
    returns (uint256 balanceOnPool, uint256 balanceInP2P, uint256 totalBalance);

  /// Aave ///

  /// RATES ///

  function getAverageSupplyRatePerYear(address _poolToken)
    external
    view
    returns (uint256 avgSupplyRatePerYear, uint256 p2pSupplyAmount, uint256 poolSupplyAmount);

  function getAverageBorrowRatePerYear(address _poolToken)
    external
    view
    returns (uint256 avgBorrowRatePerYear, uint256 p2pBorrowAmount, uint256 poolBorrowAmount);

  /// Compound ///

  /// RATES ///

  function getAverageSupplyRatePerBlock(address _poolToken)
    external
    view
    returns (uint256 avgSupplyRatePerBlock, uint256 p2pSupplyAmount, uint256 poolSupplyAmount);

  function getAverageBorrowRatePerBlock(address _poolToken)
    external
    view
    returns (uint256 avgBorrowRatePerBlock, uint256 p2pBorrowAmount, uint256 poolBorrowAmount);
}
