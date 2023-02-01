// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title LibIronBankOptimism
 *
 * @author Fujidao Labs
 *
 * @notice This implementation is modifed from "./LibCompoundV2".
 * @dev Interest accrual in IronBank optimism is based on block.timestamp as opposed to block.number.
 */

import {LibSolmateFixedPointMath} from "./LibSolmateFixedPointMath.sol";
import {ICToken} from "../interfaces/compoundV2/ICToken.sol";

library LibIronBankOptimism {
  using LibSolmateFixedPointMath for uint256;

  /**
   * @dev Returns the current collateral balance of user.
   *
   * @param cToken {ICToken} IronBank's cToken associated with the user's position
   * @param user address of the user
   */
  function viewUnderlyingBalanceOf(ICToken cToken, address user) internal view returns (uint256) {
    return cToken.balanceOf(user).mulWadDown(viewExchangeRate(cToken));
  }

  /**
   * @dev Returns the current borrow balance of user.
   *
   * @param cToken {ICToken} IronBank's cToken associated with the user's position
   * @param user address of the user
   */
  function viewBorrowingBalanceOf(ICToken cToken, address user) internal view returns (uint256) {
    uint256 borrowIndexPrior = cToken.borrowIndex();
    uint256 borrowIndex = viewNewBorrowIndex(cToken);
    uint256 storedBorrowBalance = cToken.borrowBalanceStored(user);
    return ((storedBorrowBalance * borrowIndex) / borrowIndexPrior);
  }

  /**
   * @dev IronBank uses block.timestamp on Optimism instead of the usual block.number.
   * The `cToken.accrualBlockNumber()` function returns timestamp.
   * Returns the current exchange rate for a given {ICToken}.
   *
   * @param cToken {ICToken} IronBank's cToken associated with the user's position
   */
  function viewExchangeRate(ICToken cToken) internal view returns (uint256) {
    // Ironbank on optimism returns timestamp instead of block.number.
    uint256 accrualBlockTimestampPrior = cToken.accrualBlockNumber();

    if (accrualBlockTimestampPrior == block.timestamp) return cToken.exchangeRateStored();

    uint256 totalCash = cToken.getCash();
    uint256 borrowsPrior = cToken.totalBorrows();
    uint256 reservesPrior = cToken.totalReserves();

    uint256 borrowRateMantissa = cToken.borrowRatePerBlock();

    // Same as borrowRateMaxMantissa in {ICTokenInterfaces}
    require(borrowRateMantissa <= 0.0005e16, "RATE_TOO_HIGH");

    uint256 interestAccumulated =
      (borrowRateMantissa * (block.timestamp - accrualBlockTimestampPrior)).mulWadDown(borrowsPrior);

    uint256 totalReserves =
      cToken.reserveFactorMantissa().mulWadDown(interestAccumulated) + reservesPrior;
    uint256 totalBorrows = interestAccumulated + borrowsPrior;
    uint256 totalSupply = cToken.totalSupply();

    // Reverts if totalSupply == 0.
    return (totalCash + totalBorrows - totalReserves).divWadDown(totalSupply);
  }

  /**
   * * @dev Returns the current borrow index for a given {ICToken}.
   * IronBank uses block.timestamp on Optimism instead of the usual block.number.
   * The `cToken.accrualBlockNumber()` function returns timestamp.
   *
   * @param cToken {ICToken} IronBank's cToken associated with the user's position
   */
  function viewNewBorrowIndex(ICToken cToken) internal view returns (uint256 newBorrowIndex) {
    // Remember the initial block timestamp
    uint256 currentBlockTimestamp = block.timestamp;
    // Ironbank on optimism returns timestamp instead of block.number.
    uint256 accrualBlockTimestampPrior = cToken.accrualBlockNumber();
    // Read the previous values out of storage.
    uint256 borrowIndexPrior = cToken.borrowIndex();

    // Short-circuit accumulating 0 interest.
    if (accrualBlockTimestampPrior == currentBlockTimestamp) {
      newBorrowIndex = borrowIndexPrior;
    }

    // Calculate the current borrow interest rate.
    uint256 borrowRateMantissa = cToken.borrowRatePerBlock();

    // Same as borrowRateMaxMantissa in {ICTokenInterfaces}
    require(borrowRateMantissa <= 0.0005e16, "RATE_TOO_HIGH");
    // Calculate the number of blocks elapsed since the last accrual.
    uint256 blockDelta = currentBlockTimestamp - accrualBlockTimestampPrior;

    uint256 simpleInterestFactor = borrowRateMantissa * blockDelta;
    newBorrowIndex = (simpleInterestFactor * borrowIndexPrior) / 1e18 + borrowIndexPrior;
  }
}
