// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title VaultPermissions Interface.
 * @author Fujidao Labs
 * @notice Defines the interface for vault signed permit operations and borrow allowance.
 */

interface IVaultPermissions {
  /**
   * @dev Emitted when the asset allowance of a `spender` for an `owner` is set by
   * a call to {approveAsset}. `value` is the new allowance.
   * Allows `spender` to withdraw collateral from owner.
   */
  event AssetApproval(address indexed owner, address spender, uint256 amount);
  /**
   * @dev Emitted when the borrow allowance of a `spender` for an `owner` is set by
   * a call to {approveBorrow}. `value` is the new allowance.
   * Allows `spender` to incur debt on behalf `owner`.
   */
  event BorrowApproval(address indexed owner, address spender, uint256 amount);

  /**
   * @dev Based on {IERC20Permit-DOMAIN_SEPARATOR}.
   */
  // solhint-disable-next-line func-name-mixedcase
  function DOMAIN_SEPARATOR() external returns (bytes32);

  /**
   * @dev Based on {IERC20-allowance} for assets, instead of shares.
   *
   * Requirements:
   * - By convention this SHOULD be used over {IERC4626-allowance}.
   */
  function assetAllowance(address owner, address spender) external view returns (uint256);

  /**
   * @dev Based on {IERC20-allowance} for debt.
   */
  function borrowAllowance(address owner, address spender) external view returns (uint256);

  /**
   * @dev Atomically increases the `assetAllowance` granted to `spender` by the caller.
   * Based on OZ {ERC20-increaseAllowance} for assets.
   * Emits an {AssetApproval} event indicating the updated asset allowance.
   *
   * Requirements:
   * - `spender` cannot be the zero address.
   */
  function increaseAssetAllowance(address spender, uint256 byAmount) external returns (bool);

  /**
   * @dev Atomically decrease the `assetAllowance` granted to `spender` by the caller.
   * Based on OZ {ERC20-decreaseAllowance} for assets.
   * Emits an {AssetApproval} event indicating the updated asset allowance.
   *
   * Requirements:
   * - `spender` cannot be the zero address.
   * - `spender` must have `assetAllowance` for the caller of at least `byAmount`
   */
  function decreaseAssetAllowance(address spender, uint256 byAmount) external returns (bool);

  /**
   * @dev Atomically increases the `borrowAllowance` granted to `spender` by the caller.
   * Based on OZ {ERC20-increaseAllowance} for assets.
   * Emits an {BorrowApproval} event indicating the updated borrow allowance.
   *
   * Requirements:
   * - `spender` cannot be the zero address.
   */
  function increaseBorrowAllowance(address spender, uint256 byAmount) external returns (bool);

  /**
   * @dev Atomically decrease the `borrowAllowance` granted to `spender` by the caller.
   * Based on OZ {ERC20-decreaseAllowance} for assets, and
   * inspired on credit delegation by Aave.
   * Emits an {BorrowApproval} event indicating the updated borrow allowance.
   *
   * Requirements:
   * - `spender` cannot be the zero address.
   * - `spender` must have `borrowAllowance` for the caller of at least `byAmount`
   */
  function decreaseBorrowAllowance(address spender, uint256 byAmount) external returns (bool);

  /**
   * @dev Based on OZ {IERC20Permit-nonces}.
   */
  function nonces(address owner) external view returns (uint256);

  /**
   * @dev Inspired by {IERC20Permit-permit} for assets.
   * Sets `value` as the `assetAllowance` of `spender` over ``owner``'s tokens,
   * given ``owner``'s signed approval.
   * IMPORTANT: The same issues {IERC20-approve} has related to transaction
   * ordering also apply here.
   *
   * Emits an {AssetsApproval} event.
   *
   * Requirements:
   * - `spender` cannot be the zero address.
   * - `deadline` must be a timestamp in the future.
   * - `v`, `r` and `s` must be a valid `secp256k1` signature from `owner`
   * over the EIP712-formatted function arguments.
   * - the signature must use ``owner``'s current nonce (see {nonces}).
   */
  function permitAssets(
    address owner,
    address spender,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    external;

  /**
   * @dev Inspired by {IERC20Permit-permit} for debt.
   * Sets `value` as the `borrowAllowance` of `spender` over ``owner``'s borrowing powwer,
   * given ``owner``'s signed approval.
   * IMPORTANT: The same issues {IERC20-approve} has related to transaction
   * ordering also apply here.
   *
   * Emits a {BorrowApproval} event.
   *
   * Requirements:
   * - must be implemented in a BorrowingVault.
   * - `spender` cannot be the zero address.
   * - `deadline` must be a timestamp in the future.
   * - `v`, `r` and `s` must be a valid `secp256k1` signature from `owner`
   * over the EIP712-formatted function arguments.
   * - the signature must use ``owner``'s current nonce (see {nonces}).
   */
  function permitBorrow(
    address owner,
    address spender,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    external;
}
