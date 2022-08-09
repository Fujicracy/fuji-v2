// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

abstract contract PriceOracle {
  /// @notice Indicator that this is a PriceOracle contract (for inspection)
  bool public constant isPriceOracle = true;

  /**
   * @notice Get the price of a token
   * @param token The token to get the price of
   * @return The asset price mantissa (scaled by 1e18).
   *  Zero means the price is unavailable.
   */
  function getTokenPrice(address token) external view virtual returns (uint256);
}
