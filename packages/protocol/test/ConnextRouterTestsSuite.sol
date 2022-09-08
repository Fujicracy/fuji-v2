// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console2.sol";
import {LibSigUtils} from "../src/libraries/LibSigUtils.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IExecutor} from "nxtp/core/connext/interfaces/IExecutor.sol";
import {Setup} from "./utils/Setup.sol";
import {IVault} from "../src/interfaces/IVault.sol";
import {IRouter} from "../src/interfaces/IRouter.sol";
import {IVaultPermissions} from "../src/interfaces/IVaultPermissions.sol";

contract ConnextRouterTestsSuite is Setup {
  event Dispatch(bytes32 leaf, uint256 index, bytes32 root, bytes message);

  // plusNonce is necessary for compound operations,
  // those that needs more than one signiture in the same tx
  function utils_getPermitBorrowArgs(
    address owner,
    address operator,
    uint256 borrowAmount,
    uint256 plusNonce,
    address vault_
  )
    internal
    returns (uint256 deadline, uint8 v, bytes32 r, bytes32 s)
  {
    deadline = block.timestamp + 1 days;
    LibSigUtils.Permit memory permit = LibSigUtils.Permit({
      owner: owner,
      spender: operator,
      amount: borrowAmount,
      nonce: IVaultPermissions(vault_).nonces(owner) + plusNonce,
      deadline: deadline
    });
    bytes32 structHash = LibSigUtils.getStructHashBorrow(permit);
    bytes32 digest = LibSigUtils.getHashTypedDataV4Digest(
      // This domain should be obtained from the chain on which state will change.
      IVaultPermissions(vault_).DOMAIN_SEPARATOR(),
      structHash
    );
    (v, r, s) = vm.sign(alicePkey, digest);
  }

  function test_bridgeOutbound() public {
    uint256 amount = 2 ether;
    deal(connextWETH, alice, amount);
    assertEq(IERC20(connextWETH).balanceOf(alice), amount);

    vm.startPrank(alice);

    SafeERC20.safeApprove(IERC20(connextWETH), address(connextRouter), type(uint256).max);

    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);

    actions[0] = IRouter.Action.XTransferWithCall;
    args[0] = abi.encode(destDomain, connextWETH, amount, "");

    vm.expectEmit(false, false, false, false);
    emit Dispatch("", 1, "", "");

    connextRouter.xBundle(actions, args);
  }

  event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares);

  event Borrow(address indexed caller, address indexed owner, uint256 debt, uint256 shares);

  function test_bridgeInbound() public {
    uint256 amount = 2 ether;
    uint256 borrowAmount = 1000e6;

    address executor = address(connextHandler.executor());

    IRouter.Action[] memory actions = new IRouter.Action[](3);
    actions[0] = IRouter.Action.Deposit;
    actions[1] = IRouter.Action.PermitBorrow;
    actions[2] = IRouter.Action.Borrow;

    bytes[] memory args = new bytes[](3);
    args[0] = abi.encode(address(vault), amount, alice, executor);
    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      utils_getPermitBorrowArgs(alice, address(connextRouter), borrowAmount, 0, address(vault));
    args[1] =
      abi.encode(address(vault), alice, address(connextRouter), borrowAmount, deadline, v, r, s);
    args[2] = abi.encode(address(vault), borrowAmount, alice, alice);

    bytes memory params = abi.encode(actions, args);
    bytes4 selector = bytes4(keccak256("inboundXCall(bytes)"));
    bytes memory callData = abi.encodeWithSelector(selector, params);

    vm.expectEmit(true, true, true, false);
    emit Deposit(address(connextRouter), alice, amount, amount);

    vm.expectEmit(true, true, true, false);
    emit Borrow(address(connextRouter), alice, borrowAmount, borrowAmount);

    IExecutor.ExecutorArgs memory execArgs = IExecutor.ExecutorArgs({
      assetId: collateralAsset,
      amount: amount,
      to: address(connextRouter),
      callData: callData,
      transferId: "",
      recovery: address(0),
      originSender: address(connextRouter),
      originDomain: originDomain
    });
    vm.expectCall(address(connextRouter), callData);

    // connext has to send to the executor "amount"
    // before calling it
    deal(collateralAsset, executor, amount);
    vm.startPrank(address(connextHandler));
    IExecutor(executor).execute(execArgs);

    assertEq(vault.balanceOf(alice), amount);
  }
}
