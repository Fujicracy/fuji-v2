// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.9;

/**
 * @title Vault Interface.
 * @author Fujidao Labs
 * @notice Defines the interface for vault operations extending from IERC4326.
 */

import {IERC4626} from "openzeppelin-contracts/contracts/interfaces/IERC4626.sol";
import {ILendingProvider} from "./ILendingProvider.sol";

interface IVault is IERC4626 {
  struct Factor {
    uint64 num;
    uint64 denum;
  }

  event Borrow(address indexed caller, address indexed owner, uint256 debt, uint256 shares);

  event Payback(address indexed caller, address indexed owner, uint256 debt, uint256 shares);

  function debtDecimals() external view returns (uint8);

  function debtAsset() external view returns (address);

  function totalDebt() external view returns (uint256);

  function convertDebtToShares(uint256 debt) external view returns (uint256 shares);

  function convertToDebt(uint256 shares) external view returns (uint256 debt);

  function maxBorrow(address borrower) external view returns (uint256);

  /**
   * @dev Mints debtShares to owner by taking a loan of exact amount of underlying tokens.
   *
   * - MUST emit the Borrow event.
   * - MUST revert if owner does not own sufficient collateral to back debt.
   * - MUST revert if caller is not owner or permission to act owner.
   *
   */
  function borrow(uint256 debt, address receiver, address owner) external returns (uint256);

  /**
   * @dev burns debtShares to owner by paying back loan with exact amount of underlying tokens.
   *
   * - MUST emit the Payback event.
   *
   * NOTE: most implementations will require pre-erc20-approval of the underlying asset token.
   */
  function payback(uint256 debt, address receiver) external returns (uint256);

  function setActiveProvider(ILendingProvider activeProvider) external;

  function activeProvider() external returns (ILendingProvider);
}
