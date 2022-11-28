// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IVault} from "../../interfaces/IVault.sol";
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {IMorpho} from "../../interfaces/morpho/IMorpho.sol";
import {ILens} from "../../interfaces/morpho/ILens.sol";

/**
 * @title Morpho Lending Provider.
 * @author fujidao Labs
 * @notice This contract allows interaction with Euler Finance.
 */
contract MorphoCompound is ILendingProvider {
  //TODO use address mapper
  address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
  address public constant CETH = 0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5;

  address public constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
  address public constant CDAI = 0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643;

  address public constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
  address public constant CUSDC = 0x39AA39c021dfbaE8faC545936693aC917d5E7563;

  address public constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
  address public constant CUSDT = 0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9;

  address public constant WBTC = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;
  address public constant CWBTC2 = 0xccF4429DB6322D5C611ee964527D42E5d685DD6a;

  address public constant LENS = 0x930f1b46e1D081Ec1524efD95752bE3eCe51EF67;

  // address public constant cAave = 0xe65cdB6479BaC1e22340E4E755fAE7E509EcD06c;
  // address public constant cComp = 0x70e36f6BF80a52b3B46b3aF8e106CC0ed743E8e4;
  // address public constant cBat = 0x6C8c6b02E7b2BE14d4fA6022Dfd6d75921D90E4E;
  // address public constant cTusd = 0x12392F67bdf24faE0AF363c24aC620a2f67DAd86;
  // address public constant cUni = 0x35A18000230DA775CAc24873d00Ff85BccdeD550;
  // address public constant cZrx = 0xB3319f5D18Bc0D84dD1b4825Dcde5d5f7266d407;
  // address public constant cLink = 0xFAce851a4921ce59e912d19329929CE6da6EB0c7;
  // address public constant cMkr = 0x95b4eF2869eBD94BEb4eEE400a99824BF5DC325b;
  // address public constant cFei = 0x7713DD9Ca933848F6819F38B8352D9A15EA73F67;
  // address public constant cYfi = 0x80a2AE356fc9ef4305676f7a3E2Ed04e12C33946;
  // address public constant cUsdp = 0x041171993284df560249B57358F931D9eB7b925D;
  // address public constant cSushi = 0x4B0181102A0112A2ef11AbEE5563bb4a3176c9d7;

  function _getMorpho() internal pure returns (IMorpho) {
    return IMorpho(0x8888882f8f843896699869179fB6E4f7e3B58888);
  }

  function _getCToken(address underlying) internal pure returns (address cToken) {
    //also check:
    //function baseToken() virtual external view returns (address);
    //https://etherscan.deth.net/address/0xc3d688B66703497DAA19211EEdff47f25384cdc3#code
    //TODO use address mapper
    if (underlying == WETH) {
      cToken = CETH;
    }
    if (underlying == DAI) {
      cToken = CDAI;
    }
    if (underlying == USDC) {
      cToken = CUSDC;
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
    (uint256 ratePerBlock,,) = ILens(LENS).getAverageSupplyRatePerBlock(_getCToken(vault.asset()));
    //no. of blocks per year
    //TODO check if morpho is using compound v2/v3
    rate = ratePerBlock * 2102400;
  }

  /// inheritdoc ILendingProvider
  function getBorrowRateFor(IVault vault) external view override returns (uint256 rate) {
    (uint256 ratePerBlock,,) =
      ILens(LENS).getAverageBorrowRatePerBlock(_getCToken(vault.debtAsset()));
    //no. of blocks per year
    //TODO check if morpho is using compound v2/v3
    rate = ratePerBlock * 2102400;
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
      ILens(LENS).getCurrentSupplyBalanceInOf(_getCToken(vault.asset()), user);
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
      ILens(LENS).getCurrentBorrowBalanceInOf(_getCToken(vault.debtAsset()), user);
    balance = borrowedOnPool + borrowedP2P;
  }
}
