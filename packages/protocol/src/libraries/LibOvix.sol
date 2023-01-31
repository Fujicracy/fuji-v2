// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title Ovix latest ICToken data.
 *
 * @author Fujidao Labs
 *
 * @notice This implementation is modifed from "./LibCompoundV2".
 * @notice Inspired and modified from Transmissions11 (https://github.com/transmissions11/libcompound).
 */

import {LibSolmateFixedPointMath} from "./LibSolmateFixedPointMath.sol";
import {ICToken} from "../interfaces/Ovix/ICToken.sol";

library LibOvix {
  using LibSolmateFixedPointMath for uint256;

  /**
   * @param cToken {ICToken} 0vix's cToken associated with the user's position
   * @param user address of the user
   *
   * @dev Returns the current collateral balance of user.
   */
  function viewUnderlyingBalanceOf(ICToken cToken, address user) internal view returns (uint256) {
    return cToken.balanceOf(user).mulWadDown(viewExchangeRate(cToken));
  }

  /**
   * @param cToken {ICToken} 0vix's cToken associated with the user's position
   * @param user address of the user
   *
   * @dev Returns the current borrow balance of user.
   */
  function viewBorrowingBalanceOf(ICToken cToken, address user) internal view returns (uint256) {
    uint256 borrowIndexPrior = cToken.borrowIndex();
    uint256 borrowIndex = viewNewBorrowIndex(cToken);
    uint256 storedBorrowBalance = cToken.borrowBalanceStored(user);
    return ((storedBorrowBalance * borrowIndex) / borrowIndexPrior);
  }

  /**
   * @param cToken {ICToken} 0vix's cToken associated with the user's position
   *
   * @dev Returns the current exchange rate for a given cToken.
   * @dev 0vix's cToken uses accrualBlockTimestamp instead of accrualBlockNumber (like compound does).
   */
  function viewExchangeRate(ICToken cToken) internal view returns (uint256) {
    uint256 accrualBlockTimestampPrior = cToken.accrualBlockTimestamp();

    if (accrualBlockTimestampPrior == block.timestamp) return cToken.exchangeRateStored();

    uint256 totalCash = cToken.getCash();
    uint256 borrowsPrior = cToken.totalBorrows();
    uint256 reservesPrior = cToken.totalReserves();

    uint256 borrowRateMantissa = cToken.borrowRatePerTimestamp();

    // Same as borrowRateMaxMantissa in ICTokenInterfaces.sol
    require(borrowRateMantissa <= 0.0005e16, "RATE_TOO_HIGH");

    uint256 interestAccumulated =
      (borrowRateMantissa * (block.timestamp - accrualBlockTimestampPrior)).mulWadDown(borrowsPrior);

    uint256 totalReserves =
      cToken.reserveFactorMantissa().mulWadDown(interestAccumulated) + reservesPrior;
    uint256 totalBorrows = interestAccumulated + borrowsPrior;
    uint256 totalSupply = cToken.totalSupply();

    // Reverts if totalSupply == 0
    return (totalCash + totalBorrows - totalReserves).divWadDown(totalSupply);
  }

  /**
   * @param cToken {ICToken} 0vix's cToken associated with the user's position
   *
   * @dev Returns the current borrow index for a given cToken.
   * @dev 0vix's cToken uses accrualBlockTimestamp instead of accrualBlockNumber (like compound does).
   */
  function viewNewBorrowIndex(ICToken cToken) internal view returns (uint256 newBorrowIndex) {
    // Remember the initial block timestamp
    uint256 currentBlockTimestamp = block.timestamp;
    uint256 accrualBlockTimestampPrior = cToken.accrualBlockTimestamp();

    // Read the previous values out of storage
    uint256 borrowIndexPrior = cToken.borrowIndex();

    // Short-circuit accumulating 0 interest
    if (accrualBlockTimestampPrior == currentBlockTimestamp) {
      newBorrowIndex = borrowIndexPrior;
    }

    // Calculate the current borrow interest rate
    uint256 borrowRateMantissa = cToken.borrowRatePerTimestamp();

    // Same as borrowRateMaxMantissa in ICTokenInterfaces.sol
    require(borrowRateMantissa <= 0.0005e16, "RATE_TOO_HIGH");
    // Calculate the number of timestamps elapsed since the last accrual
    uint256 blockDelta = currentBlockTimestamp - accrualBlockTimestampPrior;

    uint256 simpleInterestFactor = borrowRateMantissa * blockDelta;
    newBorrowIndex = (simpleInterestFactor * borrowIndexPrior) / 1e18 + borrowIndexPrior;
  }
}
