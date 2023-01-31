// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title LibConnextBundler
 *
 * @author Fujidao Labs
 *
 * @notice Helper library for bundling operations thru Connext.
 * It helps construct params to be passed to Connext Router
 * for the most common operations.
 */

import {IRouter} from "../interfaces/IRouter.sol";

library LibConnextBundler {
  function bridgeWithCall(
    uint256 destDomain,
    address asset,
    uint256 amount,
    IRouter.Action[] calldata innerActions,
    bytes[] calldata innerArgs
  )
    public
    pure
    returns (IRouter.Action[] memory, bytes[] memory)
  {
    bytes memory params = abi.encode(innerActions, innerArgs);
    bytes4 selector = bytes4(keccak256("inboundXCall(bytes)"));
    bytes memory callData = abi.encodeWithSelector(selector, params);

    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);

    actions[0] = IRouter.Action.XTransferWithCall;
    args[0] = abi.encode(destDomain, asset, amount, callData);

    return (actions, args);
  }

  function depositAndBorrow(
    address vault,
    address router,
    uint256 amount,
    uint256 borrowAmount,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    public
    view
    returns (IRouter.Action[] memory, bytes[] memory)
  {
    IRouter.Action[] memory actions = new IRouter.Action[](3);
    bytes[] memory args = new bytes[](3);

    actions[0] = IRouter.Action.Deposit;
    args[0] = abi.encode(vault, amount, msg.sender, msg.sender);

    actions[1] = IRouter.Action.PermitBorrow;
    args[1] = abi.encode(vault, msg.sender, router, borrowAmount, deadline, v, r, s);

    actions[2] = IRouter.Action.Borrow;
    args[2] = abi.encode(vault, borrowAmount, msg.sender, msg.sender);

    return (actions, args);
  }
}
