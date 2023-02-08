// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title ConnextHelperReceiver
 *
 * @author Fujidao Labs
 *
 * @notice Handles failed transfers from Connext and keeps custody of
 * the transferred funds.
 */

import {IRouter} from "../interfaces/IRouter.sol";

contract ConnextHelperReceiver {
  /**
   * @dev Contains an address of an ERC-20 and the balance the router holds
   * at a given moment of the transaction (ref. `_tokensToCheck`).
   */
  struct Snapshot {
    address token;
    uint256 balance;
  }

  /// @dev Custom errors
  error ConnextHelperReceiver__constructor_zeroAddress();
  error ConnextHelperReceiver__callerNotConnextRouter();

  IRouter public immutable connextRouter;

  /// @dev Maps a failed transferId -> abi.encoded(IRouter.Action[], bytes[])
  mapping(bytes32 => bytes) public failedTransferIds;

  /// @dev Maps a failed transferId -> calldata
  mapping(bytes32 => Snapshot) public transferIdBalance;

  modifier onlyConnextRouter() {
    if (msg.sender != address(connextRouter)) {
      revert ConnextHelperReceiver__callerNotConnextRouter();
    }
    _;
  }

  constructor(IRouter connextRouter_) {
    if (address(connextRouter_) == address(0)) {
      revert ConnextHelperReceiver__constructor_zeroAddress();
    }
    connextRouter = connextRouter_;
  }

  /**
   * @notice Records a failed {ConnextRouter-xReceive} call.
   */
  function recordFailed(
    bytes32 transferId,
    uint256 amount,
    address asset,
    address originSender,
    uint32 originDomain,
    IRouter.Action[] memory actions,
    bytes[] memory args
  )
    external
    onlyConnextRouter
  {}
}
