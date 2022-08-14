// SPDX-License-Identifier: GPL-2.0-or-later

pragma solidity ^0.8.9;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";

import {IFlashLoanSimpleReceiver} from "../../interfaces/aaveV3/IFlashLoanSimpleReceiver.sol";
import {IPool} from "../../interfaces/aaveV3/IPool.sol";
import {IRouter} from "../../interfaces/IRouter.sol";
import {IFlasher} from "../../interfaces/IFlasher.sol";

/**
 * @dev Contract that handles Fuji protocol flash loan logic and
 * the specific logic of all active flash loan providers used by Fuji protocol.
 */

contract Flasher is IFlashLoanSimpleReceiver, IFlasher {
  using SafeERC20 for IERC20;

  error Flasher__invalidFlashloanProvider();
  error Flasher__invalidEntryPoint();
  error Flasher__notEmptyEntryPoint();
  error Flasher__notAuthorized();

  address public immutable NATIVE = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
  address public immutable aaveV3Pool = 0xE039BdF1d874d27338e09B55CB09879Dedca52D8;

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
    if (_entryPoint != "") revert Flasher__notEmptyEntryPoint();

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
    IPool(aaveV3Pool).flashLoanSimple(
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
    if (msg.sender != aaveV3Pool || initiator != address(this)) revert Flasher__notAuthorized();

    FlashloanParams memory params = abi.decode(data, (FlashloanParams));

    if (_entryPoint == "" || _entryPoint != keccak256(abi.encode(data))) revert
      Flasher__invalidEntryPoint();

    // Transfer to Router the flashloan Amount
    // Router will pull tokens
    /*IERC20(asset).safeTransfer(router, amount);*/

    // call back Router
    IRouter(params.router).xBundle(params.actions, params.args);

    //Approve aavev3LP to spend to repay flashloan
    IERC20(asset).safeApprove(aaveV3Pool, amount + premium);

    _entryPoint = "";
    return true;
  }
}
