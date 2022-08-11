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
    returns (IRouter.Action[] memory actions, bytes[] memory args)
  {
    IRouter.Action[] memory bActions = new IRouter.Action[](2);
    bytes[] memory bArgs = new bytes[](2);

    bActions[0] = IRouter.Action.Deposit;
    bArgs[0] = abi.encode(amount, msg.sender);

    bActions[1] = IRouter.Action.Borrow;
    bArgs[1] = abi.encode(borrowAmount, msg.sender, msg.sender);

    bytes memory params = abi.encode(destVault, asset, amount, actions, args);

    bytes4 selector = bytes4(keccak256("inboundXCall(bytes)"));

    bytes memory callData = abi.encodeWithSelector(selector, params);

    actions[0] = IRouter.Action.XTransferWithCall;
    args[0] = abi.encode(destDomain, asset, amount, callData);
  }
}
