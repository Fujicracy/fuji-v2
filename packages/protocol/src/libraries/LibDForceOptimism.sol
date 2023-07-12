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

interface IOVM_L1BlockNumber {
  function getL1BlockNumber() external view returns (uint256);
}

library LibDForceOptimism {
  using LibSolmateFixedPointMath for uint256;

  IOVM_L1BlockNumber constant L1BLOCKNUMBER =
    IOVM_L1BlockNumber(0x4200000000000000000000000000000000000013);

  /**
   * @dev Returns the current collateral balance of user.
   *
   * @param iToken IGenIToken DForce's iToken associated with the user's position
   * @param user address of the user
   */
  function viewUnderlyingBalanceOf(IGenIToken iToken, address user) internal view returns (uint256) {
    return iToken.balanceOf(user).mulWadDown(viewExchangeRate(iToken));
  }

  /**
   * @dev Returns the current borrow balance of user.
   *
   * @param iToken IGenIToken DForce's iToken associated with the user's position
   * @param user address of the user
   */
  function viewBorrowingBalanceOf(IGenIToken iToken, address user) internal view returns (uint256) {
    uint256 borrowIndexPrior = iToken.borrowIndex();
    uint256 borrowIndex = viewNewBorrowIndex(iToken);
    uint256 storedBorrowBalance = iToken.borrowBalanceStored(user);

    // DForce rounds this calculation up (and Compound doesn't)
    return ((storedBorrowBalance * borrowIndex).divWadUp(borrowIndexPrior)).divWadUp(1e36);
  }

  /**
   * @dev Returns the current exchange rate for a given iToken.
   *
   * @param iToken IGenIToken DForce's iToken associated with the user's position
   */
  function viewExchangeRate(IGenIToken iToken) internal view returns (uint256) {
    uint256 accrualBlockNumberPrior = iToken.accrualBlockNumber();

    uint256 currentBlockNumber = L1BLOCKNUMBER.getL1BlockNumber();

    if (accrualBlockNumberPrior == currentBlockNumber) return iToken.exchangeRateStored();

    uint256 totalCash = iToken.getCash();
    uint256 borrowsPrior = iToken.totalBorrows();
    uint256 reservesPrior = iToken.totalReserves();

    uint256 borrowRateMantissa = iToken.borrowRatePerBlock();

    // Same as borrowRateMaxMantissa in ICTokenInterfaces.sol
    require(borrowRateMantissa <= 0.0005e16, "RATE_TOO_HIGH");
    uint256 interestAccumulated =
      (borrowRateMantissa * (currentBlockNumber - accrualBlockNumberPrior)).mulWadDown(borrowsPrior);

    uint256 totalReserves = iToken.reserveRatio().mulWadDown(interestAccumulated) + reservesPrior;
    uint256 totalBorrows = interestAccumulated + borrowsPrior;
    uint256 totalSupply = iToken.totalSupply();

    // Reverts if totalSupply == 0
    return (totalCash + totalBorrows - totalReserves).divWadDown(totalSupply);
  }

  /**
   * @dev Returns the current borrow index for a given iToken.
   *
   * @param iToken IGenIToken DForce's iToken associated with the user's position
   */
  function viewNewBorrowIndex(IGenIToken iToken) internal view returns (uint256 newBorrowIndex) {
    // Remember the initial block number
    // DForce on optimism keeps interest accrual reading from L1 block numbers.
    uint256 currentBlockNumber = L1BLOCKNUMBER.getL1BlockNumber();
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
