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

  error ConnextRouter__setRouter_invalidInput();

  // The connext contract on the origin domain.
  IConnext public immutable connext;

  // ref: https://docs.nomad.xyz/developers/environments/domain-chain-ids
  mapping(uint256 => address) public routerByDomain;

  constructor(IWETH9 weth, IConnext connext_, IChief chief) BaseRouter(weth, chief) {
    connext = connext_;
  }

  // Connext specific functions

  /**
   * @notice Called by Connext on the destination chain. It doesn't perform an authentification
   * by doing a check on `originSender`. As a result of that, all txns go through the fast path.
   * If `xBundle` fails on our side, this contract will keep the custody of the sent funds.
   *
   * @param transferId - The unique identifier of the crosschain transfer.
   * @param amount - The amount of transferring asset the recipient address receives.
   * @param asset - The asset being transferred.
   * @param originDomain - The origin domain identifier according Connext nomenclature.
   * @param callData - The calldata that will get decoded and executed.
   */
  function xReceive(
    bytes32 transferId,
    uint256 amount,
    address asset,
    address, /* originSender */
    uint32 originDomain,
    bytes memory callData
  )
    external
    returns (bytes memory)
  {
    (Action[] memory actions, bytes[] memory args) = abi.decode(callData, (Action[], bytes[]));

    try this.xBundle(actions, args) {
      emit XReceived(transferId, originDomain, true, asset, amount, callData);
    } catch {
      // else keep funds in router and let them be handled by admin
      emit XReceived(transferId, originDomain, false, asset, amount, callData);
    }

    return "";
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
