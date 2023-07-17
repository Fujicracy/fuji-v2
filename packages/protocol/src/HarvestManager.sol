// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

/**
 * @title HarvestManager
 *
 * @author Fujidao Labs
 *
 * @notice Contract that facilitates the harvest of rewards and strategies of FujiV2 providers.
 *
 * @dev Must have HARVESTER_ROLE.
 */

import {IHarvestManager, Strategy} from "./interfaces/IHarvestManager.sol";
import {IVault} from "./interfaces/IVault.sol";
import {BorrowingVault} from "./vaults/borrowing/BorrowingVault.sol";
import {ILendingProvider} from "./interfaces/ILendingProvider.sol";
import {IHarvestable} from "./interfaces/IHarvestable.sol";
import {ISwapper} from "./interfaces/ISwapper.sol";
import {SystemAccessControl} from "./access/SystemAccessControl.sol";
import {Math} from "openzeppelin-contracts/contracts/utils/math/Math.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

contract HarvestManager is IHarvestManager, SystemAccessControl {
  using SafeERC20 for IERC20;
  using Math for uint256;

  /// @dev Custom errors
  error HarvestManager__allowExecutor_noAllowChange();
  error HarvestManager__zeroAddress();
  error HarvestManager__harvest_notValidExecutor();
  error HarvestManager__harvest_notValidSwapper();
  error HarvestManager__harvest_harvestAlreadyInProgress();
  error HarvestManager__harvest_vaultNotAllowed();

  address public immutable treasury;

  /// @dev addresses allowed to harvest via this manager.
  mapping(address => bool) public allowedExecutor;

  address private currentVaultHarvest;

  constructor(address chief_, address treasury_) {
    __SystemAccessControl_init(chief_);
    treasury = treasury_;
  }

  /// @inheritdoc IHarvestManager
  function allowExecutor(address executor, bool allowed) external override onlyTimelock {
    if (executor == address(0)) {
      revert HarvestManager__zeroAddress();
    }
    if (allowedExecutor[executor] == allowed) {
      revert HarvestManager__allowExecutor_noAllowChange();
    }
    allowedExecutor[executor] = allowed;
    emit AllowExecutor(executor, allowed);
  }

  /// @inheritdoc IHarvestManager
  function harvest(
    IVault vault,
    Strategy strategy,
    IHarvestable provider,
    ISwapper swapper,
    bytes memory data
  )
    external
  {
    if (!allowedExecutor[msg.sender]) {
      revert HarvestManager__harvest_notValidExecutor();
    }
    if (
      (strategy == Strategy.ConvertToCollateral || strategy == Strategy.RepayDebt)
        && !chief.allowedSwapper(address(swapper))
    ) {
      revert HarvestManager__harvest_notValidSwapper();
    }

    if (currentVaultHarvest != address(0)) {
      revert HarvestManager__harvest_harvestAlreadyInProgress();
    }

    currentVaultHarvest = address(vault);

    vault.harvest(vault, strategy, provider, swapper, data);
  }

  function completeHarvest(
    IVault vault,
    Strategy strategy,
    IHarvestable provider,
    ISwapper swapper,
    address[] memory tokens,
    uint256[] memory amounts
  )
    external
    returns (bytes memory data)
  {
    if (msg.sender != currentVaultHarvest) {
      revert HarvestManager__harvest_vaultNotAllowed();
    }

    if (strategy == Strategy.ConvertToCollateral) {
      data = _convertToCollateral(tokens, amounts, swapper, vault);
    }
    if (strategy == Strategy.RepayDebt) {
      data = _repayDebt(provider, tokens, amounts, swapper, vault);
    }
    if (strategy == Strategy.Distribute) {
      data = _distribute(tokens, amounts, vault);
    }

    currentVaultHarvest = address(0);
  }

  function _convertToCollateral(
    address[] memory tokens,
    uint256[] memory amounts,
    ISwapper swapper,
    IVault vault
  )
    internal
    returns (bytes memory data)
  {
    uint256 totalAmount = 0;
    address collateralAsset = vault.asset();
    for (uint256 i = 0; i < tokens.length; i++) {
      if (tokens[i] != collateralAsset) {
        IERC20(tokens[i]).safeTransferFrom(address(vault), address(this), amounts[i]);
        totalAmount +=
          _swap(swapper, address(tokens[i]), address(collateralAsset), amounts[i], address(vault));
      } else {
        totalAmount += amounts[i];
      }
    }
    IERC20(collateralAsset).safeTransfer(address(vault), totalAmount);
    data = abi.encodeWithSelector(vault.deposit.selector, totalAmount, vault);
  }

  function _repayDebt(
    IHarvestable provider,
    address[] memory tokens,
    uint256[] memory amounts,
    ISwapper swapper,
    IVault vault
  )
    internal
    returns (bytes memory data)
  {
    address debtAsset = BorrowingVault(payable(address(vault))).debtAsset();
    //check provider total debt
    //should not swap more than debt?
    //should not swap if tokens[i] == debtAsset
    uint256 providerDebt =
      ILendingProvider(address(provider)).getBorrowBalance(address(vault), vault);
    uint256 amountSwapped = 0;
    for (uint256 i = 0; i < tokens.length; i++) {
      if (tokens[i] == debtAsset) {
        IERC20(tokens[i]).safeTransferFrom(address(vault), address(this), amounts[i]);
        continue;
      }
      //swap desired amount here
      //stop if totalSwapped >= providerDebt?
      IERC20(tokens[i]).safeTransferFrom(address(vault), address(this), amounts[i]);
      amountSwapped += _swap(swapper, tokens[i], debtAsset, amounts[i], address(this));
    }

    IERC20(debtAsset).safeTransfer(address(vault), providerDebt);
    data = abi.encodeWithSelector(
      ILendingProvider(address(provider)).payback.selector, providerDebt, vault
    );

    //should send remaining amount to treasury
    if (amountSwapped > providerDebt) {
      IERC20(debtAsset).safeTransfer(treasury, amountSwapped - providerDebt);
    }
  }

  //TODO
  function _distribute(
    address[] memory tokens,
    uint256[] memory amounts,
    IVault vault
  )
    internal
    returns (bytes memory data)
  {}

  /**
   * @notice Swaps `assetIn` for `assetOut` using `swapper`.
   *
   * @param swapper ISwapper to be used to swap rewards.
   * @param assetIn to be swapped.
   * @param assetOut to be received.
   * @param amountIn uint256 amount of `assetIn` to be swapped.
   * @param receiver address to receive `assetOut`.
   *
   * @dev Treasury will receive any leftovers after the swap
   */
  function _swap(
    ISwapper swapper,
    address assetIn,
    address assetOut,
    uint256 amountIn,
    address receiver
  )
    internal
    returns (uint256 amountOut)
  {
    amountOut = swapper.getAmountOut(assetIn, assetOut, amountIn);

    IERC20(assetIn).safeIncreaseAllowance(address(swapper), amountIn);
    swapper.swap(address(assetIn), assetOut, amountIn, amountOut, address(receiver), treasury, 0);
  }
}
