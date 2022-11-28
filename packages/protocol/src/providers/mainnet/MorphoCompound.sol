// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IVault} from "../../interfaces/IVault.sol";
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {IMorpho} from "../../interfaces/Morpho/IMorpho.sol";

/**
 * @title Morpho Lending Provider.
 * @author fujidao Labs
 * @notice This contract allows interaction with Euler Finance.
 */
contract MorphoCompound is ILendingProvider {
  address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
  address public constant CETH = 0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5;

  address public constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
  address public constant CDAI = 0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643;

  address public constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

  function _getMorpho() internal pure returns (IMorpho) {
    return IMorpho(0x8888882f8f843896699869179fB6E4f7e3B58888);
  }

  function _getCToken(address underlying) internal returns (address) {
    //also check:
    //function baseToken() virtual external view returns (address);
    //https://etherscan.deth.net/address/0xc3d688B66703497DAA19211EEdff47f25384cdc3#code
    if (underlying == WETH) {
      return CETH;
    }
    if (underlying == DAI) {
      return CDAI;
    }
  }

  /// inheritdoc ILendingProvider
  function providerName() public pure override returns (string memory) {
    return "Morpho";
  }

  /// inheritdoc ILendingProvider
  function approvedOperator(address, address) external pure override returns (address operator) {
    operator = 0x8888882f8f843896699869179fB6E4f7e3B58888;
  }

  /// inheritdoc ILendingProvider
  function deposit(uint256 amount, IVault vault) external override returns (bool success) {
    // IERC20(_underlying).approve(MORPHO, _amount);
    _getMorpho().supply(
      _getCToken(vault.asset()),
      address(vault), /*the address of the user you want to supply on behalf of*/
      amount
    );
    success = true;
  }

  /// inheritdoc ILendingProvider
  function borrow(uint256 amount, IVault vault) external override returns (bool success) {
    _getMorpho().borrow(_getCToken(vault.debtAsset()), amount);
    success = true;
  }

  /// inheritdoc ILendingProvider
  function withdraw(uint256 amount, IVault vault) external override returns (bool success) {
    _getMorpho().withdraw(_getCToken(vault.asset()), amount);
    success = true;
  }

  /// inheritdoc ILendingProvider
  function payback(uint256 amount, IVault vault) external override returns (bool success) {
    _getMorpho().repay(
      _getCToken(vault.debtAsset()),
      address(vault), // the address of the user you want to repay on behalf of
      amount
    );
    success = true;
  }

  /// inheritdoc ILendingProvider
  function getDepositRateFor(IVault vault) external view override returns (uint256 rate) {
    rate = 0;
  }

  /// inheritdoc ILendingProvider
  function getBorrowRateFor(IVault vault) external view override returns (uint256 rate) {
    rate = 0;
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
    balance = 0;
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
    balance = 0;
  }
}
