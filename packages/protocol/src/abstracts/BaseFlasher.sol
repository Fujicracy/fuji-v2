// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

/**
 * @title Abstract contract for all flashloan providers
 *
 * @author Fujidao Labs
 *
 * @notice Defines the interface and common functions for all flashloan providers.
 */

import {IFlasher} from "../interfaces/IFlasher.sol";
import {IRouter} from "../interfaces/IRouter.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {Address} from "openzeppelin-contracts/contracts/utils/Address.sol";

abstract contract BaseFlasher is IFlasher {
  using SafeERC20 for IERC20;
  using Address for address;

  /// @dev Custom Errors
  error BaseFlasher__notAuthorized();
  error BaseFlasher__invalidEntryPoint();
  error BaseFlasher__invalidFlashloanType();
  error BaseFlasher__notEmptyEntryPoint();
  error BaseFlasher__lastActionMustBeSwap();

  string public flasherProviderName;

  address private immutable _flashloanCallAddr;

  bytes32 private _entryPoint;

  /**
   * @param flasherProviderName_ string name for identifying convenience
   * @param flashloanCallAddr_ address or mapping address at which flashloan
   * call is initiated for this flashloan provider
   */
  constructor(string memory flasherProviderName_, address flashloanCallAddr_) {
    flasherProviderName = flasherProviderName_;
    _flashloanCallAddr = flashloanCallAddr_;
  }

  /// @inheritdoc IFlasher
  function initiateFlashloan(
    address asset,
    uint256 amount,
    address requestor,
    bytes memory requestorCall
  )
    external
    virtual
    override;

  /// @inheritdoc IFlasher
  function getFlashloanSourceAddr(address) public view virtual override returns (address) {
    return _flashloanCallAddr;
  }

  /**
   * @param data bytes representing the encoded flashloan parameters
   *
   * @dev Check if a flashloan is already in course.
   * If it is, revert. If not, start the execution while preventing a new one.
   */
  function _checkAndSetEntryPoint(bytes memory data) internal {
    if (_entryPoint != "") {
      revert BaseFlasher__notEmptyEntryPoint();
    }
    _entryPoint = keccak256(abi.encode(data));
  }

  /**
   * @param data bytes representing the encoded flashloan parameters
   *
   * @dev Check if the current flashloan is in fact the one that has been initiated previously.
   */
  function _checkReentryPoint(bytes calldata data)
    internal
    view
    returns (address asset, uint256 amount, address requestor, bytes memory requestorCalldata)
  {
    if (_entryPoint == "" || _entryPoint != keccak256(abi.encode(data))) {
      revert BaseFlasher__invalidEntryPoint();
    }
    (asset, amount, requestor, requestorCalldata) =
      abi.decode(data, (address, uint256, address, bytes));
  }

  /**
   * @param asset address of the asset to be borrowed
   * @param amount integer amount to be borrowed
   * @param fee integer fee to be paid required by some provider for executing a flashloan
   * @param requestor address of the contract who called the flasher
   * @param requestorCalldata bytes representing the encoded flashloan parameters
   *
   * @dev Execute the flashloan operation requested and send the amount to payback the flashloan and fee to the provider.
   */
  function _requestorExecution(
    address asset,
    uint256 amount,
    uint256 fee,
    address requestor,
    bytes memory requestorCalldata
  )
    internal
    returns (bool)
  {
    IERC20(asset).safeTransfer(requestor, amount);

    requestor.functionCall(requestorCalldata);

    // approve flashloan source address to spend to repay flashloan
    IERC20(asset).safeApprove(getFlashloanSourceAddr(asset), amount + fee);

    // re-init
    _entryPoint = "";
    return true;
  }
}
