// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title IComptroller
 * @author Compound
 */
interface IComptroller {
  function enterMarkets(address[] calldata) external returns (uint256[] memory);

  function exitMarket(address cyTokenAddress) external returns (uint256);

  function claimComp(address holder) external;
}
