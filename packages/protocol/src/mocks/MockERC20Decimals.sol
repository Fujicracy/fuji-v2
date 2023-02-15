// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import './MockERC20.sol';

contract MockERC20Decimals is MockERC20{
  uint8 _decimals; 

  constructor(string memory name_, string memory symbol_, uint8 decimals_) MockERC20(name_, symbol_) {
      _decimals = decimals_;
  }

  function decimals() public view virtual override returns (uint8) {
    return _decimals;
  }
}
