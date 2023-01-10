// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {LibSolmateFixedPointMath} from "./LibSolmateFixedPointMath.sol";
import {ICToken} from "../interfaces/compoundV2/ICToken.sol";

/**
 * @title CompoundV2 latest ICToken data.
 * @author Fujidao Labs
 * @notice Inspired and modified from Transmissions11 (https://github.com/transmissions11/libcompound)
 */
library LibIronBankOptimism {
  using LibSolmateFixedPointMath for uint256;

  function viewUnderlyingBalanceOf(ICToken cToken, address user) internal view returns (uint256) {
    return cToken.balanceOf(user).mulWadDown(viewExchangeRate(cToken));
  }

  function viewBorrowingBalanceOf(ICToken cToken, address user) internal view returns (uint256) {
    uint256 borrowIndexPrior = cToken.borrowIndex();
    uint256 borrowIndex = viewNewBorrowIndex(cToken);
    uint256 storedBorrowBalance = cToken.borrowBalanceStored(user);
    return ((storedBorrowBalance * borrowIndex) / borrowIndexPrior);
  }

  function viewExchangeRate(ICToken cToken) internal view returns (uint256) {
    uint256 accrualBlockNumberPrior = cToken.accrualBlockNumber();

    if (accrualBlockNumberPrior == block.timestamp) return cToken.exchangeRateStored();

    uint256 totalCash = cToken.getCash();
    uint256 borrowsPrior = cToken.totalBorrows();
    uint256 reservesPrior = cToken.totalReserves();

    uint256 borrowRateMantissa = cToken.borrowRatePerBlock();

    require(borrowRateMantissa <= 0.0005e16, "RATE_TOO_HIGH"); // Same as borrowRateMaxMantissa in ICTokenInterfaces.sol

    uint256 interestAccumulated =
      (borrowRateMantissa * (block.timestamp - accrualBlockNumberPrior)).mulWadDown(borrowsPrior);

    uint256 totalReserves =
      cToken.reserveFactorMantissa().mulWadDown(interestAccumulated) + reservesPrior;
    uint256 totalBorrows = interestAccumulated + borrowsPrior;
    uint256 totalSupply = cToken.totalSupply();

    // Reverts if totalSupply == 0
    return (totalCash + totalBorrows - totalReserves).divWadDown(totalSupply);
  }

  function viewNewBorrowIndex(ICToken cToken) internal view returns (uint256 newBorrowIndex) {
    /* Remember the initial block timestamp */
    uint256 currentBlockNumber = block.timestamp;
    uint256 accrualBlockNumberPrior = cToken.accrualBlockNumber();

    /* Read the previous values out of storage */
    uint256 borrowIndexPrior = cToken.borrowIndex();

    /* Short-circuit accumulating 0 interest */
    if (accrualBlockNumberPrior == currentBlockNumber) {
      newBorrowIndex = borrowIndexPrior;
    }

    /* Calculate the current borrow interest rate */
    uint256 borrowRateMantissa = cToken.borrowRatePerBlock();
    require(borrowRateMantissa <= 0.0005e16, "RATE_TOO_HIGH"); // Same as borrowRateMaxMantissa in ICTokenInterfaces.sol

    /* Calculate the number of blocks elapsed since the last accrual */
    uint256 blockDelta = currentBlockNumber - accrualBlockNumberPrior;

    uint256 simpleInterestFactor = borrowRateMantissa * blockDelta;
    newBorrowIndex = (simpleInterestFactor * borrowIndexPrior) / 1e18 + borrowIndexPrior;
  }
}
