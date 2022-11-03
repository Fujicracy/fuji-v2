// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

interface IVelodromePair is IERC20 {
  function burn(address to) external returns (uint256, uint256);
  function token0() external view returns (address);
  function token1() external view returns (address);
  function getAmountOut(uint256 amountIn, address tokenIn) external view returns (uint256);
  function getReserves() external view returns (uint _reserve0, uint _reserve1, uint _blockTimestampLast);
  function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
}
