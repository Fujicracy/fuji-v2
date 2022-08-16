// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.9;

import {MockERC20} from "./MockERC20.sol";
import {MockOracle} from "./MockOracle.sol";

contract MockSwapper {
  MockOracle public oracle;

  constructor(MockOracle _oracle) {
    oracle = _oracle;
  }

  // dummy burns input asset and mints output asset
  // to the address "to"
  function swapTokensForExactTokens(
    uint256 amountOut,
    uint256 amountInMax,
    address[] calldata path,
    address to,
    uint256 deadline
  )
    external
    returns (uint256[] memory)
  {
    deadline;
    uint256 len = path.length;
    MockERC20(path[0]).burn(msg.sender, amountInMax);
    MockERC20(path[len - 1]).mint(to, amountOut);

    uint256[] memory amounts = new uint256[](1);
    amounts[0] = 1;
    return amounts;
  }

  // dummy calculates the amountIn based on data from the oracle
  function getAmountsIn(uint256 amountOut, address[] memory path)
    public
    view
    returns (uint256[] memory)
  {
    uint256 len = path.length;
    address asset = path[0];
    address debtAsset = path[len - 1];
    uint256 amount = oracle.getPriceOf(debtAsset, asset, 18);

    uint256[] memory amounts = new uint256[](1);
    amounts[0] = amountOut / amount;
    return amounts;
  }
}
