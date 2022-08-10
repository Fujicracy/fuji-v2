// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.9;

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
  modifier onlyConnextExecutor(uint256 originDomain) {
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

  // TODO
  // Connext specific functions

  function _bridgeTransfer(bytes memory args) internal pure override {
    args;
  }

  function _bridgeTransferWithCalldata(bytes memory args) internal pure override {
    args;
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
