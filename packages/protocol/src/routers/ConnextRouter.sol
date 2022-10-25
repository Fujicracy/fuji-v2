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

contract ConnextRouter is BaseRouter, IXReceiver {
  // The connext contract on the origin domain.
  IConnext public immutable connext;

  // ref: https://docs.nomad.xyz/developers/environments/domain-chain-ids
  mapping(uint256 => address) public routerByDomain;

  // A modifier for permissioned function calls.
  // Note: This is an important security consideration. If your target
  //       contract function is meant to be permissioned, it must check
  //       that the originating call is from the correct domain and contract.
  //       Also, check that the msg.sender is the Connext address.
  modifier onlyConnext(address originSender, uint32 originDomain) {
    require(
      // TODO subject to change in the new version of amarok
      originSender == routerByDomain[originDomain] && msg.sender == address(connext),
      "Expected origin contract on origin domain called by Connext"
    );
    _;
  }

  constructor(IWETH9 weth, IConnext connext_) BaseRouter(weth) {
    connext = connext_;
  }

  // Connext specific functions

  function xReceive(
    bytes32, /* transferId */
    uint256, /* amount */
    address, /* asset */
    address originSender,
    uint32 origin,
    bytes memory params
  ) external onlyConnext(originSender, origin) returns (bytes memory) {
    (Action[] memory actions, bytes[] memory args) = abi.decode(params, (Action[], bytes[]));

    _bundleInternal(actions, args);
    return "";
  }

  function _crossTransfer(bytes memory params) internal override {
    (uint256 destDomain, address asset, uint256 amount, address receiver) =
      abi.decode(params, (uint256, address, uint256, address));

    pullToken(ERC20(asset), amount, address(this));
    approve(ERC20(asset), address(connext), amount);

    connext.xcall(
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
  }

  function _crossTransferWithCalldata(bytes memory params) internal override {
    (uint256 destDomain, address asset, uint256 amount, bytes memory callData) =
      abi.decode(params, (uint256, address, uint256, bytes));

    pullToken(ERC20(asset), amount, address(this));
    approve(ERC20(asset), address(connext), amount);

    connext.xcall(
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
  }

  ///////////////////////
  /// Admin functions ///
  ///////////////////////

  function setRouter(uint256 domain, address router) external {
    // TODO only owner
    // TODO verify params
    routerByDomain[domain] = router;
  }
}
