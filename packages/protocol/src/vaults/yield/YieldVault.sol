// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {BaseVault} from "../../abstracts/BaseVault.sol";

contract YieldVault is BaseVault {
  error YieldVault__notApplicable();
  error YieldVault__rebalance_invalidProvider();

  constructor(
    address asset_,
    address chief_,
    string memory name_,
    string memory symbol_
  )
    BaseVault(asset_, chief_, name_, symbol_)
  {}

  receive() external payable {}

  /////////////////////////////////
  /// Debt management overrides ///
  /////////////////////////////////

  /// @inheritdoc BaseVault
  function debtDecimals() public pure override returns (uint8) {}

  /// @inheritdoc BaseVault
  function debtAsset() public pure override returns (address) {}

  /// @inheritdoc BaseVault
  function balanceOfDebt(address) public pure override returns (uint256) {}

  /// @inheritdoc BaseVault
  function totalDebt() public pure override returns (uint256) {}

  /// @inheritdoc BaseVault
  function convertDebtToShares(uint256) public pure override returns (uint256) {}

  /// @inheritdoc BaseVault
  function convertToDebt(uint256) public pure override returns (uint256) {}

  /// @inheritdoc BaseVault
  function maxBorrow(address) public pure override returns (uint256) {}

  /// @inheritdoc BaseVault
  function borrow(uint256, address, address) public pure override returns (uint256) {
    revert YieldVault__notApplicable();
  }

  /// @inheritdoc BaseVault
  function payback(uint256, address) public pure override returns (uint256) {
    revert YieldVault__notApplicable();
  }

  /////////////////////////
  /// Borrow allowances ///
  /////////////////////////

  /**
   * @dev See {IVaultPermissions-borrowAllowance}.
   * Implement in {BorrowingVault}, revert in {YieldVault}
   */
  function borrowAllowance(
    address,
    address,
    address
  )
    public
    view
    virtual
    override
    returns (uint256)
  {
    revert YieldVault__notApplicable();
  }

  /**
   * @dev See {IVaultPermissions-decreaseborrowAllowance}.
   * Implement in {BorrowingVault}, revert in {YieldVault}
   */
  function increaseBorrowAllowance(
    address,
    address,
    uint256
  )
    public
    virtual
    override
    returns (bool)
  {
    revert YieldVault__notApplicable();
  }

  /**
   * @dev See {IVaultPermissions-decreaseborrowAllowance}.
   * Implement in {BorrowingVault}, revert in {YieldVault}
   */
  function decreaseBorrowAllowance(
    address,
    address,
    uint256
  )
    public
    virtual
    override
    returns (bool)
  {
    revert YieldVault__notApplicable();
  }

  /**
   * @dev See {IVaultPermissions-permitBorrow}.
   * Implement in {BorrowingVault}, revert in {YieldVault}
   */
  function permitBorrow(
    address,
    address,
    uint256,
    uint256,
    uint8,
    bytes32,
    bytes32
  )
    public
    pure
    override
  {
    revert YieldVault__notApplicable();
  }

  function _computeFreeAssets(address owner) internal view override returns (uint256) {
    return convertToAssets(balanceOf(owner));
  }

  ///////////////////
  /// Rebalancing ///
  ///////////////////

  // inheritdoc IVault
  function rebalance(
    uint256 assets,
    uint256 debt,
    ILendingProvider from,
    ILendingProvider to,
    uint256 fee,
    bool setToAsActiveProvider
  )
    external
    hasRole(msg.sender, REBALANCER_ROLE)
    returns (bool)
  {
    if (!_isValidProvider(address(from)) || !_isValidProvider(address(to))) {
      revert YieldVault__rebalance_invalidProvider();
    }

    if (debt != 0) {
      revert YieldVault__notApplicable();
    }

    _checkRebalanceFee(fee, assets);

    _executeProviderAction(assets, "withdraw", from);
    _executeProviderAction(assets, "deposit", to);

    if (setToAsActiveProvider) {
      _setActiveProvider(to);
    }

    emit VaultRebalance(assets, 0, address(from), address(to));
    return true;
  }

  //////////////////////
  ///  Liquidate    ////
  //////////////////////

  /// inheritdoc IVault
  function getHealthFactor(address) public pure returns (uint256) {
    revert YieldVault__notApplicable();
  }

  /// inheritdoc IVault
  function getLiquidationFactor(address) public pure returns (uint256) {
    revert YieldVault__notApplicable();
  }

  /// inheritdoc IVault
  function liquidate(address, address) public pure returns (uint256) {
    revert YieldVault__notApplicable();
  }
}
