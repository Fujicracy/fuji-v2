// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title LibCompoundV2
 *
 * @author Fujidao Labs
 *
 * @notice This library implements workaround methods to compute
 * the latest state (of interest accroual) without having to call
 * change state methods directly on Compound.
 *
 * @dev Inspired and modified from Transmissions11
 * (https://github.com/transmissions11/libcompound)
 */

import {LibSolmateFixedPointMath} from "./LibSolmateFixedPointMath.sol";
import {ICToken} from "../interfaces/compoundV2/ICToken.sol";

library LibCompoundV2 {
  using LibSolmateFixedPointMath for uint256;

  /**
   * @dev Returns the current collateral balance of user.
   *
   * @param cToken {ICToken} compound's cToken associated with the user's position
   * @param user address of the user
   */
  function viewUnderlyingBalanceOf(ICToken cToken, address user) internal view returns (uint256) {
    return cToken.balanceOf(user).mulWadDown(viewExchangeRate(cToken));
  }

  /**
   * @dev Returns the current borrow balance of user.
   *
   * @param cToken {ICToken} compound's cToken associated with the user's position
   * @param user address of the user
   */
  function viewBorrowingBalanceOf(ICToken cToken, address user) internal view returns (uint256) {
    uint256 borrowIndexPrior = cToken.borrowIndex();
    uint256 borrowIndex = viewNewBorrowIndex(cToken);
    uint256 storedBorrowBalance = cToken.borrowBalanceStored(user);
    return ((storedBorrowBalance * borrowIndex) / borrowIndexPrior);
  }

  /**
   * @dev Returns the current exchange rate for a given cToken.
   *
   * @param cToken {ICToken} compound's cToken associated with the user's position
   */
  function viewExchangeRate(ICToken cToken) internal view returns (uint256) {
    uint256 accrualBlockNumberPrior = cToken.accrualBlockNumber();

    if (accrualBlockNumberPrior == block.number) return cToken.exchangeRateStored();

    uint256 totalCash = cToken.getCash();
    uint256 borrowsPrior = cToken.totalBorrows();
    uint256 reservesPrior = cToken.totalReserves();

    uint256 borrowRateMantissa = cToken.borrowRatePerBlock();

    // Same as borrowRateMaxMantissa in ICTokenInterfaces.sol
    require(borrowRateMantissa <= 0.0005e16, "RATE_TOO_HIGH");

    uint256 interestAccumulated =
      (borrowRateMantissa * (block.number - accrualBlockNumberPrior)).mulWadDown(borrowsPrior);

    uint256 totalReserves =
      cToken.reserveFactorMantissa().mulWadDown(interestAccumulated) + reservesPrior;
    uint256 totalBorrows = interestAccumulated + borrowsPrior;
    uint256 totalSupply = cToken.totalSupply();

    // Reverts if totalSupply == 0
    return (totalCash + totalBorrows - totalReserves).divWadDown(totalSupply);
  }

  /**
   * @dev Returns the current borrow index for a given cToken.
   *
   * @param cToken {ICToken} compound's cToken associated with the user's position
   */
  function viewNewBorrowIndex(ICToken cToken) internal view returns (uint256 newBorrowIndex) {
    // Remember the initial block number
    uint256 currentBlockNumber = block.number;
    uint256 accrualBlockNumberPrior = cToken.accrualBlockNumber();

    // Read the previous values out of storage
    uint256 borrowIndexPrior = cToken.borrowIndex();

    // Short-circuit accumulating 0 interest
    if (accrualBlockNumberPrior == currentBlockNumber) {
      newBorrowIndex = borrowIndexPrior;
    }

    // Calculate the current borrow interest rate
    uint256 borrowRateMantissa = cToken.borrowRatePerBlock();

    // Same as borrowRateMaxMantissa in ICTokenInterfaces.sol
    require(borrowRateMantissa <= 0.0005e16, "RATE_TOO_HIGH");
    // Calculate the number of blocks elapsed since the last accrual
    uint256 blockDelta = currentBlockNumber - accrualBlockNumberPrior;

    uint256 simpleInterestFactor = borrowRateMantissa * blockDelta;
    newBorrowIndex = (simpleInterestFactor * borrowIndexPrior) / 1e18 + borrowIndexPrior;
  }
}
