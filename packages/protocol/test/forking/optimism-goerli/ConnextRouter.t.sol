// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../ForkingSetup.sol";
import {AaveV3Goerli} from "../../../src/providers/goerli/AaveV3Goerli.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {MockProviderV0} from "../../../src/mocks/MockProviderV0.sol";
import {IRouter} from "../../../src/interfaces/IRouter.sol";
import {IConnext} from "../../../src/interfaces/connext/IConnext.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";
import {
  ConnextRouter, ConnextHandler, ConnextReceiver
} from "../../../src/routers/ConnextRouter.sol";
import {IWETH9} from "../../../src/abstracts/WETH9.sol";
import {LibSigUtils} from "../../../src/libraries/LibSigUtils.sol";

contract ConnextRouterForkingTests is Routines, ForkingSetup {
  event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares);

  event Borrow(
    address indexed sender,
    address indexed receiver,
    address indexed owner,
    uint256 debt,
    uint256 shares
  );

  event Dispatch(bytes32 leaf, uint256 index, bytes32 root, bytes message);

  ConnextRouter public connextRouter;
  ConnextHandler public connextHandler;
  ConnextReceiver public connextReceiver;

  uint32 domain;

  function setUp() public {
    domain = OPTIMISM_GOERLI_DOMAIN;
    setUpFork(domain);

    // test with a mock provider because Connext's and Aave's WETH mismatch
    MockProviderV0 mockProvider = new MockProviderV0();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = mockProvider;

    deploy(providers);

    connextRouter = new ConnextRouter(
      IWETH9(collateralAsset),
      IConnext(registry[domain].connext),
      chief
    );

    connextHandler = connextRouter.handler();
    connextReceiver = ConnextReceiver(connextRouter.connextReceiver());

    // addresses are supposed to be the same across different chains
    /*connextRouter.setReceiver(GOERLI_DOMAIN, address(connextRouter));*/
    bytes memory callData = abi.encodeWithSelector(
      ConnextRouter.setReceiver.selector, GOERLI_DOMAIN, address(connextReceiver)
    );
    _callWithTimelock(address(connextRouter), callData);

    /*connextRouter.setReceiver(MUMBAI_DOMAIN, address(connextRouter));*/
    callData = abi.encodeWithSelector(
      ConnextRouter.setReceiver.selector, MUMBAI_DOMAIN, address(connextReceiver)
    );
    _callWithTimelock(address(connextRouter), callData);
    // _setVaultProviders(vault, providers);
    // vault.setActiveProvider(mockProvider);
  }

  function test_bridgeOutbound() public {
    uint256 amount = 2 ether;
    // Replacing collateralAsset with Connext TEST token
    // becasue Connext throwing an error "more than pool balance"
    // if using WETH
    collateralAsset = 0x68Db1c8d85C09d546097C65ec7DCBFF4D6497CbF;
    deal(collateralAsset, ALICE, amount);

    uint32 destDomain = GOERLI_DOMAIN;

    vm.startPrank(ALICE);

    SafeERC20.safeApprove(IERC20(collateralAsset), address(connextRouter), type(uint256).max);

    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);

    actions[0] = IRouter.Action.XTransferWithCall;

    IRouter.Action[] memory destActions = new IRouter.Action[](1);
    bytes[] memory destArgs = new bytes[](1);

    destActions[0] = IRouter.Action.Deposit;
    destArgs[0] = abi.encode(address(vault), amount, ALICE, address(connextRouter));

    bytes memory destCallData = abi.encode(destActions, destArgs);
    args[0] = abi.encode(destDomain, 30, collateralAsset, amount, ALICE, destCallData);

    vm.expectEmit(false, false, false, false);
    emit Dispatch("", 1, "", "");
    connextRouter.xBundle(actions, args);
  }

  function test_bridgeInbound() public {
    uint256 amount = 0.2 ether;
    uint256 borrowAmount = 100e6;

    bytes memory callData = _getDepositAndBorrowCallData(
      ALICE, ALICE_PK, amount, borrowAmount, address(connextRouter), address(vault)
    );

    vm.expectEmit(true, true, true, false);
    emit Deposit(address(connextRouter), ALICE, amount, amount);

    vm.expectEmit(true, true, true, false);
    emit Borrow(address(connextRouter), ALICE, ALICE, borrowAmount, borrowAmount);

    // send directly the bridged funds to our router
    // thus mocking Connext behavior
    deal(collateralAsset, address(connextReceiver), amount);

    vm.startPrank(registry[domain].connext);
    // call from GOERLI where 'originSender' is router that's supposed to have
    // the same address as the one on GOERLI
    connextReceiver.xReceive(
      "", amount, vault.asset(), address(connextRouter), GOERLI_DOMAIN, callData
    );
    vm.stopPrank();

    assertEq(vault.balanceOf(ALICE), amount);
    assertEq(IERC20(collateralAsset).balanceOf(address(connextRouter)), 0);
  }

  function test_attackXReceive() public {
    uint256 amount = 2 ether;
    uint256 borrowAmount = 1000e6;

    // This calldata has to fail and funds stay at the router.
    bytes memory failingCallData = _getDepositAndBorrowCallData(
      ALICE, ALICE_PK, amount, borrowAmount, address(0), address(vault)
    );

    // Send directly the bridged funds to our router thus mocking Connext behavior
    deal(collateralAsset, address(connextReceiver), amount);

    vm.startPrank(registry[domain].connext);
    // call attack faked as from GOERLI where 'originSender' is router that's supposed to have
    // the same address as the one on GOERLI
    connextReceiver.xReceive(
      "", amount, vault.asset(), address(connextRouter), GOERLI_DOMAIN, failingCallData
    );
    vm.stopPrank();

    // Assert that funds are kept at the ConnextHandler
    assertEq(IERC20(collateralAsset).balanceOf(address(connextHandler)), amount);

    // Attacker attemps to take funds, BOB
    address attacker = BOB;
    bytes memory attackCallData = _getDepositAndBorrowCallData(
      attacker, BOB_PK, amount, borrowAmount, address(connextRouter), address(vault)
    );

    vm.startPrank(attacker);
    // call attack faked as from GOERLI where 'originSender' is router that's supposed to have
    // the same address as the one on GOERLI
    try connextReceiver.xReceive(
      "", 1 wei, vault.asset(), address(connextRouter), GOERLI_DOMAIN, attackCallData
    ) {
      console.log("attack succeeded");
    } catch {
      console.log("attack repelled");
    }
    vm.stopPrank();

    // Assert attacker has no funds deposited in the vault
    assertEq(vault.balanceOf(BOB), 0);
    // Assert attacker was not able to borrow from the vault
    assertEq(IERC20(debtAsset).balanceOf(BOB), 0);
  }

  function test_failsbridgeInboundXBundle() public {
    uint256 amount = 2 ether;
    uint256 borrowAmount = 1000e6;

    // make the callData to fail
    bytes memory callData = _getDepositAndBorrowCallData(
      ALICE, ALICE_PK, amount, borrowAmount, address(0), address(vault)
    );

    // send directly the bridged funds to our router
    // thus mocking Connext behavior
    deal(collateralAsset, address(connextReceiver), amount);

    vm.startPrank(registry[domain].connext);
    // call from GOERLI where 'originSender' is router that's supposed to have
    // the same address as the one on GOERLI
    connextReceiver.xReceive(
      "", amount, vault.asset(), address(connextRouter), GOERLI_DOMAIN, callData
    );
    vm.stopPrank();

    assertEq(vault.balanceOf(ALICE), 0);
    // funds are kept at the ConnextHandler contract
    assertEq(IERC20(collateralAsset).balanceOf(address(connextHandler)), amount);
  }

  function test_depositAndBorrowaAndTransfer() public {
    uint256 amount = 2 ether;
    uint256 borrowAmount = 1000e6;

    IRouter.Action[] memory actions = new IRouter.Action[](4);
    actions[0] = IRouter.Action.Deposit;
    actions[1] = IRouter.Action.PermitBorrow;
    actions[2] = IRouter.Action.Borrow;
    actions[3] = IRouter.Action.XTransfer;

    bytes[] memory args = new bytes[](4);
    args[0] = abi.encode(address(vault), amount, ALICE, ALICE);
    args[1] = LibSigUtils.getZeroPermitEncodedArgs(
      address(vault), ALICE, address(connextRouter), borrowAmount
    );
    args[2] = abi.encode(address(vault), borrowAmount, address(connextRouter), ALICE);
    args[3] = abi.encode(MUMBAI_DOMAIN, 30, debtAsset, borrowAmount, ALICE, address(connextRouter));

    bytes32 actionArgsHash = LibSigUtils.getActionArgsHash(actions, args);

    LibSigUtils.Permit memory permit = LibSigUtils.buildPermitStruct(
      ALICE,
      address(connextRouter),
      address(connextRouter),
      borrowAmount,
      0,
      address(vault),
      actionArgsHash
    );

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitBorrowArgs(permit, ALICE_PK, address(vault));

    // Replace permit action arguments, now with the signature values.
    args[1] =
      abi.encode(address(vault), ALICE, address(connextRouter), borrowAmount, deadline, v, r, s);

    /*MockERC20(collateralAsset).mint(ALICE, amount);*/
    deal(collateralAsset, ALICE, amount);

    // mock Connext because it doesn't allow bridging of assets other than TEST token
    vm.mockCall(
      registry[OPTIMISM_GOERLI_DOMAIN].connext,
      abi.encodeWithSelector(IConnext.xcall.selector),
      abi.encode(1)
    );

    // mock balanceOf to avoid BaseRouter__bundleInternal_noRemnantBalance error
    vm.mockCall(
      debtAsset,
      abi.encodeWithSelector(IERC20.balanceOf.selector, address(connextRouter)),
      abi.encode(0)
    );

    vm.startPrank(ALICE);
    SafeERC20.safeApprove(IERC20(collateralAsset), address(connextRouter), amount);

    vm.expectEmit(true, true, true, true);
    emit Deposit(address(connextRouter), ALICE, amount, amount);
    vm.expectEmit(true, true, true, true);
    emit Borrow(address(connextRouter), address(connextRouter), ALICE, borrowAmount, borrowAmount);

    connextRouter.xBundle(actions, args);
    vm.stopPrank();

    assertEq(vault.balanceOf(ALICE), amount);
    assertEq(vault.balanceOfDebt(ALICE), borrowAmount);
  }
}
