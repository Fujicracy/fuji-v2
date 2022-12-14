// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {LibSolmateFixedPointMath} from "./LibSolmateFixedPointMath.sol";
import {ICToken} from "../interfaces/compoundV2/ICToken.sol";

/**
 * @title CompoundV2 latest ICToken data.
 * @author Fujidao Labs
 * @notice Inspired and modified from Transmissions11 (https://github.com/transmissions11/libcompound)
 */
library LibCompoundV2 {
  using LibSolmateFixedPointMath for uint256;

  struct Exp {
    uint256 mantissa;
  }

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

  function viewNewBorrowIndex(ICToken cToken) internal view returns (uint256 newBorrowIndex) {
    /* Remember the initial block number */
    uint256 currentBlockNumber = block.number;
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

    Exp memory simpleInterestFactor = _mul_(Exp({mantissa: borrowRateMantissa}), blockDelta);
    newBorrowIndex =
      _mul_ScalarTruncateAddUInt(simpleInterestFactor, borrowIndexPrior, borrowIndexPrior);
  }

  function _mul_(Exp memory a, uint256 b) private pure returns (Exp memory) {
    return Exp({mantissa: a.mantissa * b});
  }

  function _truncate(Exp memory exp) private pure returns (uint256) {
    // Note: We are not using careful math here as we're performing a division that cannot fail
    return exp.mantissa / 1e18;
  }

  function _mul_ScalarTruncateAddUInt(
    Exp memory a,
    uint256 scalar,
    uint256 addend
  )
    private
    pure
    returns (uint256)
  {
    Exp memory product = _mul_(a, scalar);
    return (_truncate(product) + addend);
  }
}
