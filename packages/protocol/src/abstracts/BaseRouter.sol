// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

/**
 * @title BaseRouter
 *
 * @author Fujidao Labs
 *
 * @notice Abstract contract to be inherited by all routers.
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

abstract contract BaseRouter is SystemAccessControl, IRouter {
  using SafeERC20 for ERC20;

  /**
   * @dev Contains an address of an ERC-20 and the balance the router holds
   * at a given moment of the transaction (ref. `_tokensToCheck`).
   */
  struct Snapshot {
    address token;
    uint256 balance;
  }

  /**
   * @dev Emitted when `caller` is updated according to `allowed` boolean
   * to perform cross-chain calls.
   *
   * @param caller permitted for cross-chain calls
   * @param allowed boolean state
   */
  event AllowCaller(address caller, bool allowed);

  /// @dev Custom Errors
  error BaseRouter__bundleInternal_paramsMismatch();
  error BaseRouter__bundleInternal_flashloanInvalidRequestor();
  error BaseRouter__bundleInternal_noBalanceChange();
  error BaseRouter__bundleInternal_insufficientETH();
  error BaseRouter__bundleInternal_notBeneficiary();
  error BaseRouter__safeTransferETH_transferFailed();
  error BaseRouter__receive_senderNotWETH();
  error BaseRouter__fallback_notAllowed();
  error BaseRouter__allowCaller_zeroAddress();
  error BaseRouter__allowCaller_noAllowChange();

  IWETH9 public immutable WETH9;

  /// @dev Apply it on entry cross-chain calls functions as required.
  mapping(address => bool) internal _isAllowedCaller;

  /**
   * @dev Stores token balances of this contract at a given moment.
   * It's used to ensure there're no changes in balances at the
   * end of a transaction.
   */
  Snapshot[] internal _tokensToCheck;

  /**
   * @dev Operations in the bundle should "benefit" or be executed
   * on behalf of this account. These are receivers on DEPOSIT and PAYBACK
   * or owners on WITHDRAW and BORROW.
   */
  address private _beneficiary;

  /**
   * @notice Constructor of a new {BaseRouter}.
   *
   * @param weth wrapped native token of this chain
   * @param chief contract
   */
  constructor(IWETH9 weth, IChief chief) SystemAccessControl(address(chief)) {
    WETH9 = weth;
  }

  /// @inheritdoc IRouter
  function xBundle(Action[] memory actions, bytes[] memory args) external payable override {
    _bundleInternal(actions, args);
  }

  /**
   * @notice Marks a specific caller as allowed/disallowed to call certain functions.
   *
   * @param caller address to allow/disallow
   * @param allowed 'true' to allow, 'false' to disallow
   *
   * @dev The authorization is to be implemented on the bridge-specific contract.
   */
  function allowCaller(address caller, bool allowed) external onlyTimelock {
    _allowCaller(caller, allowed);
  }

  /// @inheritdoc IRouter
  function sweepToken(ERC20 token, address receiver) external onlyHouseKeeper {
    uint256 balance = token.balanceOf(address(this));
    token.transfer(receiver, balance);
  }

  /// @inheritdoc IRouter
  function sweepETH(address receiver) external onlyHouseKeeper {
    uint256 balance = address(this).balance;
    _safeTransferETH(receiver, balance);
  }

  /**
   * @dev Executes a bundle of actions.
   * Requirements:
   * - Must not leave any balance in this contract after all actions.
   * - Must call `_checkNoBalanceChange()` after all `actions` are executed.
   * - Must call `_addTokenToList()` in `actions` that involve tokens.
   * - Must clear `_beneficiary` from storage after all `actions` are executed.
   *
   * @param actions an array of actions that will be executed in a row
   * @param args an array of encoded inputs needed to execute each action
   */
  function _bundleInternal(Action[] memory actions, bytes[] memory args) internal {
    if (actions.length != args.length) {
      revert BaseRouter__bundleInternal_paramsMismatch();
    }

    uint256 nativeBalance = address(this).balance - msg.value;

    uint256 len = actions.length;
    for (uint256 i = 0; i < len;) {
      if (actions[i] == Action.Deposit) {
        // DEPOSIT
        (IVault vault, uint256 amount, address receiver, address sender) =
          abi.decode(args[i], (IVault, uint256, address, address));

        address token = vault.asset();
        _checkBeneficiary(receiver);
        _addTokenToList(token);
        _safePullTokenFrom(token, sender, receiver, amount);
        _safeApprove(token, address(vault), amount);

        vault.deposit(amount, receiver);
      } else if (actions[i] == Action.Withdraw) {
        // WITHDRAW
        (IVault vault, uint256 amount, address receiver, address owner) =
          abi.decode(args[i], (IVault, uint256, address, address));

        _checkBeneficiary(owner);
        _addTokenToList(vault.asset());

        vault.withdraw(amount, receiver, owner);
      } else if (actions[i] == Action.Borrow) {
        // BORROW
        (IVault vault, uint256 amount, address receiver, address owner) =
          abi.decode(args[i], (IVault, uint256, address, address));

        _checkBeneficiary(owner);
        _addTokenToList(vault.debtAsset());

        vault.borrow(amount, receiver, owner);
      } else if (actions[i] == Action.Payback) {
        // PAYBACK
        (IVault vault, uint256 amount, address receiver, address sender) =
          abi.decode(args[i], (IVault, uint256, address, address));

        address token = vault.debtAsset();
        _checkBeneficiary(receiver);
        _addTokenToList(token);
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

        _addTokenToList(assetIn);
        _addTokenToList(assetOut);
        _safeApprove(assetIn, address(swapper), amountIn);

        swapper.swap(assetIn, assetOut, amountIn, amountOut, receiver, sweeper, minSweepOut);
      } else if (actions[i] == Action.Flashloan) {
        // FLASHLOAN

        // Decode params.
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
        _addTokenToList(asset);

        // Call Flasher.
        flasher.initiateFlashloan(asset, flashAmount, requestor, requestorCalldata);
      } else if (actions[i] == Action.DepositETH) {
        uint256 amount = abi.decode(args[i], (uint256));

        if (amount != msg.value) {
          revert BaseRouter__bundleInternal_insufficientETH();
        }
        _addTokenToList(address(WETH9));

        WETH9.deposit{value: msg.value}();
      } else if (actions[i] == Action.WithdrawETH) {
        (uint256 amount, address receiver) = abi.decode(args[i], (uint256, address));
        _checkBeneficiary(receiver);
        _addTokenToList(address(WETH9));

        WETH9.withdraw(amount);

        _safeTransferETH(receiver, amount);
      }
      unchecked {
        ++i;
      }
    }
    _checkNoBalanceChange(_tokensToCheck, nativeBalance);
    _beneficiary = address(0);
  }

  /**
   * @dev Helper function to transfer ETH.
   *
   * @param receiver address to receive the ETH
   * @param amount amount to be transferred
   */
  function _safeTransferETH(address receiver, uint256 amount) internal {
    (bool success,) = receiver.call{value: amount}(new bytes(0));
    if (!success) {
      revert BaseRouter__safeTransferETH_transferFailed();
    }
  }

  /**
   * @dev Helper function to pull ERC-20 token from a sender address after some checks.
   * The checks are needed because when we bundle mulptiple actions
   * it can happen the router already holds the assets in question;
   * for. example when we withdraw from a vault and deposit to another one.
   *
   * @param token ERC-20 token address
   * @param sender address to pull tokens from
   * @param owner address on the behalf of which we act
   * @param amount amount of tokens to be pulled
   */
  function _safePullTokenFrom(
    address token,
    address sender,
    address owner,
    uint256 amount
  )
    internal
  {
    if (sender != address(this) && (sender == owner || sender == msg.sender)) {
      ERC20(token).safeTransferFrom(sender, address(this), amount);
    }
  }

  /**
   * @dev Helper function to approve ERC-20 transfers.
   *
   * @param token ERC-20 address to approve
   * @param to address to approve as a spender
   * @param amount amount to be approved
   */
  function _safeApprove(address token, address to, uint256 amount) internal {
    ERC20(token).safeApprove(to, amount);
  }

  /**
   * @dev Check `allowCaller()` above.
   *
   * @param caller address to allow/disallow
   * @param allowed 'true' to allow, 'false' to disallow
   */
  function _allowCaller(address caller, bool allowed) internal {
    if (caller == address(0)) {
      revert BaseRouter__allowCaller_zeroAddress();
    }
    if (_isAllowedCaller[caller] == allowed) {
      revert BaseRouter__allowCaller_noAllowChange();
    }
    _isAllowedCaller[caller] = allowed;
    emit AllowCaller(caller, allowed);
  }

  /**
   * @dev Function to be implemented on the bridge-specific contract
   * used to transfer funds WITHOUT calldata to a destination chain.
   */
  function _crossTransfer(bytes memory) internal virtual;

  /**
   * @dev Function to be implemented on the bridge-specific contract
   * used to transfer funds WITH calldata to a destination chain.
   */
  function _crossTransferWithCalldata(bytes memory) internal virtual;

  /**
   * @dev Returns "true" if token has already been added to `_tokensToCheck`.
   *
   * @param token address of ERC-20 to check
   */
  function _isInTokenList(address token) private view returns (bool value) {
    uint256 len = _tokensToCheck.length;
    for (uint256 i = 0; i < len;) {
      if (token == _tokensToCheck[i].token) {
        value = true;
      }
      unchecked {
        ++i;
      }
    }
  }

  /**
   * @dev Adds a token and balance to `_tokensToCheck`.
   * Requirements:
   * - Must check if token has already been added.
   *
   * @param token address of ERC-20 to be pushed
   */
  function _addTokenToList(address token) private {
    if (!_isInTokenList(token)) {
      Snapshot memory checkedToken = Snapshot(token, IERC20(token).balanceOf(address(this)));
      _tokensToCheck.push(checkedToken);
    }
  }

  /**
   * @dev Checks that `erc20-balanceOf` of `_tokensToCheck` haven't change for this address.
   * Requirements:
   * - Must be called in `_bundleInternal()` at the end of all executed `actions`.
   * - Must clear `_tokensToCheck` from storage at the end of checks.
   *
   * @param tokensToCheck array of 'Snapshot' elements
   * @param nativeBalance the stored balance of ETH
   */
  function _checkNoBalanceChange(Snapshot[] memory tokensToCheck, uint256 nativeBalance) private {
    uint256 len = tokensToCheck.length;
    for (uint256 i = 0; i < len;) {
      uint256 previousBalance = tokensToCheck[i].balance;
      uint256 currentBalance = IERC20(tokensToCheck[i].token).balanceOf(address(this));

      if (currentBalance != previousBalance) {
        revert BaseRouter__bundleInternal_noBalanceChange();
      }
      unchecked {
        ++i;
      }
    }

    // Check at the end the native balance.
    if (nativeBalance != address(this).balance) {
      revert BaseRouter__bundleInternal_noBalanceChange();
    }

    delete _tokensToCheck;
  }

  /**
   * @dev When bundling multiple actions assure that we act for a single beneficiary;
   * receivers on DEPOSIT and PAYBACK and owners on WITHDRAW and BORROW
   * must be the same user
   *
   * @param user address to verify is the beneficiary
   */
  function _checkBeneficiary(address user) internal {
    if (_beneficiary == address(0)) {
      _beneficiary = user;
    } else {
      if (_beneficiary != user) {
        revert BaseRouter__bundleInternal_notBeneficiary();
      }
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
   * @dev Revert fallback calls.
   */
  fallback() external payable {
    revert BaseRouter__fallback_notAllowed();
  }
}
