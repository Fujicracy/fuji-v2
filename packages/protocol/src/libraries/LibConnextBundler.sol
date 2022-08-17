// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.9;

/**
 * @title Helper library for bundling operations thru Connext.
 * @author Fujidao Labs
 * @notice Helper library to construct params to be passed to Connext Router
 * for the most common operations.
 */

import {IRouter} from "../interfaces/IRouter.sol";

library LibConnextBundler {
  function bridgeDepositAndBorrow(
    uint256 destDomain,
    address destVault,
    address asset,
    uint256 amount,
    uint256 borrowAmount
  )
    public
    view
    returns (IRouter.Action[] memory, bytes[] memory)
  {
    IRouter.Action[] memory bActions = new IRouter.Action[](2);
    bytes[] memory bArgs = new bytes[](2);

    bActions[0] = IRouter.Action.Deposit;
    bArgs[0] = abi.encode(destVault, amount, msg.sender, msg.sender);

    bActions[1] = IRouter.Action.Borrow;
    bArgs[1] = abi.encode(destVault, borrowAmount, msg.sender, msg.sender);

    bytes memory params = abi.encode(bActions, bArgs);

    bytes4 selector = bytes4(keccak256("inboundXCall(bytes)"));

    bytes memory callData = abi.encodeWithSelector(selector, params);

    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);

    actions[0] = IRouter.Action.XTransferWithCall;
    args[0] = abi.encode(destDomain, asset, amount, callData);

    return (actions, args);
  }
}
