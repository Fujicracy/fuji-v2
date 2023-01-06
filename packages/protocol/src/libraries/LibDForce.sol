// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

//TODO remove console
import "forge-std/console.sol";
import {LibSolmateFixedPointMath} from "./LibSolmateFixedPointMath.sol";
import {IGenIToken} from "../interfaces/dforce/IGenIToken.sol";

/**
 * @title DForce latest IGenIToken data.
 * @author Fujidao Labs
 * @notice Inspired and modified from Transmissions11 (https://github.com/transmissions11/libcompound)
 */
library LibDForce {
  using LibSolmateFixedPointMath for uint256;

  function viewUnderlyingBalanceOf(IGenIToken iToken, address user) internal view returns (uint256) {
    console.log(
      "viewUnderlyingBalanceOf ", iToken.balanceOf(user).mulWadDown(viewExchangeRate(iToken))
    );
    return iToken.balanceOf(user).mulWadDown(viewExchangeRate(iToken));
  }

  function viewBorrowingBalanceOf(IGenIToken iToken, address user) internal view returns (uint256) {
    uint256 borrowIndexPrior = iToken.borrowIndex();
    uint256 borrowIndex = viewNewBorrowIndex(iToken);
    uint256 storedBorrowBalance = iToken.borrowBalanceStored(user);

    console.log("viewBorrowingBalanceOf ", ((storedBorrowBalance * borrowIndex) / borrowIndexPrior));
    return ((storedBorrowBalance * borrowIndex) / borrowIndexPrior);
  }

  function viewExchangeRate(IGenIToken iToken) internal view returns (uint256) {
    uint256 accrualBlockNumberPrior = iToken.accrualBlockNumber();

    if (accrualBlockNumberPrior == block.number) return iToken.exchangeRateStored();

    uint256 totalCash = iToken.getCash();
    uint256 borrowsPrior = iToken.totalBorrows();
    uint256 reservesPrior = iToken.totalReserves();

    uint256 borrowRateMantissa = iToken.borrowRatePerBlock();

    require(borrowRateMantissa <= 0.0005e16, "RATE_TOO_HIGH"); // Same as borrowRateMaxMantissa in ICTokenInterfaces.sol

    uint256 interestAccumulated =
      (borrowRateMantissa * (block.number - accrualBlockNumberPrior)).mulWadDown(borrowsPrior);

    uint256 totalReserves = iToken.reserveRatio().mulWadDown(interestAccumulated) + reservesPrior;
    uint256 totalBorrows = interestAccumulated + borrowsPrior;
    uint256 totalSupply = iToken.totalSupply();

    console.log(
      "viewExchangeRate ", (totalCash + totalBorrows - totalReserves).divWadDown(totalSupply)
    );
    // Reverts if totalSupply == 0
    return (totalCash + totalBorrows - totalReserves).divWadDown(totalSupply);
  }

  function viewNewBorrowIndex(IGenIToken iToken) internal view returns (uint256 newBorrowIndex) {
    /* Remember the initial block number */
    uint256 currentBlockNumber = block.number;
    uint256 accrualBlockNumberPrior = iToken.accrualBlockNumber();

    /* Read the previous values out of storage */
    uint256 borrowIndexPrior = iToken.borrowIndex();

    /* Short-circuit accumulating 0 interest */
    if (accrualBlockNumberPrior == currentBlockNumber) {
      newBorrowIndex = borrowIndexPrior;
    }

    /* Calculate the current borrow interest rate */
    uint256 borrowRateMantissa = iToken.borrowRatePerBlock();
    require(borrowRateMantissa <= 0.0005e16, "RATE_TOO_HIGH"); // Same as borrowRateMaxMantissa in ICTokenInterfaces.sol

    /* Calculate the number of blocks elapsed since the last accrual */
    uint256 blockDelta = currentBlockNumber - accrualBlockNumberPrior;

    uint256 simpleInterestFactor = borrowRateMantissa * blockDelta;
    console.log(
      "viewNewBorrowIndex ", (simpleInterestFactor * borrowIndexPrior) / 1e18 + borrowIndexPrior
    );
    newBorrowIndex = (simpleInterestFactor * borrowIndexPrior) / 1e18 + borrowIndexPrior;
  }
}
