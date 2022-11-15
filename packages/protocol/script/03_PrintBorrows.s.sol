// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/console.sol";
import {ScriptPlus} from "./ScriptPlus.sol";
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

  function setUp() public {
    vm.createSelectFork("goerli");
  }

  function run() public {
    address vaultGoerli = 0xfF4606Aa93e576E61b473f4B11D3e32BB9ec63BB;

    address connextRouter = 0x99A784d082476E551E5fc918ce3d849f2b8e89B6;
    address weth = 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6;
    address usdc = 0x5FfbaC75EFc9547FBc822166feD19B05Cd5890bb;

    uint256 optGoerliDomain = 1735356532;

    sameChain(vaultGoerli, connextRouter);
    xTransfer(optGoerliDomain, vaultGoerli, connextRouter, usdc);
    xTransferWithCall(optGoerliDomain, weth);
  }

  function sameChain(address vault, address router) public {
    (uint8 v, bytes32 r, bytes32 s) = signMsg(vault, router, owner);
    (IRouter.Action[] memory actions, bytes[] memory args) =
      depositAndBorrow(vault, owner, router, v, r, s);

    bytes memory callData = abi.encodeWithSelector(selector, actions, args);
    console.logBytes(callData);
  }

  function xTransfer(uint256 destDomain, address vault, address router, address debtAsset) public {
    IRouter.Action[] memory actions = new IRouter.Action[](4);
    bytes[] memory args = new bytes[](4);

    (uint8 v, bytes32 r, bytes32 s) = signMsg(vault, router, owner);

    actions[0] = IRouter.Action.Deposit;
    /*(IVault vault, uint256 amount, address receiver, address sender)*/
    args[0] = abi.encode(vault, amount, owner, owner);

    actions[1] = IRouter.Action.PermitBorrow;
    /*(IVaultPermissions vault, address owner, address spender, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s)*/
    args[1] = abi.encode(vault, owner, router, borrowAmount, deadline, v, r, s);

    actions[2] = IRouter.Action.Borrow;
    /*(IVault vault, uint256 amount, address receiver, address owner)*/
    args[2] = abi.encode(vault, borrowAmount, owner, owner);

    actions[3] = IRouter.Action.XTransfer;
    /*(uint256 destDomain, address asset, uint256 amount, address receiver)*/
    args[3] = abi.encode(destDomain, debtAsset, borrowAmount, owner);

    bytes memory callData = abi.encodeWithSelector(selector, actions, args);
    console.logBytes(callData);
  }

  function xTransferWithCall(uint256 destDomain, address asset) public {
    vm.createSelectFork("optimism_goerli");

    address vault = 0x62fd5C9A82991CDc522e4E748A9188E7B3DC7872;
    address router = 0xdA1a42056BcBDd35b8E1C4f55773f0f11c171634;

    (uint8 v, bytes32 r, bytes32 s) = signMsg(vault, router, owner);
    (IRouter.Action[] memory innerActions, bytes[] memory innerArgs) =
      depositAndBorrow(vault, router, router, v, r, s);

    bytes memory callData = abi.encode(innerActions, innerArgs);

    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);

    actions[0] = IRouter.Action.XTransferWithCall;
    args[0] = abi.encode(destDomain, asset, amount, callData);

    bytes memory callDataFinal = abi.encodeWithSelector(selector, actions, args);
    console.logBytes(callDataFinal);
  }

  function depositAndBorrow(
    address vault,
    address sender,
    address operator,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    public
    view
    returns (IRouter.Action[] memory, bytes[] memory)
  {
    IRouter.Action[] memory actions = new IRouter.Action[](3);
    bytes[] memory args = new bytes[](3);

    actions[0] = IRouter.Action.Deposit;
    /*(IVault vault, uint256 amount, address receiver, address sender)*/
    args[0] = abi.encode(vault, amount, owner, sender);

    actions[1] = IRouter.Action.PermitBorrow;
    /*(IVaultPermissions vault, address owner, address spender, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s)*/
    args[1] = abi.encode(vault, owner, operator, borrowAmount, deadline, v, r, s);

    actions[2] = IRouter.Action.Borrow;
    /*(IVault vault, uint256 amount, address receiver, address owner)*/
    args[2] = abi.encode(vault, borrowAmount, owner, owner);

    return (actions, args);
  }

  function signMsg(
    address vault,
    address operator,
    address receiver
  )
    public
    returns (uint8 v, bytes32 r, bytes32 s)
  {
    LibSigUtils.Permit memory permit = LibSigUtils.Permit({
      owner: owner,
      operator: operator,
      receiver: receiver,
      amount: borrowAmount,
      nonce: IVaultPermissions(vault).nonces(owner),
      deadline: deadline
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
