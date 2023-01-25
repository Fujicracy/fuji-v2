// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IVault} from "../../interfaces/IVault.sol";
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {IMorpho} from "../../interfaces/morpho/IMorpho.sol";
import {ILens} from "../../interfaces/morpho/ILens.sol";
import {IAddrMapper} from "../../interfaces/IAddrMapper.sol";

/**
 * @title Morpho Lending Provider
 * @author Fujidao Labs
 * @notice This contract allows interaction with Morpho.
 * @dev The IAddrMapper needs to be properly configured for AaveV2.
 */
contract MorphoAaveV2 is ILendingProvider {
  address public constant MORPHO = 0x777777c9898D384F785Ee44Acfe945efDFf5f3E0;
  address public constant LENS = 0x507fA343d0A90786d86C7cd885f5C49263A91FF4;

  /// inheritdoc ILendingProvider
  function providerName() public pure override returns (string memory) {
    return "Morpho";
  }

  /**
   * @dev Returns {IMorpho} contract to be able to interact with the protocol
   */
  function _getMorpho() internal pure returns (IMorpho) {
    return IMorpho(MORPHO);
  }

  /**
   * @dev Returns the IAddrMapper on this chain.
   */
  function _getAddrmapper() internal pure returns (IAddrMapper) {
    // TODO Define final address after deployment strategy is set.
    return IAddrMapper(0x529eE84BFE4F37132f5f9599d4cc4Ff16Ee6d0D2);
  }

  /**
   * @dev Returns AaveV2's underlying aToken associated with the given asset.
   * @param asset address of the token to deposit/borrow
   */
  function _getAToken(address asset) internal view returns (address aToken) {
    aToken = _getAddrmapper().getAddressMapping("Aave_V2", asset);
  }

  /// inheritdoc ILendingProvider
  function approvedOperator(
    address,
    address,
    address
  )
    external
    pure
    override
    returns (address operator)
  {
    operator = MORPHO;
  }

  /// inheritdoc ILendingProvider
  function deposit(uint256 amount, IVault vault) external override returns (bool success) {
    _getMorpho().supply(_getAToken(vault.asset()), address(vault), amount);
    success = true;
  }

  /// inheritdoc ILendingProvider
  function borrow(uint256 amount, IVault vault) external override returns (bool success) {
    _getMorpho().borrow(_getAToken(vault.debtAsset()), amount);
    success = true;
  }

  /// inheritdoc ILendingProvider
  function withdraw(uint256 amount, IVault vault) external override returns (bool success) {
    _getMorpho().withdraw(_getAToken(vault.asset()), amount);
    success = true;
  }

  /// inheritdoc ILendingProvider
  function payback(uint256 amount, IVault vault) external override returns (bool success) {
    _getMorpho().repay(_getAToken(vault.debtAsset()), address(vault), amount);
    success = true;
  }

  /// inheritdoc ILendingProvider
  function getDepositRateFor(IVault vault) external view override returns (uint256 rate) {
    (rate,,) = ILens(LENS).getAverageSupplyRatePerYear(_getAToken(vault.asset()));
  }

  /// inheritdoc ILendingProvider
  function getBorrowRateFor(IVault vault) external view override returns (uint256 rate) {
    (rate,,) = ILens(LENS).getAverageBorrowRatePerYear(_getAToken(vault.debtAsset()));
  }

  /// inheritdoc ILendingProvider
  function getDepositBalance(
    address user,
    IVault vault
  )
    external
    view
    override
    returns (uint256 balance)
  {
    (uint256 suppliedOnPool, uint256 suppliedP2P,) =
      ILens(LENS).getCurrentSupplyBalanceInOf(_getAToken(vault.asset()), user);
    balance = suppliedOnPool + suppliedP2P;
  }

  /// inheritdoc ILendingProvider
  function getBorrowBalance(
    address user,
    IVault vault
  )
    external
    view
    override
    returns (uint256 balance)
  {
    (uint256 borrowedOnPool, uint256 borrowedP2P,) =
      ILens(LENS).getCurrentBorrowBalanceInOf(_getAToken(vault.debtAsset()), user);
    balance = borrowedOnPool + borrowedP2P;
  }
}
