// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IVault} from "../../interfaces/IVault.sol";
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {IEuler} from "../../interfaces/euler/IEuler.sol";
import {IEulerMarkets} from "../../interfaces/euler/IEulerMarkets.sol";
import {IEulerEToken} from "../../interfaces/euler/IEulerEToken.sol";
import {IEulerDToken} from "../../interfaces/euler/IEulerDToken.sol";

/**
 * @title Euler Finance Lending Provider.
 * @author fujidao Labs
 * @notice This contract allows interaction with Euler Finance.
 */
contract Euler is ILendingProvider {

  //TODO complete IEuler and use it to get modules

  function _getEuler() internal pure returns (IEuler) {
    return IEuler(0x27182842E098f60e3D576794A5bFFb0777E025d3);
  }

  function _getEulerMarkets() internal pure returns (IEulerMarkets) {
    return IEulerMarkets(0x3520d5a913427E6F0D6A83E07ccD4A4da316e4d3); 
  }

  /// inheritdoc ILendingProvider
  function providerName() public pure override returns (string memory) {
    return "Euler";
  }


  //TODO remove this comment (address asset, address vault)
  /// inheritdoc ILendingProvider
  function approvedOperator(address, address) external pure override returns (address operator) {
    // operator = address(_getEuler());
    operator = address(_getEuler());
  }

  //TODO maybe create function _underlyingToEToken to avoid repeting code
  /// inheritdoc ILendingProvider
  function deposit(uint256 amount, IVault vault) external override returns (bool success) {
    IEulerMarkets markets = _getEulerMarkets();
    IEulerEToken eToken = IEulerEToken(markets.underlyingToEToken(vault.asset()));

    // The "0" argument refers to the sub-account you are depositing to
    eToken.deposit(0, amount);

    // Enter the collateral market
    markets.enterMarket(0, vault.asset());
    success = true;
  }
  
  //TODO maybe create function _underlyingToDToken to avoid repeting code
  /// inheritdoc ILendingProvider
  function borrow(uint256 amount, IVault vault) external override returns (bool success) {
    IEulerMarkets markets = _getEulerMarkets();
    
    // Get the dToken address of the borrowed asset:
    IEulerDToken borrowedDToken = IEulerDToken(markets.underlyingToDToken(vault.debtAsset()));
    borrowedDToken.borrow(0, amount);

    success = true;
  }

  /// inheritdoc ILendingProvider
  function withdraw(uint256 amount, IVault vault) external override returns (bool success) {
    IEulerMarkets markets = _getEulerMarkets();
    IEulerEToken eToken = IEulerEToken(markets.underlyingToEToken(vault.asset()));

    // The "0" argument refers to the sub-account you are withdrawing from
    eToken.withdraw(0, amount);
    success = true;
  }

  //TODO check if its necessary to approve to repay
  /// inheritdoc ILendingProvider
  function payback(uint256 amount, IVault vault) external override returns (bool success) {
    IEulerMarkets markets = _getEulerMarkets();
    IEulerDToken borrowedDToken = IEulerDToken(markets.underlyingToDToken(vault.debtAsset()));

    borrowedDToken.repay(0, amount);
    success = true;
  }

  //TODO
  /// inheritdoc ILendingProvider
  function getDepositRateFor(IVault vault) external view override returns (uint256 rate) {
    rate = 0;
  }

  //TODO
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
    console.log("@getDepositBalance");
    IEulerMarkets markets = _getEulerMarkets();
    IEulerEToken eToken = IEulerEToken(markets.underlyingToEToken(vault.asset()));

    console.log("eToken.balanceOf(address(user)) - ", eToken.balanceOf(user));

    balance = eToken.balanceOf(address(user));
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
    IEulerMarkets markets = _getEulerMarkets();
    IEulerDToken dToken = IEulerDToken(markets.underlyingToDToken(vault.debtAsset()));

    balance = dToken.balanceOf(address(user));
  }
}
