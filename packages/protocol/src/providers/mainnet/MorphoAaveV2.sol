// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IVault} from "../../interfaces/IVault.sol";
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {IMorpho} from "../../interfaces/morpho/IMorpho.sol";
import {ILens} from "../../interfaces/morpho/ILens.sol";

/**
 * @title Morpho Lending Provider.
 * @author fujidao Labs
 * @notice This contract allows interaction with Morpho.
 */
contract MorphoAaveV2 is ILendingProvider {
  //TODO use addr mapper
  address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

  address public constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;

  address public constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

  address public constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;

  address public constant WBTC = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;

  address public constant LENS = 0x507fA343d0A90786d86C7cd885f5C49263A91FF4;

  // address public constant AAAVE = 0xFFC97d72E13E01096502Cb8Eb52dEe56f74DAD7B;
  address public constant ADAI = 0x028171bCA77440897B824Ca71D1c56caC55b68A3;
  address public constant AUSDC = 0xBcca60bB61934080951369a648Fb03DF4F96263C;
  address public constant AUSDT = 0x3Ed3B47Dd13EC9a98b44e6204A523E766B225811;
  address public constant AWBTC = 0x9ff58f4fFB29fA2266Ab25e75e2A8b3503311656;
  address public constant AWETH = 0x030bA81f1c18d280636F32af80b9AAd02Cf0854e;
  address public constant MORPHO = 0x777777c9898D384F785Ee44Acfe945efDFf5f3E0;

  function _getMorpho() internal pure returns (IMorpho) {
    return IMorpho(0x777777c9898D384F785Ee44Acfe945efDFf5f3E0);
  }

  function _getAToken(address underlying) internal pure returns (address aToken) {
    //TODO use address mapper
    //check where to get addresses from morpho
    if (underlying == WETH) {
      aToken = AWETH;
    }
    if (underlying == DAI) {
      aToken = ADAI;
    }
    if (underlying == USDC) {
      aToken = AUSDC;
    }
  }

  /// inheritdoc ILendingProvider
  function providerName() public pure override returns (string memory) {
    return "Morpho";
  }

  /// inheritdoc ILendingProvider
  function approvedOperator(address, address) external pure override returns (address operator) {
    operator = 0x777777c9898D384F785Ee44Acfe945efDFf5f3E0;
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
