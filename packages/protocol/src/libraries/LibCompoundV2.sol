// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {LibSolmateFixedPointMath} from "./LibSolmateFixedPointMath.sol";
import {ICToken} from "../interfaces/compoundV2/ICToken.sol";

/// @notice Get up to date ICToken data without mutating state.
/// @author Transmissions11 (https://github.com/transmissions11/libcompound)
library LibCompoundV2 {
  using LibSolmateFixedPointMath for uint256;

  function viewUnderlyingBalanceOf(ICToken cToken, address user) internal view returns (uint256) {
    return cToken.balanceOf(user).mulWadDown(viewExchangeRate(cToken));
  }

  function viewExchangeRate(ICToken cToken) internal view returns (uint256) {
    uint256 accrualBlockNumberPrior = cToken.accrualBlockNumber();

    if (accrualBlockNumberPrior == block.number) return cToken.exchangeRateStored();

    uint256 totalCash = cToken.getCash();
    uint256 borrowsPrior = cToken.totalBorrows();
    uint256 reservesPrior = cToken.totalReserves();

    uint256 borrowRateMantissa = cToken.borrowRatePerBlock();

    require(borrowRateMantissa <= 0.0005e16, "RATE_TOO_HIGH"); // Same as borrowRateMaxMantissa in ICTokenInterfaces.sol

    uint256 interestAccumulated =
      (borrowRateMantissa * (block.number - accrualBlockNumberPrior)).mulWadDown(borrowsPrior);

    uint256 totalReserves =
      cToken.reserveFactorMantissa().mulWadDown(interestAccumulated) + reservesPrior;
    uint256 totalBorrows = interestAccumulated + borrowsPrior;
    uint256 totalSupply = cToken.totalSupply();

    // Reverts if totalSupply == 0
    return (totalCash + totalBorrows - totalReserves).divWadDown(totalSupply);
  }
}
