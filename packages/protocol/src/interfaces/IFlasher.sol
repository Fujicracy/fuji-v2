// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title IFlasher
 * @author Fujidao Labs
 * @notice Defines the interface for all flashloan providers.
 */
import {IRouter} from "../interfaces/IRouter.sol";

interface IFlasher {
  /**
   * @dev Input types of flashloan.
   *
   * Defintions:
   *  - Normal:
   *     - flasher is called to initiate flashloan
   *     - funds are pushed to the caller contract
   *     - external contract is passed parameters to execute logic
   *     - flasher pull funds back + fee to payback flashloan
   *  - Router:
   *     - flasher is called to initiate flashloan along with parameters
   *     - flasher receives funds and executes logic
   *     - flasher paysback funds + fee
   */
  enum FlashloanType {
    Normal,
    Router
  }

  struct NormalParams {
    address asset;
    uint256 amount;
    address requestor;
    bytes requestorCall;
  }

  struct RouterParams {
    address asset;
    uint256 amount;
    address router;
    IRouter.Action[] actions;
    bytes[] args;
  }

  /**
   * @notice Initiates a flashloan a this provider.
   * @param flashloanType Refer to enum `FlashloanType.
   * @param params encoded data to be passed through flashloan call:
   * @dev For `params`:
   * - if call is `Normal` type, pass abi.encoded(FlashloanParams)
   * - else if `Router` type, pass abi.encoded(RouterParams)
   *
   * Requirements:
   * - MUST implement `_checkAndSetEntryPoint()`
   */
  function initiateFlashloan(FlashloanType flashloanType, bytes memory params) external;

  /**
   * @notice Returns the address from which flashloan for `asset` is sourced.
   * @param asset intended to be flashloaned.
   * @dev Override at flashloan provider implementation as required.
   * Some protocol implementations source flashloans from different contracts
   * depending on `asset`.
   */
  function getFlashloanSourceAddr(address asset) external view returns (address callAddr);

  /**
   * @notice Returns the expected flashloan fee for `amount`
   * of this flashloan provider.
   * @param asset to be flashloaned
   * @param amount of flashloan
   */
  function computeFlashloanFee(address asset, uint256 amount) external view returns (uint256 fee);
}
