// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

interface IBeefyVaultV6 is IERC20 {
  function deposit(uint256 amount) external;

  function withdraw(uint256 shares) external;

  function want() external pure returns (address);

  function getPricePerFullShare() external view returns (uint256);
}
