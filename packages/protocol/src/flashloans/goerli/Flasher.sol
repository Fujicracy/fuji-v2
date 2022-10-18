// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

import {IFlashLoanSimpleReceiver} from "../../interfaces/aaveV3/IFlashLoanSimpleReceiver.sol";
import {IV3Pool} from "../../interfaces/aaveV3/IV3Pool.sol";
import {IRouter} from "../../interfaces/IRouter.sol";
import {IFlasher} from "../../interfaces/IFlasher.sol";

/**
 * @title Flasher
 * @author Fujidao Labs
 * @notice Handles protocol flash loan execturion and the specific
 * logic for all active flash loan providers
 */

contract Flasher is IFlashLoanSimpleReceiver, IFlasher {
  using SafeERC20 for IERC20;

  error Flasher__invalidFlashloanProvider();
  error Flasher__invalidEntryPoint();
  error Flasher__notEmptyEntryPoint();
  error Flasher__notAuthorized();
  error Flasher__lastActionMustBeSwap();

  address public immutable aaveV3Pool = 0x368EedF3f56ad10b9bC57eed4Dac65B26Bb667f6;

  bytes32 private _entryPoint;

  constructor() {}

  /**
   * @dev Routing Function for Flashloan Provider
   * @param params: struct information for flashLoan
   * @param providerId: integer identifier of flashloan provider
   */
  function initiateFlashloan(FlashloanParams calldata params, uint8 providerId)
    external
    override /*isAuthorized*/
  {
    if (_entryPoint != "") {
      revert Flasher__notEmptyEntryPoint();
    }

    _entryPoint = keccak256(abi.encode(params));
    if (providerId == 0) {
      _initiateAaveV3FlashLoan(params);
    } else {
      revert Flasher__invalidFlashloanProvider();
    }
  }

  // ===================== AaveV3 Flashloan ===================================

  /**
   * @dev Initiates an AaveV3 flashloan.
   * @param params: data to be passed between functions executing flashloan logic
   */
  function _initiateAaveV3FlashLoan(FlashloanParams calldata params) internal {
    address receiverAddress = address(this);

    //AaveV3 Flashloan initiated.
    IV3Pool(aaveV3Pool).flashLoanSimple(
      receiverAddress, params.asset, params.amount, abi.encode(params), 0
    );
  }

  /**
   * @dev Executes AaveV3 Flashloan, this operation is required
   * and called by Aavev3flashloan when sending loaned amount
   */
  function executeOperation(
    address asset,
    uint256 amount,
    uint256 premium,
    address initiator,
    bytes calldata data
  )
    external
    override
    returns (bool)
  {
    if (msg.sender != aaveV3Pool || initiator != address(this)) {
      revert Flasher__notAuthorized();
    }

    FlashloanParams memory params = abi.decode(data, (FlashloanParams));

    if (_entryPoint == "" || _entryPoint != keccak256(abi.encode(data))) {
      revert Flasher__invalidEntryPoint();
    }

    // approve Router to pull flashloaned amount
    IERC20(asset).safeApprove(params.router, amount);

    // decode args of the last acton
    if (params.actions[params.actions.length - 1] != IRouter.Action.Swap) {
      revert Flasher__lastActionMustBeSwap();
    }

    (address assetIn, address assetOut, uint256 amountOut, address receiver, uint256 slippage) =
      abi.decode(params.args[params.args.length - 1], (address, address, uint256, address, uint256));

    // add up the premium to args of PaybackFlashloan action
    // which should be the last one
    params.args[params.args.length - 1] =
      abi.encode(assetIn, assetOut, amountOut + premium, receiver, slippage);

    // call back Router
    IRouter(params.router).xBundle(params.actions, params.args);
    // after this call Router should have transferred to Flasher
    // amount + fee

    // approve aaveV3 to spend to repay flashloan
    IERC20(asset).safeApprove(aaveV3Pool, amount + premium);

    // re-init
    _entryPoint = "";
    return true;
  }
}
