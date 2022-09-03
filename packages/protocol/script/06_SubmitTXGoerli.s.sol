// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/console.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {ScriptPlus} from "./ScriptPlus.sol";
import {LibConnextBundler} from "../src/libraries/LibConnextBundler.sol";
import {ConnextRouter} from "../src/routers/ConnextRouter.sol";
import {IVault} from "../src/interfaces/IVault.sol";
import {IRouter} from "../src/interfaces/IRouter.sol";

contract SubmitTXGoerli is ScriptPlus {
  address weth;

  uint256 destDomain = 1735356532;
  address destVault;
  address destRouter;
  address srcRouter;

  function setUp() public {
    chainName = "goerli";

    weth = 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6;
    destVault = getAddressAt("BorrowingVault", "optimism-goerli");
    destRouter = getAddressAt("ConnextRouter", "optimism-goerli");
    srcRouter = getAddress("ConnextRouter");
  }

  function run() public {
    uint256 amount = 2e16; // 0.02 ETH
    uint256 borrowAmount = 10e18; // 10 DAI

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) = getSigAt("Borrow", "optimism-goerli");

    console.log("Getting Signature (v, r, s):");
    console.log(v);
    console.logBytes32(r);
    console.logBytes32(s);

    vm.startBroadcast();
    // need to mint some WETH too
    SafeERC20.safeApprove(IERC20(weth), srcRouter, type(uint256).max);

    (IRouter.Action[] memory innerActions, bytes[] memory innerArgs) = LibConnextBundler
      .depositAndBorrow(destVault, destRouter, amount, borrowAmount, deadline, v, r, s);

    // testing: send a bit more weth to pay for fee
    (IRouter.Action[] memory actions, bytes[] memory args) =
      LibConnextBundler.bridgeWithCall(destDomain, weth, amount + 1e15, innerActions, innerArgs);

    ConnextRouter(payable(srcRouter)).xBundle(actions, args);
    vm.stopBroadcast();
  }
}
