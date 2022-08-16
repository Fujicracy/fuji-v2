pragma solidity ^0.8.9;

/**
 * @title Helper library for bundling operations thru Connext.
 * @author Fujidao Labs
 * @notice Helper library to construct params to be passed to Connext Router
 * for the most common operations.
 */

import {IRouter} from "../interfaces/IRouter.sol";
import {IVault} from "../interfaces/IVault.sol";
import {IFlasher} from "../interfaces/IFlasher.sol";

library LibActionBundler {
  function depositAndBorrow(address vault, uint256 amount, uint256 borrowAmount)
    public
    view
    returns (IRouter.Action[] memory, bytes[] memory)
  {
    IRouter.Action[] memory actions = new IRouter.Action[](2);
    bytes[] memory args = new bytes[](2);

    actions[0] = IRouter.Action.Deposit;
    args[0] = abi.encode(vault, amount, msg.sender);

    actions[1] = IRouter.Action.Borrow;
    args[1] = abi.encode(vault, borrowAmount, msg.sender, msg.sender);

    return (actions, args);
  }

  function closeWithFlashloan(
    address router,
    address vault,
    uint256 withdrawAmount,
    uint256 flashAmount
  )
    public
    view
    returns (IRouter.Action[] memory, bytes[] memory)
  {
    IRouter.Action[] memory actions = new IRouter.Action[](2);
    bytes[] memory args = new bytes[](2);

    actions[0] = IRouter.Action.Flashloan;

    // construct inner actions
    IRouter.Action[] memory innerActions = new IRouter.Action[](2);
    bytes[] memory innerArgs = new bytes[](2);

    innerActions[0] = IRouter.Action.Payback;
    innerArgs[0] = abi.encode(vault, flashAmount, msg.sender);

    innerActions[1] = IRouter.Action.Withdraw;
    innerArgs[1] = abi.encode(vault, withdrawAmount, router, msg.sender);
    // ------------

    IFlasher.FlashloanParams memory params = IFlasher.FlashloanParams(
      IVault(vault).debtAsset(), flashAmount, router, innerActions, innerArgs
    );
    uint8 providerId = 0;
    args[0] = abi.encode(params, providerId);

    actions[1] = IRouter.Action.PaybackFlashloan;
    args[1] = abi.encode(IVault(vault).asset(), IVault(vault).debtAsset(), flashAmount, 0);

    return (actions, args);
  }
}
