// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title IEulerMarkets
 *
 * @author Euler
 *
 * @notice Interface to interact with Euler markets.
 */

interface IEulerMarkets {
  function activateMarket(address underlying) external returns (address);

  function underlyingToEToken(address underlying) external view returns (address);

  function underlyingToDToken(address underlying) external view returns (address);

  function eTokenToUnderlying(address eToken) external view returns (address underlying);

  function dTokenToUnderlying(address dToken) external view returns (address underlying);

  function eTokenToDToken(address eToken) external view returns (address dTokenAddr);

  function interestRate(address underlying) external view returns (int96);

  function enterMarket(uint256 subAccountId, address newMarket) external;
}
