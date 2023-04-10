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
  error BaseRouter__bundleInternal_swapNotFirstAction();
  error BaseRouter__bundleInternal_paramsMismatch();
  error BaseRouter__bundleInternal_flashloanInvalidRequestor();
  error BaseRouter__bundleInternal_noBalanceChange();
  error BaseRouter__bundleInternal_insufficientETH();
  error BaseRouter__bundleInternal_notBeneficiary();
  error BaseRouter__checkVaultInput_notActiveVault();
  error BaseRouter__bundleInternal_notAllowedSwapper();
  error BaseRouter__bundleInternal_notAllowedFlasher();
  error BaseRouter__safeTransferETH_transferFailed();
  error BaseRouter__receive_senderNotWETH();
  error BaseRouter__fallback_notAllowed();
  error BaseRouter__allowCaller_zeroAddress();
  error BaseRouter__allowCaller_noAllowChange();

  IWETH9 public immutable WETH9;

  /// @dev Apply it on entry cross-chain calls functions as required.
  mapping(address => bool) public isAllowedCaller;

  /**
   * @dev Stores token balances of this contract at a given moment.
   * It's used to pass tokens to check from parent contract this contract.
   */
  Snapshot internal _tempTokenToCheck;

  /**
   * @notice Constructor of a new {BaseRouter}.
   *
   * @param weth wrapped native token of this chain
   * @param chief contract
   */
  constructor(IWETH9 weth, IChief chief) payable SystemAccessControl(address(chief)) {
    WETH9 = weth;
  }

  /// @inheritdoc IRouter
  function xBundle(Action[] calldata actions, bytes[] calldata args) external payable override {
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
    SafeERC20.safeTransfer(token, receiver, token.balanceOf(address(this)));
  }

  /// @inheritdoc IRouter
  function sweepETH(address receiver) external onlyHouseKeeper {
    _safeTransferETH(receiver, address(this).balance);
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
    uint256 len = actions.length;
    if (len != args.length) {
      revert BaseRouter__bundleInternal_paramsMismatch();
    }

    /**
     * @dev Operations in the bundle should "benefit" or be executed
     * on behalf of this account. These are receivers on DEPOSIT and PAYBACK
     * or owners on WITHDRAW and BORROW.
     */
    address beneficiary;

    /**
     * @dev Stores token balances of this contract at a given moment.
     * It's used to ensure there're no changes in balances at the
     * end of a transaction.
     */
    Snapshot[] memory tokensToCheck = new Snapshot[](10);

    /// @dev Add token to check from parent calls.
    if (_tempTokenToCheck.token != address(0)) {
      tokensToCheck[0] = _tempTokenToCheck;
    }

    uint256 nativeBalance = address(this).balance - msg.value;

    for (uint256 i; i < len;) {
      Action action = actions[i];
      if (action == Action.Deposit) {
        // DEPOSIT
        (IVault vault, uint256 amount, address receiver, address sender) =
          abi.decode(args[i], (IVault, uint256, address, address));

        _checkVaultInput(address(vault));

        address token = vault.asset();
        beneficiary = _checkBeneficiary(beneficiary, receiver);
        tokensToCheck = _addTokenToList(token, tokensToCheck);
        _safePullTokenFrom(token, sender, amount);
        _safeApprove(token, address(vault), amount);

        vault.deposit(amount, receiver);
      } else if (action == Action.Withdraw) {
        // WITHDRAW
        (IVault vault, uint256 amount, address receiver, address owner) =
          abi.decode(args[i], (IVault, uint256, address, address));

        _checkVaultInput(address(vault));

        beneficiary = _checkBeneficiary(beneficiary, owner);
        tokensToCheck = _addTokenToList(vault.asset(), tokensToCheck);

        vault.withdraw(amount, receiver, owner);
      } else if (action == Action.Borrow) {
        // BORROW
        (IVault vault, uint256 amount, address receiver, address owner) =
          abi.decode(args[i], (IVault, uint256, address, address));

        _checkVaultInput(address(vault));

        beneficiary = _checkBeneficiary(beneficiary, owner);
        tokensToCheck = _addTokenToList(vault.debtAsset(), tokensToCheck);

        vault.borrow(amount, receiver, owner);
      } else if (action == Action.Payback) {
        // PAYBACK
        (IVault vault, uint256 amount, address receiver, address sender) =
          abi.decode(args[i], (IVault, uint256, address, address));

        _checkVaultInput(address(vault));

        address token = vault.debtAsset();
        beneficiary = _checkBeneficiary(beneficiary, receiver);
        tokensToCheck = _addTokenToList(token, tokensToCheck);
        _safePullTokenFrom(token, sender, amount);
        _safeApprove(token, address(vault), amount);

        vault.payback(amount, receiver);
      } else if (action == Action.PermitWithdraw) {
        // PERMIT WITHDRAW
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

        _checkVaultInput(address(vault));

        vault.permitWithdraw(owner, receiver, amount, deadline, v, r, s);
        beneficiary = _checkBeneficiary(beneficiary, owner);
      } else if (action == Action.PermitBorrow) {
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

        _checkVaultInput(address(vault));

        vault.permitBorrow(owner, receiver, amount, deadline, v, r, s);
        beneficiary = _checkBeneficiary(beneficiary, owner);
      } else if (action == Action.XTransfer) {
        // SIMPLE BRIDGE TRANSFER

        beneficiary = _crossTransfer(args[i], beneficiary);
      } else if (action == Action.XTransferWithCall) {
        // BRIDGE WITH CALLDATA

        beneficiary = _crossTransferWithCalldata(args[i], beneficiary);
      } else if (action == Action.Swap) {
        // SWAP

        if (i == 0) {
          /// @dev swap cannot be actions[0].
          revert BaseRouter__bundleInternal_swapNotFirstAction();
        }

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

        if (!chief.allowedSwapper(address(swapper))) {
          revert BaseRouter__bundleInternal_notAllowedSwapper();
        }

        tokensToCheck = _addTokenToList(assetIn, tokensToCheck);
        tokensToCheck = _addTokenToList(assetOut, tokensToCheck);
        _safeApprove(assetIn, address(swapper), amountIn);

        if (receiver != address(this)) {
          beneficiary = _checkBeneficiary(beneficiary, receiver);
        }
        if (sweeper != address(this)) {
          beneficiary = _checkBeneficiary(beneficiary, sweeper);
        }

        swapper.swap(assetIn, assetOut, amountIn, amountOut, receiver, sweeper, minSweepOut);
      } else if (action == Action.Flashloan) {
        // FLASHLOAN

        // Decode params.
        (
          IFlasher flasher,
          address asset,
          uint256 flashAmount,
          address requestor,
          bytes memory requestorCalldata
        ) = abi.decode(args[i], (IFlasher, address, uint256, address, bytes));

        if (!chief.allowedFlasher(address(flasher))) {
          revert BaseRouter__bundleInternal_notAllowedFlasher();
        }
        if (requestor != address(this)) {
          revert BaseRouter__bundleInternal_flashloanInvalidRequestor();
        }
        tokensToCheck = _addTokenToList(asset, tokensToCheck);

        // Call Flasher.
        flasher.initiateFlashloan(asset, flashAmount, requestor, requestorCalldata);
      } else if (action == Action.DepositETH) {
        uint256 amount = abi.decode(args[i], (uint256));

        if (amount != msg.value) {
          revert BaseRouter__bundleInternal_insufficientETH();
        }
        tokensToCheck = _addTokenToList(address(WETH9), tokensToCheck);

        WETH9.deposit{value: msg.value}();
      } else if (action == Action.WithdrawETH) {
        (uint256 amount, address receiver) = abi.decode(args[i], (uint256, address));
        beneficiary = _checkBeneficiary(beneficiary, receiver);
        tokensToCheck = _addTokenToList(address(WETH9), tokensToCheck);

        WETH9.withdraw(amount);

        _safeTransferETH(receiver, amount);
      }
      unchecked {
        ++i;
      }
    }
    _checkNoBalanceChange(tokensToCheck, nativeBalance);
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
   * The checks are needed because when we bundle multiple actions
   * it can happen the router already holds the assets in question;
   * for. example when we withdraw from a vault and deposit to another one.
   *
   * @param token ERC-20 token address
   * @param sender address to pull tokens from
   * @param amount amount of tokens to be pulled
   */
  function _safePullTokenFrom(address token, address sender, uint256 amount) internal {
    if (sender != address(this) && sender == msg.sender) {
      SafeERC20.safeTransferFrom(ERC20(token), sender, address(this), amount);
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
    SafeERC20.safeApprove(ERC20(token), to, amount);
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
    if (isAllowedCaller[caller] == allowed) {
      revert BaseRouter__allowCaller_noAllowChange();
    }
    isAllowedCaller[caller] = allowed;
    emit AllowCaller(caller, allowed);
  }

  /**
   * @dev Function to be implemented on the bridge-specific contract
   * used to transfer funds WITHOUT calldata to a destination chain.
   */
  function _crossTransfer(bytes memory, address beneficiary) internal virtual returns (address);

  /**
   * @dev Function to be implemented on the bridge-specific contract
   * used to transfer funds WITH calldata to a destination chain.
   */
  function _crossTransferWithCalldata(
    bytes memory,
    address beneficiary
  )
    internal
    virtual
    returns (address);

  /**
   * @dev Returns "true" and on what `index` if token has already
   * been added to `tokenList`.
   *
   * @param token address of ERC-20 to check
   * @param tokenList to check
   */
  function _isInTokenList(
    address token,
    Snapshot[] memory tokenList
  )
    private
    pure
    returns (bool value, uint256 index)
  {
    uint256 len = tokenList.length;
    for (uint256 i; i < len;) {
      if (token == tokenList[i].token) {
        value = true;
        index = i;
        break;
      }
      unchecked {
        ++i;
      }
    }
  }

  /**
   * @dev Adds a token and balance to a Snapshot and returns it.
   * Requirements:
   * - Must check if token has already been added.
   *
   * @param token address of ERC-20 to be pushed
   * @param tokenList to add token
   */
  function _addTokenToList(
    address token,
    Snapshot[] memory tokenList
  )
    private
    view
    returns (Snapshot[] memory)
  {
    (bool isInList, uint256 index) = _isInTokenList(token, tokenList);
    if (!isInList) {
      uint256 position = index == 0 ? index : index + 1;
      tokenList[position] = Snapshot(token, IERC20(token).balanceOf(address(this)));
    }
    return tokenList;
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
  function _checkNoBalanceChange(
    Snapshot[] memory tokensToCheck,
    uint256 nativeBalance
  )
    private
    view
  {
    uint256 len = tokensToCheck.length;
    for (uint256 i; i < len;) {
      if (tokensToCheck[i].token != address(0)) {
        uint256 previousBalance = tokensToCheck[i].balance;
        uint256 currentBalance = IERC20(tokensToCheck[i].token).balanceOf(address(this));

        if (currentBalance != previousBalance) {
          revert BaseRouter__bundleInternal_noBalanceChange();
        }
      }
      unchecked {
        ++i;
      }
    }

    // Check at the end the native balance.
    if (nativeBalance != address(this).balance) {
      revert BaseRouter__bundleInternal_noBalanceChange();
    }
  }

  /**
   * @dev When bundling multiple actions assure that we act for a single beneficiary;
   * receivers on DEPOSIT and PAYBACK and owners on WITHDRAW and BORROW
   * must be the same user
   *
   * @param user address to verify is the beneficiary
   */
  function _checkBeneficiary(address beneficiary, address user) internal pure returns (address) {
    if (beneficiary == address(0)) {
      return user;
    } else {
      if (beneficiary != user) {
        revert BaseRouter__bundleInternal_notBeneficiary();
      }
      return user;
    }
  }

  function _checkVaultInput(address vault_) internal view {
    if (!chief.isVaultActive(vault_)) {
      revert BaseRouter__checkVaultInput_notActiveVault();
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
