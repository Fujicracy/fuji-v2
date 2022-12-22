// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

/**
 * @title Abstract contract for all routers.
 * @author Fujidao Labs
 * @dev Defines the interface and common functions for all routers.
 */

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {IRouter} from "../interfaces/IRouter.sol";
import {ISwapper} from "../interfaces/ISwapper.sol";
import {IVault} from "../interfaces/IVault.sol";
import {IChief} from "../interfaces/IChief.sol";
import {IFlasher} from "../interfaces/IFlasher.sol";
import {IVaultPermissions} from "../interfaces/IVaultPermissions.sol";
import {SystemAccessControl} from "../access/SystemAccessControl.sol";
import {IWETH9} from "../abstracts/WETH9.sol";

import "forge-std/console.sol";

abstract contract BaseRouter is SystemAccessControl, IRouter {
  using SafeERC20 for ERC20;

  struct BalanceChecker {
    address token;
    uint256 balance;
  }

  error BaseRouter__bundleInternal_paramsMismatch();
  error BaseRouter__bundleInternal_flashloanInvalidRequestor();
  error BaseRouter__bundleInternal_noBalanceChange();
  error BaseRouter__bundleInternal_insufficientETH();
  error BaseRouter__bundleInternal_notBeneficiary();
  error BaseRouter__safeTransferETH_transferFailed();
  error BaseRouter__receive_senderNotWETH();
  error BaseRouter__fallback_notAllowed();

  IWETH9 public immutable WETH9;

  address[] private _tokenList;
  BalanceChecker[] private _tokensToCheck;
  address private _beneficiary;

  constructor(IWETH9 weth, IChief chief) SystemAccessControl(address(chief)) {
    WETH9 = weth;
  }

  function xBundle(Action[] memory actions, bytes[] memory args) external payable override {
    _bundleInternal(actions, args);
  }

  /**
   * @dev Sweep accidental ERC-20 transfers to this contract or stuck funds due to failed
   * cross-chain calls (cf. ConnextRouter).
   * @param token The address of the ERC-20 token to sweep.
   * @param receiver The address that will receive the swept funds.
   */
  function sweepToken(ERC20 token, address receiver) external onlyHouseKeeper {
    uint256 balance = token.balanceOf(address(this));
    token.transfer(receiver, balance);
  }

  /**
   * @dev Sweep accidental ETH transfers to this contract.
   * @param receiver The address that will receive the swept funds
   */
  function sweepETH(address receiver) external onlyHouseKeeper {
    uint256 balance = address(this).balance;
    _safeTransferETH(receiver, balance);
  }

  /**
   * @dev executes a bundle of actions.
   *
   * Requirements:
   * - MUST not leave any balance in this contract after all actions.
   * - MUST call `_getTokenListFromBundle()` before `actions` are executed.
   * - MUST call `_checkNoBalanceChange()` after all `actions` are executed.
   * - MUST clear `_beneficiary` from storage after all `actions` are executed.
   */
  function _bundleInternal(Action[] memory actions, bytes[] memory args) internal {
    if (actions.length != args.length) {
      revert BaseRouter__bundleInternal_paramsMismatch();
    }

    // Check balance of all intended token transactions
    _getTokenListFromBundle(actions, args);

    uint256 len = actions.length;
    for (uint256 i = 0; i < len;) {
      if (actions[i] == Action.Deposit) {
        // DEPOSIT
        (IVault vault, uint256 amount, address receiver, address sender) =
          abi.decode(args[i], (IVault, uint256, address, address));

        _checkBeneficiary(receiver);

        address token = vault.asset();
        _safePullTokenFrom(token, sender, receiver, amount);
        _safeApprove(token, address(vault), amount);

        vault.deposit(amount, receiver);
      } else if (actions[i] == Action.Withdraw) {
        // WITHDRAW
        (IVault vault, uint256 amount, address receiver, address owner) =
          abi.decode(args[i], (IVault, uint256, address, address));
        _checkBeneficiary(owner);

        vault.withdraw(amount, receiver, owner);
      } else if (actions[i] == Action.Borrow) {
        // BORROW
        (IVault vault, uint256 amount, address receiver, address owner) =
          abi.decode(args[i], (IVault, uint256, address, address));
        _checkBeneficiary(owner);

        vault.borrow(amount, receiver, owner);
      } else if (actions[i] == Action.Payback) {
        // PAYBACK
        (IVault vault, uint256 amount, address receiver, address sender) =
          abi.decode(args[i], (IVault, uint256, address, address));
        _checkBeneficiary(receiver);

        address token = vault.debtAsset();
        _safePullTokenFrom(token, sender, receiver, amount);
        _safeApprove(token, address(vault), amount);

        vault.payback(amount, receiver);
      } else if (actions[i] == Action.PermitWithdraw) {
        // PERMIT ASSETS
        (
          IVaultPermissions vault,
          address owner,
          address receiver,
          uint256 amount,
          uint256 deadline,
          uint8 v,
          bytes32 r,
          bytes32 s
        ) = abi.decode(
          args[i], (IVaultPermissions, address, address, uint256, uint256, uint8, bytes32, bytes32)
        );
        vault.permitWithdraw(owner, receiver, amount, deadline, v, r, s);
      } else if (actions[i] == Action.PermitBorrow) {
        // PERMIT BORROW
        (
          IVaultPermissions vault,
          address owner,
          address receiver,
          uint256 amount,
          uint256 deadline,
          uint8 v,
          bytes32 r,
          bytes32 s
        ) = abi.decode(
          args[i], (IVaultPermissions, address, address, uint256, uint256, uint8, bytes32, bytes32)
        );

        vault.permitBorrow(owner, receiver, amount, deadline, v, r, s);
      } else if (actions[i] == Action.XTransfer) {
        // SIMPLE BRIDGE TRANSFER

        _crossTransfer(args[i]);
      } else if (actions[i] == Action.XTransferWithCall) {
        // BRIDGE WITH CALLDATA

        _crossTransferWithCalldata(args[i]);
      } else if (actions[i] == Action.Swap) {
        // SWAP
        (
          ISwapper swapper,
          address assetIn,
          address assetOut,
          uint256 amountIn,
          uint256 amountOut,
          address receiver,
          address sweeper,
          uint256 minSweepOut
        ) = abi.decode(
          args[i], (ISwapper, address, address, uint256, uint256, address, address, uint256)
        );

        _safeApprove(assetIn, address(swapper), amountIn);

        swapper.swap(assetIn, assetOut, amountIn, amountOut, receiver, sweeper, minSweepOut);
      } else if (actions[i] == Action.Flashloan) {
        // FLASHLOAN

        // Decode params
        (
          IFlasher flasher,
          address asset,
          uint256 flashAmount,
          address requestor,
          bytes memory requestorCalldata
        ) = abi.decode(args[i], (IFlasher, address, uint256, address, bytes));

        if (requestor != address(this)) {
          revert BaseRouter__bundleInternal_flashloanInvalidRequestor();
        }

        // Call Flasher
        flasher.initiateFlashloan(asset, flashAmount, requestor, requestorCalldata);
      } else if (actions[i] == Action.DepositETH) {
        uint256 amount = abi.decode(args[i], (uint256));

        if (amount != msg.value) {
          revert BaseRouter__bundleInternal_insufficientETH();
        }

        WETH9.deposit{value: msg.value}();
      } else if (actions[i] == Action.WithdrawETH) {
        (uint256 amount, address receiver) = abi.decode(args[i], (uint256, address));
        _checkBeneficiary(receiver);

        WETH9.withdraw(amount);

        _safeTransferETH(receiver, amount);
      }
      unchecked {
        ++i;
      }
    }
    _checkNoBalanceChange(_tokensToCheck);
    _checkNoNativeBalance();
    _beneficiary = address(0);
  }

  function _safeTransferETH(address receiver, uint256 amount) internal {
    (bool success,) = receiver.call{value: amount}(new bytes(0));
    if (!success) {
      revert BaseRouter__safeTransferETH_transferFailed();
    }
  }

  function _safePullTokenFrom(
    address token,
    address sender,
    address owner,
    uint256 amount
  )
    internal
  {
    // this check is needed because when we bundle mulptiple actions
    // it can happen the router already holds the assets in question;
    // for. example when we withdraw from a vault and deposit to another one
    if (sender != address(this) && (sender == owner || sender == msg.sender)) {
      ERC20(token).safeTransferFrom(sender, address(this), amount);
    }
  }

  function _safeApprove(address token, address to, uint256 amount) internal {
    ERC20(token).safeApprove(to, amount);
  }

  function _crossTransfer(bytes memory) internal virtual;

  function _crossTransferWithCalldata(bytes memory) internal virtual;

  /**
   * @dev Populates `_tokenList` with the erc20-tokens that will be transacted
   * in the `actions` of `_bundleInternal()`.
   * Requirements:
   * - MUST call `_checkInitialBalances()` after completing `_tokenList`.
   */
  function _getTokenListFromBundle(Action[] memory actions, bytes[] memory args) internal {
    uint256 len = actions.length;
    for (uint256 i = 0; i < len;) {
      if (actions[i] == Action.Deposit) {
        // DEPOSIT
        (IVault vault,,,) = abi.decode(args[i], (IVault, uint256, address, address));
        _addTokenToList(vault.asset());
      } else if (actions[i] == Action.Withdraw) {
        // WITHDRAW
        (IVault vault,,,) = abi.decode(args[i], (IVault, uint256, address, address));
        _addTokenToList(vault.asset());
      } else if (actions[i] == Action.Borrow) {
        // BORROW
        (IVault vault,,,) = abi.decode(args[i], (IVault, uint256, address, address));
        _addTokenToList(vault.debtAsset());
      } else if (actions[i] == Action.Payback) {
        // PAYBACK
        (IVault vault,,,) = abi.decode(args[i], (IVault, uint256, address, address));
        _addTokenToList(vault.debtAsset());
      } else if (actions[i] == Action.Swap) {
        // SWAP
        (, address assetIn, address assetOut,,,,,) = abi.decode(
          args[i], (ISwapper, address, address, uint256, uint256, address, address, uint256)
        );
        _addTokenToList(assetIn);
        _addTokenToList(assetOut);
      } else if (actions[i] == Action.Flashloan) {
        // FLASHLOAN
        (, address asset,,,) = abi.decode(args[i], (IFlasher, address, uint256, address, bytes));
        _addTokenToList(asset);
      } else if (actions[i] == Action.DepositETH) {
        _addTokenToList(address(WETH9));
      } else if (actions[i] == Action.WithdrawETH) {
        _addTokenToList(address(WETH9));
      }
      unchecked {
        ++i;
      }
    }
    _checkInitialBalances();
  }

  /**
   * @dev Returns true if token has already been added to `_tokenList`.
   */
  function _isInTokenList(address token) private view returns (bool value) {
    uint256 len = _tokenList.length;
    for (uint256 i = 0; i < len;) {
      if (token == _tokenList[i]) {
        value = true;
      }
      unchecked {
        ++i;
      }
    }
  }

  /**
   * @dev Adds a token to `_tokenList`.
   * Requirements:
   * - MUST check if token has already been added.
   */
  function _addTokenToList(address token) private {
    if (!_isInTokenList(token)) {
      _tokenList.push(token);
    }
  }

  /**
   * @dev Checks the initial `erc20-balanceOf` of `_tokenList` of this address.
   * Requirements:
   * - MUST be called in `_getTokenListFromBundle()` after .`_tokenList` is populated.
   */
  function _checkInitialBalances() private {
    uint256 len = _tokenList.length;
    for (uint256 i = 0; i < len; i++) {
      BalanceChecker memory checkedToken =
        BalanceChecker(_tokenList[i], IERC20(_tokenList[i]).balanceOf(address(this)));
      _tokensToCheck.push(checkedToken);
    }
    delete _tokenList;
  }

  /**
   * @dev Checks that `erc20-balanceOf` of `_tokenList` haven't change for this address.
   * Requirements:
   * - MUST be called in `_bundleInternal()` at the end of all executed `actions`.
   * - MUST clear `_tokenList` from storage at the end of checks.
   * - MUST clear `_tokensToCheck` from storage at the end of checks.
   */
  function _checkNoBalanceChange(BalanceChecker[] memory tokensToCheck) private {
    uint256 tlenght = tokensToCheck.length;
    for (uint256 i = 0; i < tlenght;) {
      console.log("inside@_checkNoBalanceChange-checking token:", tokensToCheck[i].token);
      uint256 previousBalance = tokensToCheck[i].balance;
      uint256 currentBalance = IERC20(tokensToCheck[i].token).balanceOf(address(this));
      console.log("previousBalance", previousBalance, "currentBalance", currentBalance);
      if (currentBalance != previousBalance) {
        revert BaseRouter__bundleInternal_noBalanceChange();
      }
      unchecked {
        ++i;
      }
    }
    delete _tokenList;
    delete _tokensToCheck;
  }

  function _checkNoNativeBalance() private view {
    if (address(this).balance > 0) {
      revert BaseRouter__bundleInternal_noBalanceChange();
    }
  }

  function _checkBeneficiary(address user) internal {
    // when bundling multiple actions assure that we act for a single beneficiary;
    // receivers on DEPOSIT and PAYBACK and owners on WITHDRAW and BORROW
    // must be the same user
    if (_beneficiary == address(0)) {
      _beneficiary = user;
    } else {
      if (_beneficiary != user) revert BaseRouter__bundleInternal_notBeneficiary();
    }
  }

  /**
   * @dev Only WETH contract is allowed to transfer ETH to this address.
   * Prevent other addresses to send Ether to this contract.
   */
  receive() external payable {
    if (msg.sender != address(WETH9)) {
      revert BaseRouter__receive_senderNotWETH();
    }
  }

  /**
   * @dev Revert fallback calls
   */
  fallback() external payable {
    revert BaseRouter__fallback_notAllowed();
  }
}
