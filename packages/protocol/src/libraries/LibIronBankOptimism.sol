// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {LibSolmateFixedPointMath} from "./LibSolmateFixedPointMath.sol";
import {ICToken} from "../interfaces/compoundV2/ICToken.sol";

/**
 * @title IronBank latest ICToken data on Optimisim.
 * @author Fujidao Labs
 * @notice This implementation is modifed from "./LibCompoundV2".
 * @dev Interest accrual in IronBank optimism is based on block.timestamp as opposed to block.number.
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
    uint256 accrualBlockTimestampPrior = cToken.accrualBlockNumber(); //ironbank on optimism returns timestamp instead of block.number

    if (accrualBlockTimestampPrior == block.timestamp) return cToken.exchangeRateStored();

    uint256 totalCash = cToken.getCash();
    uint256 borrowsPrior = cToken.totalBorrows();
    uint256 reservesPrior = cToken.totalReserves();

    uint256 borrowRateMantissa = cToken.borrowRatePerBlock();

    require(borrowRateMantissa <= 0.0005e16, "RATE_TOO_HIGH"); // Same as borrowRateMaxMantissa in ICTokenInterfaces.sol

    uint256 interestAccumulated =
      (borrowRateMantissa * (block.timestamp - accrualBlockTimestampPrior)).mulWadDown(borrowsPrior);

    uint256 totalReserves =
      cToken.reserveFactorMantissa().mulWadDown(interestAccumulated) + reservesPrior;
    uint256 totalBorrows = interestAccumulated + borrowsPrior;
    uint256 totalSupply = cToken.totalSupply();

    // Reverts if totalSupply == 0
    return (totalCash + totalBorrows - totalReserves).divWadDown(totalSupply);
  }

  function viewNewBorrowIndex(ICToken cToken) internal view returns (uint256 newBorrowIndex) {
    /* Remember the initial block timestamp */
    uint256 currentBlockTimestamp = block.timestamp;
    uint256 accrualBlockTimestampPrior = cToken.accrualBlockNumber(); //ironbank on optimism returns timestamp instead of block.number

    /* Read the previous values out of storage */
    uint256 borrowIndexPrior = cToken.borrowIndex();

    /* Short-circuit accumulating 0 interest */
    if (accrualBlockTimestampPrior == currentBlockTimestamp) {
      newBorrowIndex = borrowIndexPrior;
    }

    /* Calculate the current borrow interest rate */
    uint256 borrowRateMantissa = cToken.borrowRatePerBlock();
    require(borrowRateMantissa <= 0.0005e16, "RATE_TOO_HIGH"); // Same as borrowRateMaxMantissa in ICTokenInterfaces.sol

    /* Calculate the number of blocks elapsed since the last accrual */
    uint256 blockDelta = currentBlockTimestamp - accrualBlockTimestampPrior;

    uint256 simpleInterestFactor = borrowRateMantissa * blockDelta;
    newBorrowIndex = (simpleInterestFactor * borrowIndexPrior) / 1e18 + borrowIndexPrior;
  }
}
