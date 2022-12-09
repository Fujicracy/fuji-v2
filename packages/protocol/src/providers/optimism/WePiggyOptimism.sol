// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IVault} from "../../interfaces/IVault.sol";
import {ILendingProvider} from "../../interfaces/ILendingProvider.sol";
import {IAddrMapper} from "../../interfaces/IAddrMapper.sol";
import {IComptroller} from "../../interfaces/compoundV2/IComptroller.sol";
import {ICETH} from "../../interfaces/compoundV2/ICETH.sol";
import {ICERC20} from "../../interfaces/compoundV2/ICERC20.sol";
import {IGenCToken} from "../../interfaces/compoundV2/IGenCToken.sol";
import {ICETH} from "../../interfaces/compoundV2/ICETH.sol";
import {ICERC20} from "../../interfaces/compoundV2/ICERC20.sol";

contract HelperFunct {
  function _isNative(address token) internal pure returns (bool) {
    return (token == address(0) || token == address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE));
  }

  //TODO define mappings
  function _getAddrmapper() internal pure returns (IAddrMapper) {
    // TODO Define final address after deployment strategy is set.
    return IAddrMapper(0x529eE84BFE4F37132f5f9599d4cc4Ff16Ee6d0D2);
  }

  function _getCToken(address underlying) internal view returns (address cToken) {
    cToken = _getAddrmapper().getAddressMapping("Compound", underlying);
  }

  function _getComptrollerAddress() internal pure returns (address) {
    return 0x896aecb9E73Bf21C50855B7874729596d0e511CB; // WePiggy Optimism
  }

  // WePiggy functions

  /**
   * @dev Approves vault's assets as collateral for Compound Protocol.
   * @param _cTokenAddress: asset type to be approved as collateral.
   */
  function _enterCollatMarket(address _cTokenAddress) internal {
    // Create a reference to the corresponding network Comptroller
    IComptroller comptroller = IComptroller(_getComptrollerAddress());

    address[] memory cTokenMarkets = new address[](1);
    cTokenMarkets[0] = _cTokenAddress;
    comptroller.enterMarkets(cTokenMarkets);
  }

  /**
   * @dev Removes vault's assets as collateral for Compound Protocol.
   * @param _cTokenAddress: asset type to be removed as collateral.
   */
  function _exitCollatMarket(address _cTokenAddress) internal {
    // Create a reference to the corresponding network Comptroller
    IComptroller comptroller = IComptroller(_getComptrollerAddress());

    comptroller.exitMarket(_cTokenAddress);
  }
}

/**
 * @title WePiggy Lending Provider.
 * @author fujidao Labs
 * @notice This contract allows interaction with WePiggy.
 */
contract WePiggyOptimism is ILendingProvider, HelperFunct {
  //TODO use addrmapper
  //check the addresses are right for this chain
  address public pETH = 0x27A94869341838D5783368a8503FdA5fbCd7987c;
  address public pDAI = 0x85166b72c87697a6acfF24101B43Fd54fE28a179;
  address public pUSDT = 0x5cFad792C4Df1323188180778AeC58E00eAcE32a;
  address public pUSDC = 0xf8E5b9738BF63ADFFf36a849F9b9C9617c8D8c1f;
  address public pWBTC = 0xc12B9D620bFCB48be3e0CCbf0ea80C717333b46F;

  /// inheritdoc ILendingProvider
  function providerName() public pure override returns (string memory) {
    return "WePiggy_Optimism";
  }

  /// inheritdoc ILendingProvider
  function approvedOperator(address, address) external pure override returns (address operator) {
    operator = _getComptrollerAddress();
  }

  /// inheritdoc ILendingProvider
  function deposit(uint256 amount, IVault vault) external override returns (bool success) {
    // function deposit(address _asset, uint256 _amount) external payable override {

    // Get cToken address from mapping
    address cTokenAddr = _getCToken(vault.asset());

    // Enter and/or ensure collateral market is enacted
    _enterCollatMarket(cTokenAddr);

    if (_isNative(vault.asset())) {
      // Create a reference to the cToken contract
      ICETH cToken = ICETH(cTokenAddr);

      // Compound protocol Mints cTokens, ETH method
      cToken.mint{value: amount}();
    } else {
      // Create reference to the ERC20 contract
      IERC20 erc20token = IERC20(vault.asset());

      // Create a reference to the cToken contract
      ICERC20 cToken = ICERC20(cTokenAddr);

      // Checks, Vault balance of ERC20 to make deposit
      require(erc20token.balanceOf(address(this)) >= amount, "Not enough Balance");

      // Approve to move ERC20tokens
      // erc20token.univApprove(address(cTokenAddr), amount);

      // Compound Protocol mints cTokens, trhow error if not
      require(cToken.mint(amount) == 0, "Deposit-failed");
    }
    success = true;
  }

  /// inheritdoc ILendingProvider
  function borrow(uint256 amount, IVault vault) external override returns (bool success) {
    // Get cToken address from mapping
    address cTokenAddr = _getCToken(vault.asset());

    // Create a reference to the corresponding cToken contract
    IGenCToken cToken = IGenCToken(cTokenAddr);

    // Compound Protocol Borrow Process, throw errow if not.
    require(cToken.borrow(amount) == 0, "borrow-failed");
    success = true;
  }

  /// inheritdoc ILendingProvider
  function withdraw(uint256 amount, IVault vault) external override returns (bool success) {
    // Get cToken address from mapping
    address cTokenAddr = _getCToken(vault.asset());

    // Create a reference to the corresponding cToken contract
    IGenCToken cToken = IGenCToken(cTokenAddr);

    // Compound Protocol Redeem Process, throw errow if not.
    require(cToken.redeemUnderlying(amount) == 0, "Withdraw-failed");
    success = true;
  }

  /// inheritdoc ILendingProvider
  function payback(uint256 amount, IVault vault) external override returns (bool success) {
    // // Get cToken address from mapping
    // address cTokenAddr = _getCToken(vault.debtAsset());
    //
    // if (_isNative(vault.asset())) {
    //   // Create a reference to the corresponding cToken contract
    //   ICETH cToken = ICETH(cTokenAddr);
    //
    //   cToken.repayBorrow{ value: msg.value }();
    // } else {
    //   // Create reference to the ERC20 contract
    //   IERC20 erc20token = IERC20(vault.asset());
    //
    //   // Create a reference to the corresponding cToken contract
    //   ICERC20 cToken = ICERC20(cTokenAddr);
    //
    //   // Check there is enough balance to pay
    //   require(erc20token.balanceOf(address(this)) >= amount, "Not-enough-token");
    //   // erc20token.univApprove(address(cTokenAddr), amount);
    //   cToken.repayBorrow(amount);
    // }
    success = true;
  }

  /// inheritdoc ILendingProvider
  function getDepositRateFor(IVault vault) external view override returns (uint256 rate) {
    address cTokenAddr = _getCToken(vault.asset());

    // Block Rate transformed for common mantissa for Fuji in ray (1e27), Note: Compound uses base 1e18
    uint256 bRateperBlock = IGenCToken(cTokenAddr).supplyRatePerBlock() * 10 ** 9;

    // The approximate number of blocks per year that is assumed by the Compound interest rate model
    uint256 blocksperYear = 2102400;
    rate = bRateperBlock * blocksperYear;
  }

  /// inheritdoc ILendingProvider
  function getBorrowRateFor(IVault vault) external view override returns (uint256 rate) {
    address cTokenAddr = _getCToken(vault.debtAsset());

    // Block Rate transformed for common mantissa for Fuji in ray (1e27), Note: Compound uses base 1e18
    uint256 bRateperBlock = IGenCToken(cTokenAddr).borrowRatePerBlock() * 10 ** 9;

    // The approximate number of blocks per year that is assumed by the Compound interest rate model
    uint256 blocksperYear = 2102400;
    rate = bRateperBlock * blocksperYear;
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
    address cTokenAddr = _getCToken(vault.debtAsset());
    uint256 cTokenBal = IGenCToken(cTokenAddr).balanceOf(msg.sender);
    uint256 exRate = IGenCToken(cTokenAddr).exchangeRateStored();

    balance = (exRate * cTokenBal) / 1e18;
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
    address cTokenAddr = _getCToken(vault.debtAsset());

    balance = IGenCToken(cTokenAddr).borrowBalanceStored(msg.sender);
  }
}
