// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title ConnextRouter.
 * @author Fujidao Labs
 * @notice A Router implementing Connext specific bridging logic.
 */

import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IConnext, IXReceiver} from "../interfaces/connext/IConnext.sol";
import {BaseRouter} from "../abstracts/BaseRouter.sol";
import {IWETH9} from "../abstracts/WETH9.sol";
import {IVault} from "../interfaces/IVault.sol";
import {IChief} from "../interfaces/IChief.sol";
import {ISwapper} from "../interfaces/ISwapper.sol";

contract ConnextRouter is BaseRouter, IXReceiver {
  /**
   * @notice Emitted when a new destination router gets added.
   * @param router - The router on another chain.
   * @param domain - The destination domain identifier according Connext nomenclature.
   */
  event NewRouterAdded(address indexed router, uint256 indexed domain);

  /**
   * @notice Emitted when Connext `xCall` is invoked.
   * @param transferId - The unique identifier of the crosschain transfer.
   * @param caller - The account that called the function.
   * @param receiver - The router on destDomain.
   * @param destDomain - The destination domain identifier according Connext nomenclature.
   * @param asset - The asset being transferred.
   * @param amount - The amount of transferring asset the recipient address receives.
   * @param callData - The calldata sent to destination router that will get decoded and executed.
   */
  event XCalled(
    bytes32 indexed transferId,
    address indexed caller,
    address indexed receiver,
    uint256 destDomain,
    address asset,
    uint256 amount,
    bytes callData
  );

  /**
   * @notice Emitted when the router receives a cross-chain call.
   * @param transferId - The unique identifier of the crosschain transfer.
   * @param originDomain - The origin domain identifier according Connext nomenclature.
   * @param success - Whether or not the xBundle call succeeds.
   * @param asset - The asset being transferred.
   * @param amount - The amount of transferring asset the recipient address receives.
   * @param callData - The calldata that will get decoded and executed.
   */
  event XReceived(
    bytes32 indexed transferId,
    uint256 indexed originDomain,
    bool success,
    address asset,
    uint256 amount,
    bytes callData
  );

  /// @dev Custom Errors
  error ConnextRouter__setRouter_invalidInput();
  error ConnextRouter__xReceive_notReceivedAssetBalance();
  error ConnextRouter__xReceive_notAllowedCaller();
  error ConnnextRouter__checkSlippage_outOfBounds();

  // The connext contract on the origin domain.
  IConnext public immutable connext;

  // ref: https://docs.connext.network/resources/deployments
  mapping(uint256 => address) public routerByDomain;

  constructor(IWETH9 weth, IConnext connext_, IChief chief) BaseRouter(weth, chief) {
    connext = connext_;
    _allowCaller(address(connext_), true);
  }

  // Connext specific functions

  /**
   * @notice Called by Connext on the destination chain. It does perform an authentification.
   * As a result of that, all txns go through Connext's slow path.
   * If `xBundle` fails on our side, this contract will keep the custody of the sent funds.
   *
   * @param transferId - The unique identifier of the crosschain transfer.
   * @param amount - The amount of transferring asset, after slippage, the recipient address receives.
   * @param asset - The asset being transferred.
   * @param originSender - The address of the contract or EOA that called xcall on the origin chain.
   * @param originDomain - The origin domain identifier according Connext nomenclature.
   * @param callData - The calldata that will get decoded and executed.
   */
  function xReceive(
    bytes32 transferId,
    uint256 amount,
    address asset,
    address originSender,
    uint32 originDomain,
    bytes memory callData
  )
    external
    returns (bytes memory)
  {
    (Action[] memory actions, bytes[] memory args, uint256 slippageThreshold) =
      abi.decode(callData, (Action[], bytes[], uint256));

    // Block callers except allowed cross callers.
    if (
      !_isAllowedCaller[msg.sender] || routerByDomain[originDomain] != originSender
        || originSender == address(0)
    ) {
      revert ConnextRouter__xReceive_notAllowedCaller();
    }

    // Ensure that at this entry point expected `asset` `amount` is received.
    uint256 balance = IERC20(asset).balanceOf(address(this));
    if (balance < amount) {
      revert ConnextRouter__xReceive_notReceivedAssetBalance();
    } else {
      _tokensToCheck.push(Snapshot(asset, balance - amount));
    }

    // Due to the AMM nature of Connext, there could be some slippage
    // incurred on the amount that this contract receives after bridging.
    // The slippage can't be calculated upfront so that's why we need to
    // replace `amount` in the encoded args for the first action if
    // the action is Deposit, Payback or Swap.
    if (amount > 0) {
      args[0] = _accountForSlippage(amount, actions[0], args[0], slippageThreshold);
    }

    // Connext will keep the custody of the bridged amount if the call
    // to `xReceive` fails. That's why we need to ensure the funds are not stuck at Connext.
    // That's why we try/catch instead of directly calling _bundleInternal(actions, args).
    try this.xBundle(actions, args) {
      emit XReceived(transferId, originDomain, true, asset, amount, callData);
    } catch {
      // ensure clear storage for token balance checks
      delete _tokensToCheck;
      // keep funds in router and let them be handled by admin
      emit XReceived(transferId, originDomain, false, asset, amount, callData);
    }

    return "";
  }

  /**
   * @dev Decode and replace "amount" argument in args with `receivedAmount`
   * in Deposit, Payback or Swap action.
   *
   * Refer to:
   * https://github.com/Fujicracy/fuji-v2/issues/253#issuecomment-1385995095
   */
  function _accountForSlippage(
    uint256 receivedAmount,
    Action action,
    bytes memory args,
    uint256 slippageThreshold
  )
    internal
    pure
    returns (bytes memory newArgs)
  {
    newArgs = args;

    // Check first action type and replace with slippage-amount
    if (action == Action.Deposit || action == Action.Payback) {
      // DEPOSIT OR PAYBACK
      (IVault vault, uint256 amount, address receiver, address sender) =
        abi.decode(args, (IVault, uint256, address, address));

      if (amount != receivedAmount) {
        newArgs = abi.encode(vault, receivedAmount, receiver, sender);
        _checkSlippage(amount, receivedAmount, slippageThreshold);
      }
    } else if (action == Action.Swap) {
      // SWAP
      (
        ISwapper swapper,
        address assetIn,
        address assetOut,
        uint256 amountIn,
        uint256 amountOut,
        address receiver,
        address sweeper,
        uint256 minSweepOut
      ) =
        abi.decode(args, (ISwapper, address, address, uint256, uint256, address, address, uint256));

      if (amountIn != receivedAmount) {
        newArgs = abi.encode(
          swapper, assetIn, assetOut, receivedAmount, amountOut, receiver, sweeper, minSweepOut
        );
        _checkSlippage(amountIn, receivedAmount, slippageThreshold);
      }
    }
  }

  function _checkSlippage(uint256 original, uint256 slippage, uint256 threshold) internal pure {
    uint256 upperBound = original * (10000 + threshold) / 10000;
    uint256 lowerBound = original * 10000 / (10000 + threshold);
    if (slippage > upperBound || slippage < lowerBound) {
      revert ConnnextRouter__checkSlippage_outOfBounds();
    }
  }

  function _crossTransfer(bytes memory params) internal override {
    (
      uint256 destDomain,
      uint256 slippage,
      address asset,
      uint256 amount,
      address receiver,
      address sender
    ) = abi.decode(params, (uint256, uint256, address, uint256, address, address));

    _checkBeneficiary(receiver);

    _safePullTokenFrom(asset, sender, receiver, amount);
    _safeApprove(asset, address(connext), amount);

    bytes32 transferId = connext.xcall(
      // _destination: Domain ID of the destination chain
      uint32(destDomain),
      // _to: address of the target contract
      receiver,
      // _asset: address of the token contract
      asset,
      // _delegate: address that has rights to update the original slippage tolerance
      // by calling Connext's forceUpdateSlippage function
      msg.sender,
      // _amount: amount of tokens to transfer
      amount,
      // _slippage: can be anything between 0-10000 becaus
      // the maximum amount of slippage the user will accept in BPS, 30 == 0.3%
      slippage,
      // _callData: empty because we're only sending funds
      ""
    );
    emit XCalled(transferId, msg.sender, receiver, destDomain, asset, amount, "");
  }

  function _crossTransferWithCalldata(bytes memory params) internal override {
    /// TODO this action requires beneficiary check, though implementation from BaseRouter
    /// is not feasible.
    (uint256 destDomain, uint256 slippage, address asset, uint256 amount, bytes memory callData) =
      abi.decode(params, (uint256, uint256, address, uint256, bytes));

    _safePullTokenFrom(asset, msg.sender, msg.sender, amount);
    _safeApprove(asset, address(connext), amount);

    bytes32 transferId = connext.xcall(
      // _destination: Domain ID of the destination chain
      uint32(destDomain),
      // _to: address of the target contract
      routerByDomain[destDomain],
      // _asset: address of the token contract
      asset,
      // _delegate: address that can revert or forceLocal on destination
      msg.sender,
      // _amount: amount of tokens to transfer
      amount,
      // _slippage: can be anything between 0-10000 becaus
      // the maximum amount of slippage the user will accept in BPS, 30 == 0.3%
      slippage,
      // _callData: the encoded calldata to send
      callData
    );

    emit XCalled(
      transferId, msg.sender, routerByDomain[destDomain], destDomain, asset, amount, callData
      );
  }

  /**
   * @notice Anyone can call this function on the origin domain to increase the relayer fee for a transfer.
   * @param transferId - The unique identifier of the crosschain transaction
   */
  function bumpTransfer(bytes32 transferId) external payable {
    connext.bumpTransfer{value: msg.value}(transferId);
  }

  ///////////////////////
  /// Admin functions ///
  ///////////////////////

  function setRouter(uint256 domain, address router) external onlyTimelock {
    if (router == address(0)) {
      revert ConnextRouter__setRouter_invalidInput();
    }
    routerByDomain[domain] = router;

    emit NewRouterAdded(router, domain);
  }
}
