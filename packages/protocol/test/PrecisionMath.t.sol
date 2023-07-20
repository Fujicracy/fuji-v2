// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {MathUpgradeable as Math} from
  "openzeppelin-contracts-upgradeable/contracts/utils/math/MathUpgradeable.sol";

uint256 constant ERROR_LIMIT = 1e3;

contract MathPrecision {
  using Math for uint256;

  error excessError(uint256);

  uint256 internal constant PRECISION = 1e27;

  function checkExchangeRatioNotZero(uint256 numa, uint256 shares) public pure returns (bool) {
    return numa.mulDiv(PRECISION, shares) > 0;
  }

  function checkConversionAndRemainder(
    uint256 numa,
    uint256 shares,
    uint256 shareLimit
  )
    public
    view
    returns (uint256 numa_, uint256 shares_, uint256 remainder)
  {
    if (shares > shareLimit) {
      shares_ = shareLimit;
      numa_ = shares_.mulDiv(numa, shares);
      remainder = numa - numa_;
      console.log("numa_", numa_, "remainder", remainder);
    } else {
      shares_ = shares;
      numa_ = numa;
      console.log("numa_", numa_, "remainder", remainder);
    }
  }

  function getAmountFromExchangeRatio(
    uint256 numa,
    uint256 shares,
    uint256 otherShareAmount
  )
    public
    view
    returns (uint256)
  {
    uint256 exchangeRatio = numa.mulDiv(PRECISION, shares);
    console.log("exchangeRatio", exchangeRatio);
    return otherShareAmount.mulDiv(exchangeRatio, PRECISION);
  }

  function checkUnchangedEquivalence(
    uint256 numa,
    uint256 shares
  )
    public
    view
    returns (uint256 numa_, uint256 shares_)
  {
    uint256 e;

    shares_ = numa.mulDiv(shares, numa);
    console.log("shares_-shares", shares_, shares);
    (shares_, e) = fixPrecisionDiff(shares, shares_);

    numa_ = shares.mulDiv(numa, shares);
    console.log("numa_-numa", numa_, numa);
    (numa_, e) = fixPrecisionDiff(numa, numa_);
  }

  function fixPrecisionDiff(
    uint256 original,
    uint256 computed
  )
    public
    pure
    returns (uint256 fix, uint256 e)
  {
    e = computed >= original ? computed - original : original - computed;
    if (e > 0 && e < ERROR_LIMIT + 1) {
      fix = computed - e == original ? computed - e : computed + e;
    } else if (e == 0) {
      fix = computed;
    } else {
      revert excessError(e);
    }
  }
}

contract MathPrecisionTest is Test {
  using Math for uint256;
  using Math for uint128;

  MathPrecision public mathPrecision;

  function setUp() public {
    mathPrecision = new MathPrecision();
  }

  function test_mathPrecisionUnchangedEquivalenceFuzz(uint128 numA, uint128 sharesA) public {
    // uint128 numA = 998567;
    // uint128 sharesA = 1996792;
    vm.assume(numA > 0 && sharesA > 0 && mathPrecision.checkExchangeRatioNotZero(numA, sharesA));
    (uint256 computedA, uint256 computedSharesA) =
      mathPrecision.checkUnchangedEquivalence(numA, sharesA);
    assertEq(computedA, numA);
    assertEq(computedSharesA, sharesA);
  }

  function test_mathPrecisionCheckConversionAndRemainderFuzz(
    uint128 numA,
    uint128 sharesA,
    uint128 shareLimit
  )
    public
  {
    // uint128 numA = 998567;
    // uint128 sharesA = 1996792;
    // uint128 shareLimit = 1996700;
    vm.assume(numA > 0 && sharesA > 0 && mathPrecision.checkExchangeRatioNotZero(numA, sharesA));
    (uint256 computedA, uint256 computedSharesA, uint256 remainder) =
      mathPrecision.checkConversionAndRemainder(numA, sharesA, shareLimit);

    if (shareLimit < sharesA) {
      assertEq(computedSharesA, shareLimit);
      assertLt(computedA, numA);
      assertEq(remainder, numA - computedA);

      /*
      // For reference only to check
      uint256 fromExchangeRatio =
        mathPrecision.getAmountFromExchangeRatio(numA, sharesA, shareLimit);
      console.log("comparison-fromExchangeRatio-normal", fromExchangeRatio, computedA);
      */

      uint256 expectedResult = numA.mulDiv(shareLimit, sharesA);

      uint256 errorDiff =
        computedA > expectedResult ? computedA - expectedResult : expectedResult - computedA;
      assertLt(errorDiff, ERROR_LIMIT + 1);
    } else {
      assertEq(computedA, numA);
      assertEq(computedSharesA, sharesA);
      assertEq(remainder, 0);
    }
  }
}
