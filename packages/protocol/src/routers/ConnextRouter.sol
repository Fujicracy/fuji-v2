// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.9;

/**
 * @title ConnextRouter.
 * @author Fujidao Labs
 * @notice A Router implementing Connext specific bridging logic.
 */

import {CallParams, XCallArgs} from "nxtp/core/connext/libraries/LibConnextStorage.sol";
import {IConnextHandler} from "nxtp/core/connext/interfaces/IConnextHandler.sol";
import {IExecutor} from "nxtp/core/connext/interfaces/IExecutor.sol";
import {BaseRouter} from "../abstracts/BaseRouter.sol";
import {IWETH9, ERC20} from "../helpers/PeripheryPayments.sol";
import {IVault} from "../interfaces/IVault.sol";

contract ConnextRouter is BaseRouter {
  IConnextHandler public connext;
  IExecutor public executor;

  // ref: https://docs.nomad.xyz/developers/environments/domain-chain-ids
  mapping(uint256 => address) public routerByDomain;

  // A modifier for permissioned function calls.
  // Note: This is an important security consideration. If your target
  //       contract function is meant to be permissioned, it must check
  //       that the originating call is from the correct domain and contract.
  //       Also, check that the msg.sender is the Connext Executor address.
  modifier onlyConnextExecutor() {
    require(
      // TODO subject to change in the new version of amarok
      /*IExecutor(msg.sender).originSender() == routerByDomain[originDomain] &&*/
      /*IExecutor(msg.sender).origin() == uint32(originDomain) &&*/
      msg.sender == address(executor),
      "Expected origin contract on origin domain called by Executor"
    );
    _;
  }

  constructor(IWETH9 weth, IConnextHandler connext_) BaseRouter(weth) {
    connext = connext_;
    executor = connext.executor();
  }

  // Connext specific functions

  function onXCall(bytes memory params) external onlyConnextExecutor {
    (Action[] memory actions, bytes[] memory args) = abi.decode(params, (Action[], bytes[]));

    _bundleInternal(actions, args);
  }

  function _crossTransfer(bytes memory params) internal override {
    (uint256 destDomain, address asset, uint256 amount, address receiver) =
      abi.decode(params, (uint256, address, uint256, address));

    // need approval for connext to spend `amount`
    // assuming it's an asset/debtAsset of a vault
    // that's already registered with "registerVault(vault)"
    pullToken(ERC20(asset), amount, address(this));

    CallParams memory callParams = CallParams({
      to: receiver,
      // empty here because we're only sending funds
      callData: "",
      originDomain: uint32(connext.domain()),
      destinationDomain: uint32(destDomain),
      // address allowed to transaction on destination side in addition to relayers
      agent: msg.sender,
      // fallback address to send funds to if execution fails on destination side
      recovery: msg.sender,
      // option to force Nomad slow path (~30 mins) instead of paying 0.05% fee
      forceSlow: false,
      // option to receive the local Nomad-flavored asset instead of the adopted asset
      receiveLocal: false,
      // zero address because we don't expect a callback
      callback: address(0),
      // fee paid to relayers; relayers don't take any fees on testnet
      callbackFee: 0,
      // fee paid to relayers; relayers don't take any fees on testnet
      relayerFee: 0,
      slippageTol: 9995
    });

    XCallArgs memory xcallArgs =
      XCallArgs({params: callParams, transactingAssetId: asset, amount: amount});

    connext.xcall(xcallArgs);
  }

  function _crossTransferWithCalldata(bytes memory params) internal override {
    (uint256 destDomain, address asset, uint256 amount, bytes memory callData) =
      abi.decode(params, (uint256, address, uint256, bytes));

    // need approval for connext to spend `amount`
    // assuming it's an asset/debtAsset of a vault
    // that's already registered with "registerVault(vault)"
    pullToken(ERC20(asset), amount, address(this));

    CallParams memory callParams = CallParams({
      to: routerByDomain[destDomain],
      callData: callData,
      originDomain: uint32(connext.domain()),
      destinationDomain: uint32(destDomain),
      // address allowed to transaction on destination side in addition to relayers
      agent: msg.sender,
      // fallback address to send funds to if execution fails on destination side
      recovery: msg.sender,
      // option to force Nomad slow path (~30 mins) instead of paying 0.05% fee
      forceSlow: true,
      // option to receive the local Nomad-flavored asset instead of the adopted asset
      receiveLocal: false,
      // zero address because we don't expect a callback
      callback: address(0),
      // fee paid to relayers; relayers don't take any fees on testnet
      callbackFee: 0,
      // fee paid to relayers; relayers don't take any fees on testnet
      relayerFee: 0,
      slippageTol: 9995
    });

    XCallArgs memory xcallArgs =
      XCallArgs({params: callParams, transactingAssetId: asset, amount: amount});

    connext.xcall(xcallArgs);
  }

  ///////////////////////
  /// Admin functions ///
  ///////////////////////

  function setRouter(uint256 domain, address router) external {
    // TODO only owner
    // TODO verify params
    routerByDomain[domain] = router;
  }

  function registerVault(IVault vault) external {
    // TODO onlyOwner
    address asset = vault.asset();
    approve(ERC20(asset), address(vault), type(uint256).max);
    approve(ERC20(asset), address(connext), type(uint256).max);

    address debtAsset = vault.debtAsset();
    approve(ERC20(debtAsset), address(vault), type(uint256).max);
    approve(ERC20(debtAsset), address(connext), type(uint256).max);
  }
}
