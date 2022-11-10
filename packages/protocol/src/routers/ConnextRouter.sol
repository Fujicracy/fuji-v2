// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title ConnextRouter.
 * @author Fujidao Labs
 * @notice A Router implementing Connext specific bridging logic.
 */

import {IConnext, IXReceiver} from "../interfaces/connext/IConnext.sol";
import {BaseRouter} from "../abstracts/BaseRouter.sol";
import {IWETH9, ERC20} from "../helpers/PeripheryPayments.sol";
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
   * @param originSender - The router on originDomain.
   * @param originDomain - The origin domain identifier according Connext nomenclature.
   * @param asset - The asset being transferred.
   * @param amount - The amount of transferring asset the recipient address receives.
   * @param callData - The calldata that will get decoded and executed.
   */
  event XReceived(
    bytes32 indexed transferId,
    address indexed originSender,
    uint256 originDomain,
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

  function xReceive(
    bytes32 transferId,
    uint256 amount,
    address asset,
    address originSender,
    uint32 origin,
    bytes memory callData
  )
    external
    returns (bytes memory)
  {
    (Action[] memory actions, bytes[] memory args) = abi.decode(callData, (Action[], bytes[]));

    _bundleInternal(actions, args);

    emit XReceived(transferId, originSender, origin, asset, amount, callData);

    return "";
  }

  function _crossTransfer(bytes memory params) internal override {
    (uint256 destDomain, address asset, uint256 amount, address receiver) =
      abi.decode(params, (uint256, address, uint256, address));

    pullToken(ERC20(asset), amount, address(this));
    approve(ERC20(asset), address(connext), amount);

    bytes32 transferId = connext.xcall(
      // _destination: Domain ID of the destination chain
      uint32(destDomain),
      // _to: address of the target contract
      receiver,
      // _asset: address of the token contract
      asset,
      // _delegate: address that can revert or forceLocal on destination
      msg.sender,
      // _amount: amount of tokens to transfer
      amount,
      // _slippage: can be anything between 0-10000 becaus
      // the maximum amount of slippage the user will accept in BPS, in this case 0.3%
      30,
      // _callData: empty because we're only sending funds
      ""
    );
    emit XCalled(transferId, msg.sender, receiver, destDomain, asset, amount, "");
  }

  function _crossTransferWithCalldata(bytes memory params) internal override {
    (uint256 destDomain, address asset, uint256 amount, bytes memory callData) =
      abi.decode(params, (uint256, address, uint256, bytes));

    pullToken(ERC20(asset), amount, address(this));
    approve(ERC20(asset), address(connext), amount);

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
      // the maximum amount of slippage the user will accept in BPS, in this case 0.3%
      30,
      // _callData: the encoded calldata to send
      callData
    );

    emit XCalled(
      transferId, msg.sender, routerByDomain[destDomain], destDomain, asset, amount, callData
      );
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
