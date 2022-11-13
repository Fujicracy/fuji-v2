// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/// @notice Activating and querying markets, and maintaining entered markets lists
interface IEulerMarkets {
  /// @notice Create an Euler pool and associated EToken and DToken addresses.
  /// @param underlying The address of an ERC20-compliant token. There must be an initialised uniswap3 pool for the underlying/reference asset pair.
  /// @return The created EToken, or the existing EToken if already activated.
  function activateMarket(address underlying) external returns (address);

  /// @notice Given an underlying, lookup the associated EToken
  /// @param underlying Token address
  /// @return EToken address, or address(0) if not activated
  function underlyingToEToken(address underlying) external view returns (address);

  /// @notice Given an underlying, lookup the associated DToken
  /// @param underlying Token address
  /// @return DToken address, or address(0) if not activated
  function underlyingToDToken(address underlying) external view returns (address);

  /// @notice Given an EToken address, looks up the associated underlying
  /// @param eToken EToken address
  /// @return underlying Token address
  function eTokenToUnderlying(address eToken) external view returns (address underlying);

  /// @notice Given a DToken address, looks up the associated underlying
  /// @param dToken DToken address
  /// @return underlying Token address
  function dTokenToUnderlying(address dToken) external view returns (address underlying);

  /// @notice Given an EToken address, looks up the associated DToken
  /// @param eToken EToken address
  /// @return dTokenAddr DToken address
  function eTokenToDToken(address eToken) external view returns (address dTokenAddr);

  /// @notice Retrieves the current interest rate for an asset
  /// @param underlying Token address
  /// @return The interest rate in yield-per-second, scaled by 10**27
  function interestRate(address underlying) external view returns (int96);

  /// @notice Add an asset to the entered market list, or do nothing if already entered
  /// @param subAccountId 0 for primary, 1-255 for a sub-account
  /// @param newMarket Underlying token address
  function enterMarket(uint256 subAccountId, address newMarket) external;
}
