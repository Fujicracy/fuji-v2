// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {BaseVault} from "../../abstracts/BaseVault.sol";

contract YieldVault is BaseVault {
  error YieldVault__notApplicable();

  constructor(address asset_, address chief_)
    BaseVault(
      asset_,
      chief_,
      // name_, ex: X-Fuji Dai Stablecoin Vault Shares
      string(abi.encodePacked("X-Fuji ", IERC20Metadata(asset_).name(), " Vault Shares")),
      // symbol_, ex: xfDAI
      string(abi.encodePacked("xf", IERC20Metadata(asset_).symbol()))
    )
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
  function borrowAllowance(address, address) public view virtual override returns (uint256) {
    revert YieldVault__notApplicable();
  }

  /**
   * @dev See {IVaultPermissions-decreaseborrowAllowance}.
   * Implement in {BorrowingVault}, revert in {YieldVault}
   */
  function increaseBorrowAllowance(address, uint256) public virtual override returns (bool) {
    revert YieldVault__notApplicable();
  }

  /**
   * @dev See {IVaultPermissions-decreaseborrowAllowance}.
   * Implement in {BorrowingVault}, revert in {YieldVault}
   */
  function decreaseBorrowAllowance(address, uint256) public virtual override returns (bool) {
    revert YieldVault__notApplicable();
  }

  /**
   * @dev See {IVaultPermissions-permitBorrow}.
   * Implement in {BorrowingVault}, revert in {YieldVault}
   */
  function permitBorrow(address, address, uint256, uint256, uint8, bytes32, bytes32)
    public
    pure
    override
  {
    revert YieldVault__notApplicable();
  }

  function _computeFreeAssets(address owner) internal view override returns (uint256) {
    return convertToAssets(balanceOf(owner));
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
