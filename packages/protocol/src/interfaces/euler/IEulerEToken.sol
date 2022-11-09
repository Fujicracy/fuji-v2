// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/// @notice Tokenised representation of assets
interface IEulerEToken {

    /// @notice Address of underlying asset
    function underlyingAsset() external view returns (address);

    /// @notice Balance of a particular account, in internal book-keeping units (non-increasing)
    function balanceOf(address account) external view returns (uint);

    /// @notice Transfer underlying tokens from sender to the Euler pool, and increase account's eTokens
    /// @param subAccountId 0 for primary, 1-255 for a sub-account
    /// @param amount In underlying units (use max uint256 for full underlying token balance)
    function deposit(uint subAccountId, uint amount) external;

    /// @notice Transfer underlying tokens from Euler pool to sender, and decrease account's eTokens
    /// @param subAccountId 0 for primary, 1-255 for a sub-account
    /// @param amount In underlying units (use max uint256 for full pool balance)
    function withdraw(uint subAccountId, uint amount) external;

    /// @notice Allow spender to access an amount of your eTokens in sub-account 0
    /// @param spender Trusted address
    /// @param amount Use max uint256 for "infinite" allowance
    function approve(address spender, uint amount) external returns (bool);

    /// @notice Transfer eTokens to another address (from sub-account 0)
    /// @param to Xor with the desired sub-account ID (if applicable)
    /// @param amount In internal book-keeping units (as returned from balanceOf).
    function transfer(address to, uint amount) external returns (bool);

}

