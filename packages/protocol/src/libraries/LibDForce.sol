// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title LibDForce
 *
 * @author Fujidao Labs
 *
 * @notice This implementation is modifed from "./LibCompoundV2".
 * @notice Inspired and modified from Transmissions11 (https://github.com/transmissions11/libcompound).
 */

import {LibSolmateFixedPointMath} from "./LibSolmateFixedPointMath.sol";
import {IGenIToken} from "../interfaces/dforce/IGenIToken.sol";

library LibDForce {
  using LibSolmateFixedPointMath for uint256;

  /**
   * @param iToken IGenIToken DForce's iToken associated with the user's position
   * @param user address of the user
   *
   * @dev Returns the current collateral balance of user.
   */
  function viewUnderlyingBalanceOf(IGenIToken iToken, address user) internal view returns (uint256) {
    return iToken.balanceOf(user).mulWadDown(viewExchangeRate(iToken));
  }

  /**
   * @param iToken IGenIToken DForce's iToken associated with the user's position
   * @param user address of the user
   *
   * @dev Returns the current borrow balance of user.
   */
  function viewBorrowingBalanceOf(IGenIToken iToken, address user) internal view returns (uint256) {
    uint256 borrowIndexPrior = iToken.borrowIndex();
    uint256 borrowIndex = viewNewBorrowIndex(iToken);
    uint256 storedBorrowBalance = iToken.borrowBalanceStored(user);

    // DForce rounds this calculation up (and Compound doesn't)
    return ((storedBorrowBalance * borrowIndex).divWadUp(borrowIndexPrior)).divWadUp(1e36);
  }

  /**
   * @param iToken IGenIToken DForce's iToken associated with the user's position
   *
   * @dev Returns the current exchange rate for a given iToken.
   */
  function viewExchangeRate(IGenIToken iToken) internal view returns (uint256) {
    uint256 accrualBlockNumberPrior = iToken.accrualBlockNumber();

    if (accrualBlockNumberPrior == block.number) return iToken.exchangeRateStored();

    uint256 totalCash = iToken.getCash();
    uint256 borrowsPrior = iToken.totalBorrows();
    uint256 reservesPrior = iToken.totalReserves();

    uint256 borrowRateMantissa = iToken.borrowRatePerBlock();

    // Same as borrowRateMaxMantissa in ICTokenInterfaces.sol
    require(borrowRateMantissa <= 0.0005e16, "RATE_TOO_HIGH");
    uint256 interestAccumulated =
      (borrowRateMantissa * (block.number - accrualBlockNumberPrior)).mulWadDown(borrowsPrior);

    uint256 totalReserves = iToken.reserveRatio().mulWadDown(interestAccumulated) + reservesPrior;
    uint256 totalBorrows = interestAccumulated + borrowsPrior;
    uint256 totalSupply = iToken.totalSupply();

    // Reverts if totalSupply == 0
    return (totalCash + totalBorrows - totalReserves).divWadDown(totalSupply);
  }

  /**
   * @param iToken IGenIToken DForce's iToken associated with the user's position
   *
   * @dev Returns the current borrow index for a given iToken.
   */
  function viewNewBorrowIndex(IGenIToken iToken) internal view returns (uint256 newBorrowIndex) {
    // Remember the initial block number
    uint256 currentBlockNumber = block.number;
    uint256 accrualBlockNumberPrior = iToken.accrualBlockNumber();

    // Read the previous values out of storage
    uint256 borrowIndexPrior = iToken.borrowIndex();

    // Short-circuit accumulating 0 interest
    if (accrualBlockNumberPrior == currentBlockNumber) {
      newBorrowIndex = borrowIndexPrior;
    }

    // Calculate the current borrow interest rate
    uint256 borrowRateMantissa = iToken.borrowRatePerBlock();

    // Same as borrowRateMaxMantissa in ICTokenInterfaces.sol
    require(borrowRateMantissa <= 0.0005e16, "RATE_TOO_HIGH");
    // Calculate the number of blocks elapsed since the last accrual
    uint256 blockDelta = currentBlockNumber - accrualBlockNumberPrior;

    uint256 simpleInterestFactor = borrowRateMantissa * blockDelta;
    newBorrowIndex = (simpleInterestFactor * borrowIndexPrior) / 1e18 + borrowIndexPrior;
  }
}
