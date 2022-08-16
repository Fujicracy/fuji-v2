// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.9;

import {MockERC20} from "./MockERC20.sol";
import {MockOracle} from "./MockOracle.sol";
import {ISwapper} from "../../../src/interfaces/ISwapper.sol";

contract MockSwapper is ISwapper {
  MockOracle public oracle;

  constructor(MockOracle _oracle) {
    oracle = _oracle;
  }

  // dummy burns input asset and mints output asset
  // to the address "to"
  function swap(
    address assetIn,
    address assetOut,
    uint256 amountOut,
    address receiver,
    uint256 slippage
  )
    external
  {
    slippage;
    uint256 amount = oracle.getPriceOf(assetOut, assetIn, 18);
    uint256 amountInMax = amountOut / amount;

    // pull tokens from Router and burn them
    MockERC20(assetIn).transferFrom(msg.sender, address(this), amountInMax);
    MockERC20(assetIn).burn(msg.sender, amountInMax);

    MockERC20(assetOut).mint(receiver, amountOut);
  }
}
