// SPDX-License-Identifier: GNU AGPLv3
pragma solidity ^0.8.0;

interface IMorpho {
  /// USERS ///

  function supply(address _poolTokenAddress, address _onBehalf, uint256 _amount) external;
  function borrow(address _poolTokenAddress, uint256 _amount) external;
  function withdraw(address _poolTokenAddress, uint256 _amount) external;
  function repay(address _poolTokenAddress, address _onBehalf, uint256 _amount) external;
}
