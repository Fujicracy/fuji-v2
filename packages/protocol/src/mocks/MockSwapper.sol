// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

/**
 * @title MockSwapper
 *
 * @author Fujidao Labs
 *
 * @notice Mock contract of a swapper. This mock is used
 * in tests.
 */

import {MockERC20} from "./MockERC20.sol";
import {MockOracle} from "./MockOracle.sol";
import {ISwapper} from "../interfaces/ISwapper.sol";

contract MockSwapper is ISwapper {
  MockOracle public oracle;

  constructor(MockOracle _oracle) {
    oracle = _oracle;
  }

  /// @inheritdoc ISwapper
  function swap(
    address assetIn,
    address assetOut,
    uint256 amountIn,
    uint256 amountOut,
    address receiver,
    address sweeper,
    uint256 slippage
  )
    external
  {
    slippage;
    amountIn;
    sweeper;
    /// @dev Dummy burns input asset and mints output asset to the address "to".

    uint256 amountInMax = getAmountIn(assetIn, assetOut, amountOut);

    // Pull tokens from Router and burn them.
    MockERC20(assetIn).transferFrom(msg.sender, address(this), amountInMax);
    MockERC20(assetIn).burn(address(this), amountInMax);

    MockERC20(assetOut).mint(receiver, amountOut);
  }

  /// inherit Iswapper
  function getAmountIn(
    address assetIn,
    address assetOut,
    uint256 amountOut
  )
    public
    view
    override
    returns (uint256 amountIn)
  {
    uint256 price = oracle.getPriceOf(assetOut, assetIn, MockERC20(assetOut).decimals());
    amountIn = (amountOut * 10 ** uint256(MockERC20(assetIn).decimals())) / price;
  }

  /// inherit Iswapper
  function getAmountOut(
    address assetIn,
    address assetOut,
    uint256 amountIn
  )
    public
    view
    override
    returns (uint256 amountOut)
  {
    uint256 price = oracle.getPriceOf(assetOut, assetIn, MockERC20(assetOut).decimals());
    amountOut = (amountIn * price) / 10 ** uint256(MockERC20(assetIn).decimals());
  }
}
