// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

/**
 * @title Abstract contract for all flashloan providers.
 * @author Fujidao Labs
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

  /// Custom errors
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
   * @param flashloanCallAddr_ address or mapping address at which flashlon
   * call is initiated for this flashloan provider.
   */
  constructor(string memory flasherProviderName_, address flashloanCallAddr_) {
    flasherProviderName = flasherProviderName_;
    _flashloanCallAddr = flashloanCallAddr_;
  }

  /// @inheritdoc IFlasher
  function initiateFlashloan(
    FlashloanType flashloanType,
    bytes memory params
  )
    external
    virtual
    override;

  function getFlashloanSourceAddr(address) public view virtual override returns (address) {
    return _flashloanCallAddr;
  }

  function _checkAndSetEntryPoint(
    FlashloanType flashloanType,
    bytes calldata params
  )
    internal
    returns (bytes memory data)
  {
    data = abi.encode(flashloanType, params);
    if (_entryPoint != "") {
      revert BaseFlasher__notEmptyEntryPoint();
    }
    _entryPoint = keccak256(abi.encode(data));
  }

  function _checkReentryPoint(bytes calldata data) internal view {
    if (_entryPoint == "" || _entryPoint != keccak256(abi.encode(data))) {
      revert BaseFlasher__invalidEntryPoint();
    }
  }

  /**
   */
  function _normalOperation(
    address asset,
    uint256 amount,
    uint256 fee,
    bytes memory data
  )
    internal
    returns (bool)
  {
    NormalParams memory params = abi.decode(data, (NormalParams));
    IERC20(params.asset).safeTransfer(params.requestor, amount);

    address(params.requestor).functionCall(params.requestorCall);

    IERC20(asset).safeTransferFrom(params.requestor, address(this), amount + fee);
    // approve flashloan source address to spend to repay flashloan
    IERC20(asset).safeApprove(getFlashloanSourceAddr(params.asset), amount + fee);

    // re-init
    _entryPoint = "";
    return true;
  }

  /**
   */
  function _routerOperation(
    address asset,
    uint256 amount,
    uint256 fee,
    bytes memory data
  )
    internal
    returns (bool)
  {
    RouterParams memory params = abi.decode(data, (RouterParams));

    // approve Router to pull flashloaned amount
    IERC20(asset).safeApprove(params.router, amount);

    // decode args of the last acton
    if (params.actions[params.actions.length - 1] != IRouter.Action.Swap) {
      revert BaseFlasher__lastActionMustBeSwap();
    }

    (address assetIn, address assetOut, uint256 amountOut, address receiver, uint256 slippage) =
      abi.decode(params.args[params.args.length - 1], (address, address, uint256, address, uint256));

    // add up the fee to args of PaybackFlashloan action
    // which should be the last one
    params.args[params.args.length - 1] =
      abi.encode(assetIn, assetOut, amountOut + fee, receiver, slippage);

    // call back Router
    IRouter(params.router).xBundle(params.actions, params.args);
    // after this call Router should have transferred to Flasher
    // amount + fee

    // approve flashloan source address to spend to repay flashloan
    IERC20(asset).safeApprove(getFlashloanSourceAddr(params.asset), amount + fee);

    // re-init
    _entryPoint = "";
    return true;
  }
}
