// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {ScriptPlus} from "./ScriptPlus.s.sol";
import {LibSigUtils} from "../src/libraries/LibSigUtils.sol";
import {IVaultPermissions} from "../src/interfaces/IVaultPermissions.sol";
import {IRouter} from "../src/interfaces/IRouter.sol";

contract PrintGoerliBorrows is ScriptPlus {
  uint256 junkPrivateKey = 0x911ced1110f043fdfa439651a2e782ac13e188556d5b8658fd121adce4afff98;
  address owner = vm.addr(junkPrivateKey);

  uint256 amount = 1e18;
  uint256 borrowAmount = 1e18;

  bytes4 selector = bytes4(keccak256("xBundle(uint8[],bytes[])"));
  uint256 deadline = 123456789;
  uint256 slippage = 30;

  function setUp() public {
    chainName = "goerli";
    vm.createSelectFork("goerli");
  }

  function run() public {
    address weth = getAddress("WETH");
    /*address dai = getAddress("MockDAI");*/
    /*address vault = getAddress("BorrowingVault-TESTDAI");*/

    /*address connextRouter = getAddress("ConnextRouter");*/

    uint256 optGoerliDomain = 1735356532;

    /*sameChain(vault, connextRouter);*/
    /*xTransfer(optGoerliDomain, vault, connextRouter, dai);*/
    xTransferWithCall(optGoerliDomain, weth);
  }

  function sameChain(address vault, address router) public {
    (IRouter.Action[] memory actions, bytes[] memory args) =
      depositAndBorrow(vault, router, owner, owner);

    bytes memory callData = abi.encodeWithSelector(selector, actions, args);
    console.logBytes(callData);
  }

  function xTransfer(uint256 destDomain, address vault, address router, address debtAsset) public {
    IRouter.Action[] memory actions = new IRouter.Action[](4);
    bytes[] memory args = new bytes[](4);

    actions[0] = IRouter.Action.Deposit;
    /*(IVault vault, uint256 amount, address receiver, address sender)*/
    args[0] = abi.encode(vault, amount, owner, owner);

    actions[1] = IRouter.Action.PermitBorrow;
    /*(IVaultPermissions vault, address owner, address spender, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s)*/
    args[1] = LibSigUtils.getZeroPermitEncodedArgs(vault, owner, owner, borrowAmount);

    actions[2] = IRouter.Action.Borrow;
    /*(IVault vault, uint256 amount, address receiver, address owner)*/
    args[2] = abi.encode(vault, borrowAmount, owner, owner);

    actions[3] = IRouter.Action.XTransfer;
    /*(uint256 destDomain, address asset, uint256 amount, address receiver)*/
    args[3] = abi.encode(destDomain, slippage, debtAsset, borrowAmount, owner);

    bytes32 actionArgsHash = LibSigUtils.getActionArgsHash(actions, args);

    (uint8 v, bytes32 r, bytes32 s) = signMsg(vault, router, owner, actionArgsHash);

    // Replace permit action arguments, now with the signature values.
    args[1] = abi.encode(vault, owner, owner, borrowAmount, deadline, v, r, s);

    bytes memory callData = abi.encodeWithSelector(selector, actions, args);
    console.logBytes(callData);
  }

  function xTransferWithCall(uint256 destDomain, address asset) public {
    chainName = "optimism-goerli";
    vm.createSelectFork("optimism_goerli");

    address vault = getAddress("BorrowingVault-TESTDAI");
    address router = getAddress("ConnextRouter");

    (IRouter.Action[] memory innerActions, bytes[] memory innerArgs) =
      depositAndBorrow(vault, router, owner, owner);

    bytes memory callData = abi.encode(innerActions, innerArgs);

    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);

    actions[0] = IRouter.Action.XTransferWithCall;
    args[0] = abi.encode(destDomain, slippage, asset, amount, callData);

    bytes memory callDataFinal = abi.encodeWithSelector(selector, actions, args);
    console.logBytes(callDataFinal);
  }

  function depositAndBorrow(
    address vault,
    address operator,
    address receiver,
    address sender
  )
    public
    returns (IRouter.Action[] memory, bytes[] memory)
  {
    IRouter.Action[] memory actions = new IRouter.Action[](3);
    bytes[] memory args = new bytes[](3);

    actions[0] = IRouter.Action.Deposit;
    /*(IVault vault, uint256 amount, address receiver, address sender)*/
    args[0] = abi.encode(vault, amount, receiver, sender);

    actions[1] = IRouter.Action.PermitBorrow;
    /*(IVaultPermissions vault, address owner, address spender, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s)*/
    args[1] = LibSigUtils.getZeroPermitEncodedArgs(vault, sender, receiver, borrowAmount);

    actions[2] = IRouter.Action.Borrow;
    /*(IVault vault, uint256 amount, address receiver, address owner)*/
    args[2] = abi.encode(vault, borrowAmount, sender, sender);

    bytes32 actionArgsHash = LibSigUtils.getActionArgsHash(actions, args);

    (uint8 v, bytes32 r, bytes32 s) = signMsg(vault, operator, receiver, actionArgsHash);

    // Replace permit action arguments, now with the signature values.
    args[1] = abi.encode(vault, sender, receiver, borrowAmount, deadline, v, r, s);

    return (actions, args);
  }

  function signMsg(
    address vault,
    address operator,
    address receiver,
    bytes32 actionArgsHash_
  )
    public
    returns (uint8 v, bytes32 r, bytes32 s)
  {
    LibSigUtils.Permit memory permit = LibSigUtils.Permit({
      chainid: block.chainid,
      owner: owner,
      operator: operator,
      receiver: receiver,
      amount: borrowAmount,
      nonce: IVaultPermissions(vault).nonces(owner),
      deadline: deadline,
      actionArgsHash: actionArgsHash_
    });

    bytes32 digest = LibSigUtils.getHashTypedDataV4Digest(
      IVaultPermissions(vault).DOMAIN_SEPARATOR(), LibSigUtils.getStructHashBorrow(permit)
    );

    (v, r, s) = vm.sign(junkPrivateKey, digest);

    console.log("Signature (v, r, s):");
    console.log(v);
    console.logBytes32(r);
    console.logBytes32(s);
  }
}
