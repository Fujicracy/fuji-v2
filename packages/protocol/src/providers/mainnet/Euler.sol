// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title Euler
 *
 * @author Fujidao Labs
 *
 * @notice This contract allows interaction with Euler Finance.
 */

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IVault} from "../../interfaces/IVault.sol";
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {IEulerMarkets} from "../../interfaces/euler/IEulerMarkets.sol";
import {IEulerEToken} from "../../interfaces/euler/IEulerEToken.sol";
import {IEulerDToken} from "../../interfaces/euler/IEulerDToken.sol";

contract Euler is ILendingProvider {
  /**
   * @dev Returns the {IEulerMarkets} to interact with Euler.
   */
  function _getEulerMarkets() internal pure returns (IEulerMarkets) {
    return IEulerMarkets(0x3520d5a913427E6F0D6A83E07ccD4A4da316e4d3);
  }

  /// @inheritdoc ILendingProvider
  function providerName() public pure override returns (string memory) {
    return "Euler";
  }

  /// @inheritdoc ILendingProvider
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
    operator = 0x27182842E098f60e3D576794A5bFFb0777E025d3;
  }

  /// @inheritdoc ILendingProvider
  function deposit(uint256 amount, IVault vault) external override returns (bool success) {
    IEulerMarkets markets = _getEulerMarkets();
    IEulerEToken eToken = IEulerEToken(markets.underlyingToEToken(vault.asset()));

    // The "0" argument refers to the sub-account you are depositing to
    eToken.deposit(0, amount);

    // Enter the collateral market
    markets.enterMarket(0, vault.asset());
    success = true;
  }

  /// @inheritdoc ILendingProvider
  function borrow(uint256 amount, IVault vault) external override returns (bool success) {
    IEulerMarkets markets = _getEulerMarkets();

    // Get the dToken address of the borrowed asset:
    IEulerDToken borrowedDToken = IEulerDToken(markets.underlyingToDToken(vault.debtAsset()));
    borrowedDToken.borrow(0, amount);

    success = true;
  }

  /// @inheritdoc ILendingProvider
  function withdraw(uint256 amount, IVault vault) external override returns (bool success) {
    IEulerMarkets markets = _getEulerMarkets();
    IEulerEToken eToken = IEulerEToken(markets.underlyingToEToken(vault.asset()));

    // The "0" argument refers to the sub-account you are withdrawing from
    eToken.withdraw(0, amount);
    success = true;
  }

  /// @inheritdoc ILendingProvider
  function payback(uint256 amount, IVault vault) external override returns (bool success) {
    IEulerMarkets markets = _getEulerMarkets();
    IEulerDToken borrowedDToken = IEulerDToken(markets.underlyingToDToken(vault.debtAsset()));

    borrowedDToken.repay(0, amount);
    success = true;
  }

  /// @inheritdoc ILendingProvider
  function getDepositRateFor(IVault vault) external view override returns (uint256 rate) {
    IEulerMarkets markets = _getEulerMarkets();
    int256 iRate = markets.interestRate(vault.asset());
    unchecked {
      rate = iRate < 0 ? 0 : uint256(iRate);
    }
  }

  /// @inheritdoc ILendingProvider
  function getBorrowRateFor(IVault vault) external view override returns (uint256 rate) {
    IEulerMarkets markets = _getEulerMarkets();
    int256 iRate = markets.interestRate(vault.debtAsset());
    unchecked {
      rate = iRate < 0 ? 0 : uint256(iRate);
    }
  }

  /// @inheritdoc ILendingProvider
  function getDepositBalance(
    address user,
    IVault vault
  )
    external
    view
    override
    returns (uint256 balance)
  {
    IEulerMarkets markets = _getEulerMarkets();
    IEulerEToken eToken = IEulerEToken(markets.underlyingToEToken(vault.asset()));
    balance = eToken.balanceOfUnderlying(user);
  }

  /// @inheritdoc ILendingProvider
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

    balance = dToken.balanceOf(user);
  }

  /// @inheritdoc ILendingProvider
  function harvest(bytes memory /* data */ ) external pure returns (bool success) {
    return false;
  }

  //TODO
  function getHarvestToken(IVault /* vault */ ) external pure returns (address token) {
    token = address(0);
  }

  function previewHarvest(IVault /* vault */ ) external pure returns (uint256 amount) {
    return 0;
  }
}
