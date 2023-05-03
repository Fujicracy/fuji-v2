// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../ForkingSetup.sol";
import {AaveV3Goerli} from "../../../src/providers/goerli/AaveV3Goerli.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {IVaultPermissions} from "../../../src/interfaces/IVaultPermissions.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
import {IConnext} from "../../../src/interfaces/connext/IConnext.sol";
import {MockProviderV0} from "../../../src/mocks/MockProviderV0.sol";
import {MockERC20} from "../../../src/mocks/MockERC20.sol";
import {IRouter} from "../../../src/interfaces/IRouter.sol";
import {IConnext, TransferInfo, ExecuteArgs} from "../../../src/interfaces/connext/IConnext.sol";
import {BorrowingVault} from "../../../src/vaults/borrowing/BorrowingVault.sol";
import {ConnextRouter} from "../../../src/routers/ConnextRouter.sol";
import {BaseRouter} from "../../../src/abstracts/BaseRouter.sol";
import {ConnextHandler} from "../../../src/routers/ConnextHandler.sol";
import {IWETH9} from "../../../src/abstracts/WETH9.sol";
import {LibSigUtils} from "../../../src/libraries/LibSigUtils.sol";
import {FlasherAaveV3} from "../../../src/flashloans/FlasherAaveV3.sol";
import {IFlasher} from "../../../src/interfaces/IFlasher.sol";
import {MockFlasher} from "../../../src/mocks/MockFlasher.sol";
import {Address} from "openzeppelin-contracts/contracts/utils/Address.sol";
import {TransferInfo} from "../../../src/interfaces/connext/IConnext.sol";

contract MockTestFlasher is Routines, IFlasher {
  using SafeERC20 for IERC20;
  using Address for address;

  bool public flashloanCalled = false;

  function initiateFlashloan(
    address asset,
    uint256 amount,
    address requestor,
    bytes memory requestorCalldata
  )
    external
  {
    deal(asset, address(this), amount);
    flashloanCalled = true;
    SafeERC20.safeApprove(IERC20(asset), requestor, amount);
    requestor.functionCall(requestorCalldata);
  }

  /// @inheritdoc IFlasher
  function getFlashloanSourceAddr(address) external view override returns (address) {
    return address(this);
  }

  /// @inheritdoc IFlasher
  function computeFlashloanFee(address, uint256) external pure override returns (uint256 fee) {
    fee = 0;
  }
}

contract ConnextRouterForkingTest is Routines, ForkingSetup {
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
  uint32 domain;
  IConnext public connext = IConnext(registry[GOERLI_DOMAIN].connext);

  function setUp() public {
    domain = GOERLI_DOMAIN;
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

    // addresses are supposed to be the same across different chains
    /*connextRouter.setRouter(OPTIMISM_GOERLI_DOMAIN, address(connextRouter));*/
    bytes memory callData = abi.encodeWithSelector(
      ConnextRouter.setRouter.selector, OPTIMISM_GOERLI_DOMAIN, address(connextRouter)
    );
    _callWithTimelock(address(connextRouter), callData);

    /*connextRouter.setRouter(MUMBAI_DOMAIN, address(connextRouter));*/
    callData = abi.encodeWithSelector(
      ConnextRouter.setRouter.selector, MUMBAI_DOMAIN, address(connextRouter)
    );
    _callWithTimelock(address(connextRouter), callData);
  }

  function test_bridgeOutbound() public {
    uint256 amount = 2 ether;
    deal(collateralAsset, ALICE, amount);

    // The maximum slippage acceptable, in BPS, due to the Connext bridging mechanics
    // Eg. 0.05% slippage threshold will be 5.
    uint256 slippageThreshold = 0;

    uint32 destDomain = OPTIMISM_GOERLI_DOMAIN;

    vm.startPrank(ALICE);

    SafeERC20.safeApprove(IERC20(collateralAsset), address(connextRouter), type(uint256).max);

    IRouter.Action[] memory actions = new IRouter.Action[](1);
    bytes[] memory args = new bytes[](1);

    actions[0] = IRouter.Action.XTransferWithCall;

    IRouter.Action[] memory destActions = new IRouter.Action[](1);
    bytes[] memory destArgs = new bytes[](1);

    destActions[0] = IRouter.Action.Deposit;
    destArgs[0] = abi.encode(address(vault), amount, ALICE, address(connextRouter));

    bytes memory destCallData = abi.encode(destActions, destArgs, slippageThreshold);
    args[0] = abi.encode(destDomain, 30, collateralAsset, amount, destCallData);

    vm.expectEmit(false, false, false, false);
    emit Dispatch("", 1, "", "");

    connextRouter.xBundle(actions, args);
  }

  function test_bridgeInbound() public {
    uint256 amount = 2 ether;
    uint256 borrowAmount = 1000e6;

    // The maximum slippage acceptable, in BPS, due to the Connext bridging mechanics
    // Eg. 0.05% slippage threshold will be 5.
    uint256 slippageThreshold = 0;

    bytes memory callData = _getDepositAndBorrowCallData(
      ALICE,
      ALICE_PK,
      amount,
      borrowAmount,
      address(connextRouter),
      address(vault),
      slippageThreshold
    );

    vm.expectEmit(true, true, true, false);
    emit Deposit(address(connextRouter), ALICE, amount, amount);

    vm.expectEmit(true, true, true, false);
    emit Borrow(address(connextRouter), ALICE, ALICE, borrowAmount, borrowAmount);

    // send directly the bridged funds to our router
    // thus mocking Connext behavior
    deal(collateralAsset, address(connextRouter), amount);

    vm.startPrank(registry[domain].connext);
    // call from OPTIMISM_GOERLI where 'originSender' is router that's supposed to have
    // the same address as the one on GOERLI
    connextRouter.xReceive(
      "", amount, vault.asset(), address(connextRouter), OPTIMISM_GOERLI_DOMAIN, callData
    );
    vm.stopPrank();

    // Assert ALICE has received shares
    assertGt(vault.balanceOf(ALICE), 0);
    // Assert ALICE received borrowAmount
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);
    // Assert router or ConnextHandler does not have collateral.
    assertEq(IERC20(collateralAsset).balanceOf(address(connextRouter)), 0);
    assertEq(IERC20(collateralAsset).balanceOf(address(connextHandler)), 0);
  }

  function test_bridgeSlippageInbound() public {
    uint256 amount = 2 ether;
    uint256 borrowAmount = 1000e6;

    // The maximum slippage acceptable, in BPS, due to the Connext bridging mechanics
    // Eg. 0.05% slippage threshold will be 5.
    uint256 slippageThreshold = 5;

    bytes memory callData = _getDepositAndBorrowCallData(
      ALICE,
      ALICE_PK,
      amount,
      borrowAmount,
      address(connextRouter),
      address(vault),
      slippageThreshold
    );

    vm.expectEmit(true, true, true, false);
    emit Deposit(address(connextRouter), ALICE, amount, amount);

    vm.expectEmit(true, true, true, false);
    emit Borrow(address(connextRouter), ALICE, ALICE, borrowAmount, borrowAmount);

    // send directly the bridged funds to our router
    // thus mocking Connext behavior
    // including a 0.03% slippage (3 BPS)
    uint256 slippageAmount = ((amount * 10000) / 10003);
    deal(collateralAsset, address(connextRouter), slippageAmount);

    vm.startPrank(registry[domain].connext);
    // call from OPTIMISM_GOERLI where 'originSender' is router that's supposed to have
    // the same address as the one on GOERLI
    connextRouter.xReceive(
      "", slippageAmount, vault.asset(), address(connextRouter), OPTIMISM_GOERLI_DOMAIN, callData
    );
    vm.stopPrank();

    // Assert ALICE has received shares
    assertGt(vault.balanceOf(ALICE), 0);
    // Since ALICE is first depositor, assert ALICE shares are equal `slippageAmount`.
    assertEq(vault.balanceOf(ALICE), slippageAmount);
    // Assert ALICE received borrowAmount
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);
    // Assert router or ConnextHandler does not have collateral.
    assertEq(IERC20(collateralAsset).balanceOf(address(connextRouter)), 0);
    assertEq(IERC20(collateralAsset).balanceOf(address(connextHandler)), 0);
  }

  function test_attackXReceive() public {
    uint256 amount = 2 ether;
    uint256 borrowAmount = 1000e6;

    // The maximum slippage acceptable, in BPS, due to the Connext bridging mechanics
    // Eg. 0.05% slippage threshold will be 5.
    uint256 slippageThreshold = 5;

    // This calldata has to fail and funds handled accordingly by the router.
    bytes memory failingCallData = _getDepositAndBorrowCallData(
      ALICE, ALICE_PK, amount, borrowAmount, address(0), address(vault), slippageThreshold
    );

    // Send directly the bridged funds to our router thus mocking Connext behavior
    deal(collateralAsset, address(connextRouter), amount);

    vm.startPrank(registry[domain].connext);
    // call attack faked as from OPTIMISM_GOERLI where 'originSender' is router that's supposed to have
    // the same address as the one on GOERLI
    connextRouter.xReceive(
      "", amount, vault.asset(), address(connextRouter), OPTIMISM_GOERLI_DOMAIN, failingCallData
    );
    vm.stopPrank();

    // Assert that funds are kept at the ConnextHandler
    assertEq(IERC20(collateralAsset).balanceOf(address(connextHandler)), amount);

    // Attacker makes first attempt to take funds using xReceive, BOB
    address attacker = BOB;
    bytes memory attackCallData = _getDepositAndBorrowCallData(
      attacker,
      BOB_PK,
      amount,
      borrowAmount,
      address(connextRouter),
      address(vault),
      slippageThreshold
    );

    // call attack faked as from OPTIMISM_GOERLI where 'originSender' is router that's supposed to have
    // the same address as the one on GOERLI
    vm.startPrank(attacker);
    try connextRouter.xReceive(
      "", 1 wei, vault.asset(), address(connextRouter), OPTIMISM_GOERLI_DOMAIN, attackCallData
    ) {
      console.log("xReceive-attack succeeded");
    } catch {
      console.log("xReceive-attack repelled");
    }
    vm.stopPrank();

    // Assert attacker has no funds deposited in the vault
    assertEq(vault.balanceOf(BOB), 0);
    // Assert attacker was not able to borrow from the vault
    assertEq(IERC20(debtAsset).balanceOf(BOB), 0);

    // Attacker makes second attempt to take funds using xBundle, BOB
    (IRouter.Action[] memory attackActions, bytes[] memory attackArgs) = _getDepositAndBorrow(
      attacker, BOB_PK, 1 ether, borrowAmount, address(connextRouter), address(vault)
    );

    vm.startPrank(attacker);
    try connextRouter.xBundle(attackActions, attackArgs) {
      console.log("xBundle-attack succeeded");
    } catch {
      console.log("xBundle-attack repelled");
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

    // The maximum slippage acceptable, in BPS, due to the Connext bridging mechanics
    // Eg. 0.05% slippage threshold will be 5.
    uint256 slippageThreshold = 5;

    // make the callData to fail
    bytes memory callData = _getDepositAndBorrowCallData(
      ALICE, ALICE_PK, amount, borrowAmount, address(0), address(vault), slippageThreshold
    );

    // send directly the bridged funds to our router
    // thus mocking Connext behavior
    deal(collateralAsset, address(connextRouter), amount);

    vm.startPrank(registry[domain].connext);
    // call from OPTIMISM_GOERLI where 'originSender' is router that's supposed to have
    // the same address as the one on GOERLI
    connextRouter.xReceive(
      "", amount, vault.asset(), address(connextRouter), OPTIMISM_GOERLI_DOMAIN, callData
    );
    vm.stopPrank();

    assertEq(vault.balanceOf(ALICE), 0);
    // funds are kept at the ConnextHandler contract
    assertEq(IERC20(collateralAsset).balanceOf(address(connextHandler)), amount);
  }

  function test_retryFailedInboundXReceive() public {
    uint256 amount = 2 ether;
    uint256 borrowAmount = 1000e6;

    // The maximum slippage acceptable, in BPS, due to the Connext bridging mechanics
    // Eg. 0.05% slippage threshold will be 5.
    uint256 slippageThreshold = 5;

    // make the callData to fail
    bytes memory badCallData = _getDepositAndBorrowCallData(
      ALICE, ALICE_PK, amount, borrowAmount, address(0), address(vault), slippageThreshold
    );

    // send directly the bridged funds to our router
    // thus mocking Connext behavior
    deal(collateralAsset, address(connextRouter), amount);

    vm.startPrank(registry[domain].connext);
    // call from OPTIMISM_GOERLI where 'originSender' is router that's supposed to have
    // the same address as the one on GOERLI
    bytes32 transferId = 0x0000000000000000000000000000000000000000000000000000000000000001;
    connextRouter.xReceive(
      transferId, amount, vault.asset(), address(connextRouter), OPTIMISM_GOERLI_DOMAIN, badCallData
    );
    vm.stopPrank();

    assertEq(vault.balanceOf(ALICE), 0);
    // funds are kept at the ConnextHandler contract
    assertEq(IERC20(collateralAsset).balanceOf(address(connextHandler)), amount);

    // Ensure calldata is fixed
    // In this case the badCalldata previously had sender as address(0).
    // The ConnextHhander replaces `sender` with its address when recording the failed transfer.
    ConnextHandler.FailedTxn memory transfer = connextHandler.getFailedTransaction(transferId);

    // Fix the args that failed.
    transfer.args[0] = abi.encode(address(vault), amount, ALICE, address(connextHandler));
    transfer.args[1] = _buildPermitAsBytes(
      ALICE, ALICE_PK, address(connextRouter), ALICE, borrowAmount, 0, address(vault)
    );
    transfer.args[2] = abi.encode(address(vault), borrowAmount, ALICE, ALICE);

    connextHandler.executeFailedWithUpdatedArgs(transferId, transfer.actions, transfer.args);
    // Assert Alice has funds deposited in the vault
    assertGt(vault.balanceOf(ALICE), 0);
    // Assert Alice was able to borrow from the vault
    assertEq(IERC20(debtAsset).balanceOf(ALICE), borrowAmount);
  }

  function test_depositAndBorrowaAndTransfer() public {
    uint256 amount = 2 ether;
    uint256 borrowAmount = 1000e6;

    LibSigUtils.Permit memory permit = LibSigUtils.buildPermitStruct(
      ALICE, address(connextRouter), address(connextRouter), borrowAmount, 0, address(vault)
    );

    (uint256 deadline, uint8 v, bytes32 r, bytes32 s) =
      _getPermitBorrowArgs(permit, ALICE_PK, address(vault));

    IRouter.Action[] memory actions = new IRouter.Action[](4);
    actions[0] = IRouter.Action.Deposit;
    actions[1] = IRouter.Action.PermitBorrow;
    actions[2] = IRouter.Action.Borrow;
    actions[3] = IRouter.Action.XTransfer;

    bytes[] memory args = new bytes[](4);
    args[0] = abi.encode(address(vault), amount, ALICE, ALICE);
    args[1] =
      abi.encode(address(vault), ALICE, address(connextRouter), borrowAmount, deadline, v, r, s);
    args[2] = abi.encode(address(vault), borrowAmount, address(connextRouter), ALICE);
    args[3] =
      abi.encode(MUMBAI_DOMAIN, 30, debtAsset, borrowAmount, ALICE, address(connextRouter), ALICE);

    vm.expectEmit(true, true, true, true);
    emit Deposit(address(connextRouter), ALICE, amount, amount);

    vm.expectEmit(true, true, true, true);
    emit Borrow(address(connextRouter), address(connextRouter), ALICE, borrowAmount, borrowAmount);

    /*MockERC20(collateralAsset).mint(ALICE, amount);*/
    deal(collateralAsset, ALICE, amount);

    // mock Connext because it doesn't allow bridging of assets other than TEST token
    vm.mockCall(
      registry[GOERLI_DOMAIN].connext,
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

    connextRouter.xBundle(actions, args);
    vm.stopPrank();

    assertEq(vault.balanceOf(ALICE), amount);
    assertEq(vault.balanceOfDebt(ALICE), borrowAmount);
  }

  function test_overridingFailedTransferInHandler() public {
    bytes32 transferId_ = 0x000000000000000000000000000000000000000000000000000000000000000a;
    uint256 amount = 2 ether;
    uint256 borrowAmount = 1000e6;

    // The maximum slippage acceptable, in BPS, due to the Connext bridging mechanics
    // Eg. 0.05% slippage threshold will be 5.
    uint256 slippageThreshold = 0;

    // This calldata has to fail and funds handled accordingly by the router.
    bytes memory failingCallData = _getDepositAndBorrowCallData(
      ALICE, ALICE_PK, amount, borrowAmount, address(0), address(vault), slippageThreshold
    );

    // send directly the bridged funds to our router
    // thus mocking Connext behavior
    deal(collateralAsset, address(connextRouter), amount);

    vm.startPrank(registry[domain].connext);
    // call from OPTIMISM_GOERLI where 'originSender' is router that's supposed to have
    // the same address as the one on GOERLI
    connextRouter.xReceive(
      transferId_,
      amount,
      vault.asset(),
      address(connextRouter),
      OPTIMISM_GOERLI_DOMAIN,
      failingCallData
    );
    vm.stopPrank();

    // Assert handler has recorded failed transfer
    ConnextHandler.FailedTxn memory ftxn = connextHandler.getFailedTransaction(transferId_);
    assertEq(ftxn.transferId, transferId_);
    assertEq(ftxn.asset, collateralAsset);
    assertEq(ftxn.amount, amount);

    // Create different calldata
    uint256 newAmount = 1.5 ether;
    bytes memory newfailingCallData = _getDepositAndBorrowCallData(
      ALICE, ALICE_PK, newAmount, borrowAmount, address(0), address(vault), slippageThreshold
    );

    // send directly the bridged funds to our router
    // thus mocking Connext behavior
    deal(collateralAsset, address(connextRouter), newAmount);

    vm.startPrank(registry[domain].connext);
    // call from OPTIMISM_GOERLI where 'originSender' is router that's supposed to have
    // the same address as the one on GOERLI
    connextRouter.xReceive(
      transferId_,
      newAmount,
      vault.asset(),
      address(connextRouter),
      OPTIMISM_GOERLI_DOMAIN,
      newfailingCallData
    );
    vm.stopPrank();

    // Assert handler has not modified the recorded failed transfer
    ConnextHandler.FailedTxn memory newftxn = connextHandler.getFailedTransaction(transferId_);
    assertEq(newftxn.transferId, transferId_);
    assertEq(newftxn.asset, collateralAsset);
    assertEq(newftxn.amount, amount);
  }

  function test_simpleFlashloan() public {
    uint256 amount = 2 ether;
    MockTestFlasher flasher = new MockTestFlasher();
    deal(collateralAsset, ALICE, amount);

    // The maximum slippage acceptable, in BPS, due to the Connext bridging mechanics
    // Eg. 0.05% slippage threshold will be 5.
    uint256 slippageThreshold = 0;

    uint32 destDomain = OPTIMISM_GOERLI_DOMAIN;

    IRouter.Action[] memory actions1 = new IRouter.Action[](1);
    actions1[0] = IRouter.Action.Flashloan;

    IRouter.Action[] memory actions = new IRouter.Action[](1);
    actions[0] = IRouter.Action.XTransferWithCall;

    bytes[] memory args = new bytes[](1);

    IRouter.Action[] memory destActions = new IRouter.Action[](1);
    bytes[] memory destArgs = new bytes[](1);

    destActions[0] = IRouter.Action.Deposit;
    destArgs[0] = abi.encode(address(vault), amount, ALICE, address(connextRouter));

    bytes memory destCallData = abi.encode(destActions, destArgs, slippageThreshold);
    args[0] = abi.encode(destDomain, 30, collateralAsset, amount, destCallData);

    bytes memory requestorCall = abi.encodeWithSelector(IRouter.xBundle.selector, actions, args);

    bytes[] memory args1 = new bytes[](1);
    args1[0] =
      abi.encode(address(flasher), collateralAsset, amount, address(connextRouter), requestorCall);

    vm.startPrank(ALICE);
    SafeERC20.safeApprove(IERC20(collateralAsset), address(connextRouter), type(uint256).max);

    vm.expectEmit(false, false, false, false);
    emit Dispatch("", 1, "", "");

    connextRouter.xBundle(actions1, args1);
    assertEq(flasher.flashloanCalled(), true);
  }

  function test_flashloanWithIncorrectActionAfter() public {
    uint256 amount = 2 ether;
    MockTestFlasher flasher = new MockTestFlasher();
    deal(collateralAsset, ALICE, amount);

    IRouter.Action[] memory actions1 = new IRouter.Action[](1);
    actions1[0] = IRouter.Action.Flashloan;

    IRouter.Action[] memory actions = new IRouter.Action[](1);
    actions[0] = IRouter.Action.Swap;

    bytes[] memory args = new bytes[](1);

    bytes memory requestorCall = abi.encodeWithSelector(IRouter.xBundle.selector, actions, args);

    bytes[] memory args1 = new bytes[](1);
    args1[0] =
      abi.encode(address(flasher), collateralAsset, amount, address(connextRouter), requestorCall);

    vm.startPrank(ALICE);
    SafeERC20.safeApprove(IERC20(collateralAsset), address(connextRouter), type(uint256).max);

    vm.expectRevert(BaseRouter.BaseRouter__bundleInternal_swapNotFirstAction.selector);
    connextRouter.xBundle(actions1, args1);
  }

  /*
   * @notice Tests that a flashloan can be used to perform a flashclose
   * @dev:
   * - make a transfer with call to destChain - XTransferWithCall
   * - call on destination chain is deposit and borrow, opening a simple position
   * - use a flashloan to perform a flashclose in destChain 
   */
  function test_depositAndBorrowFlashClose() public {
    // stack too deep to have these variables
    // uint256 amount = 2 ether;
    // uint256 borrowAmount = 100e8;
    // uint256 slippageThreshold = 0;
    uint32 destDomain = OPTIMISM_GOERLI_DOMAIN;
    MockTestFlasher flasher = new MockTestFlasher();

    deal(collateralAsset, ALICE, 2 ether);
    vm.startPrank(ALICE);
    SafeERC20.safeApprove(IERC20(collateralAsset), address(connextRouter), type(uint256).max);

    assertEq(IERC20(collateralAsset).balanceOf(ALICE), 2 ether);

    //deposit and borrow in destination chain
    IRouter.Action[] memory originActions1 = new IRouter.Action[](1);
    bytes[] memory originArgs1 = new bytes[](1);
    originActions1[0] = IRouter.Action.XTransferWithCall;

    //deposit and borrow
    IRouter.Action[] memory destChainDepositAndBorrowActions = new IRouter.Action[](2);
    bytes[] memory destChainDepositAndBorrowArgs = new bytes[](2);

    //deposit
    destChainDepositAndBorrowActions[0] = IRouter.Action.Deposit;
    destChainDepositAndBorrowArgs[0] =
      abi.encode(address(vault), 1 ether, ALICE, address(connextRouter));

    //borrow
    destChainDepositAndBorrowActions[1] = IRouter.Action.Borrow;
    destChainDepositAndBorrowArgs[1] =
      abi.encode(address(vault), 100e6, ALICE, address(connextRouter));

    bytes memory destChainDepositAndBorrowCallData =
      abi.encode(destChainDepositAndBorrowActions, destChainDepositAndBorrowArgs, 0);

    originArgs1[0] =
      abi.encode(destDomain, 30, collateralAsset, 1 ether, destChainDepositAndBorrowCallData);

    //assert dispatch
    vm.expectEmit(false, false, false, false);
    emit Dispatch("", 1, "", "");
    connextRouter.xBundle(originActions1, originArgs1);

    assertEq(IERC20(collateralAsset).balanceOf(ALICE), 1 ether);

    //XTransferWithCall from origin chain
    IRouter.Action[] memory originActions2 = new IRouter.Action[](1);
    bytes[] memory originArgs2 = new bytes[](1);
    originActions2[0] = IRouter.Action.XTransferWithCall;

    //flashloan in optimism
    IRouter.Action[] memory destActions = new IRouter.Action[](1);
    bytes[] memory destArgs = new bytes[](1);
    destActions[0] = IRouter.Action.Flashloan;

    // Perform a flashclose
    IRouter.Action[] memory destInnerActions = new IRouter.Action[](4);
    bytes[] memory destInnerArgs = new bytes[](4);
    destInnerActions[0] = IRouter.Action.Payback;
    destInnerActions[1] = IRouter.Action.PermitWithdraw;
    destInnerActions[2] = IRouter.Action.Withdraw;
    destInnerActions[3] = IRouter.Action.XTransfer;
    destInnerArgs[0] = abi.encode(address(vault), 100e6, ALICE, address(connextRouter));
    destInnerArgs[2] = abi.encode(address(vault), 1 ether, ALICE, address(connextRouter));
    destInnerArgs[3] = abi.encode(GOERLI_DOMAIN, 0, collateralAsset, 1 ether, ALICE, ALICE, ALICE);

    //flashloan parameters
    bytes memory requestorCalldata =
      abi.encodeWithSelector(IRouter.xBundle.selector, destInnerActions, destInnerArgs);
    //optimism args for flashloan
    destArgs[0] =
      abi.encode(address(flasher), debtAsset, 100e6, address(connextRouter), requestorCalldata);
    bytes memory destCallData = abi.encode(destActions, destArgs, 0);
    originArgs2[0] = abi.encode(destDomain, 0, collateralAsset, 0, destCallData);

    //assert dispatch
    vm.expectEmit(false, false, false, false);
    emit Dispatch("", 1, "", "");
    connextRouter.xBundle(originActions2, originArgs2);
  }

  function test_flashCloseXTransferAttack() public {
    uint32 destDomain = OPTIMISM_GOERLI_DOMAIN;

    // Setup test such that the router has withdrawAllowance for some reason.
    deal(collateralAsset, ALICE, 2 ether);
    vm.startPrank(ALICE);
    SafeERC20.safeApprove(IERC20(collateralAsset), address(vault), 2 ether);
    vault.deposit(2 ether, ALICE);
    IVaultPermissions(address(vault)).increaseWithdrawAllowance(
      address(connextRouter), address(connextRouter), 2 ether
    );
    vm.stopPrank();

    // attacker
    address attacker = BOB;

    //XTransferWithCall from origin chain
    IRouter.Action[] memory originActions = new IRouter.Action[](2);
    originActions[0] = IRouter.Action.Withdraw;
    originActions[1] = IRouter.Action.XTransferWithCall;

    bytes[] memory originArgs = new bytes[](2);
    originArgs[0] = abi.encode(address(vault), 1 ether, address(connextRouter), ALICE);

    // flashloan in optimism
    IRouter.Action[] memory destActions = new IRouter.Action[](1);
    destActions[0] = IRouter.Action.Flashloan;

    bytes[] memory destArgs = new bytes[](1);

    // Perform a flashclose
    IRouter.Action[] memory destInnerActions = new IRouter.Action[](1);
    bytes[] memory destInnerArgs = new bytes[](1);
    destInnerActions[0] = IRouter.Action.Deposit;
    destInnerArgs[0] = abi.encode(address(vault), 1 ether, attacker, address(connextRouter));

    // Attacker creates dumb flashloan action at destination to attempt bypass checks
    bytes memory attackCalldata =
      abi.encodeWithSelector(IRouter.xBundle.selector, destInnerActions, destInnerArgs);
    // Args for flashloan
    address supposedDestinationFlasher = 0x000000000000000000000000000000000000001a;
    destArgs[0] = abi.encode(
      supposedDestinationFlasher, debtAsset, 1 wei, address(connextRouter), attackCalldata
    );

    bytes memory destCallData = abi.encode(destActions, destArgs, 0);

    originArgs[1] = abi.encode(destDomain, 0, collateralAsset, 0, destCallData);

    // Expect revert due to wrong beneficiary in cross transaction
    vm.expectRevert(BaseRouter.BaseRouter__bundleInternal_notBeneficiary.selector);
    connextRouter.xBundle(originActions, originArgs);
  }

  function test_tryChangeXTransferSlippageWithoutPermission() public {
    uint256 amount = 1 ether;
    uint256 borrowAmount = 100e6;
    uint256 slippage = 0;
    uint256 newSlippage = 3;
    uint256 slippageThreshold = 5;

    bytes memory callData = _getDepositAndBorrowCallData(
      ALICE,
      ALICE_PK,
      amount,
      borrowAmount,
      address(connextRouter),
      address(vault),
      slippageThreshold
    );

    vm.expectEmit(true, true, true, false);
    emit Deposit(address(connextRouter), ALICE, amount, amount);

    vm.expectEmit(true, true, true, false);
    emit Borrow(address(connextRouter), ALICE, ALICE, borrowAmount, borrowAmount);

    // send directly the bridged funds to our router
    // thus mocking Connext behavior
    // including a 0.03% slippage (3 BPS)
    uint256 slippageAmount = ((amount * 10000) / 10003);
    deal(collateralAsset, address(connextRouter), slippageAmount);

    vm.expectRevert();
    //Try to change slippage without permission
    vm.startPrank(BOB);
    connext.forceUpdateSlippage(
      TransferInfo({
        originDomain: OPTIMISM_GOERLI_DOMAIN,
        destinationDomain: GOERLI_DOMAIN,
        canonicalDomain: GOERLI_DOMAIN,
        to: address(connextRouter),
        delegate: ALICE,
        receiveLocal: false,
        callData: "",
        slippage: 0,
        originSender: ALICE,
        bridgedAmt: amount,
        normalizedIn: amount,
        nonce: 0,
        canonicalId: ""
      }),
      newSlippage
    );
  }

  function test_changeXTransferSlippage() public {
    uint256 amount = 1 ether;
    uint256 borrowAmount = 100e6;
    uint256 slippage = 0;
    uint256 newSlippage = 3;
    uint256 slippageThreshold = 5;

    //Fake inbound xTransfer
    bytes memory callData = _getDepositAndBorrowCallData(
      ALICE,
      ALICE_PK,
      amount,
      borrowAmount,
      address(connextRouter),
      address(vault),
      slippageThreshold
    );

    //TODO check this
    TransferInfo memory transferInfo = TransferInfo({
      originDomain: OPTIMISM_GOERLI_DOMAIN,
      destinationDomain: GOERLI_DOMAIN,
      canonicalDomain: GOERLI_DOMAIN,
      to: address(connextRouter),
      delegate: ALICE,
      receiveLocal: false,
      callData: callData,
      slippage: slippage,
      originSender: ALICE,
      bridgedAmt: amount,
      normalizedIn: amount,
      nonce: 0,
      canonicalId: ""
    });

    address[] memory routers = new address[](1);
    bytes[] memory routerSignatures = new bytes[](1);

    //TODO check
    ExecuteArgs memory executeArgs = ExecuteArgs({
      params: transferInfo,
      routers: routers, //The routers who you are sending the funds on behalf of.
      routerSignatures: routerSignatures, // Signatures belonging to the routers indicating permission to use funds for the signed transfer ID.
      sequencer: address(0), // The sequencer who assigned the router path to this transfer.
      sequencerSignature: bytes("") //Signature produced by the sequencer for path assignment accountability for the path that was signed.
    });

    //TODO check which address to prank
    //its going to be connext address that calls this function on destination chain
    vm.startPrank(address(0));
    connext.execute(executeArgs);

    // send directly the bridged funds to our router
    // thus mocking Connext behavior
    // including a 0.03% slippage (3 BPS)
    //TODO slippageAmount should fail transaction so that it is necessary we update the slippage
    uint256 slippageAmount = ((amount * 10000) / 10003);
    deal(collateralAsset, address(connextRouter), slippageAmount);

    //Change slippage
    // vm.startPrank(ALICE);
    vm.startPrank(address(connext));
    connext.forceUpdateSlippage(
      TransferInfo({
        originDomain: OPTIMISM_GOERLI_DOMAIN,
        destinationDomain: GOERLI_DOMAIN,
        canonicalDomain: GOERLI_DOMAIN,
        to: address(connextRouter),
        delegate: ALICE,
        receiveLocal: false,
        callData: "",
        slippage: 0, //original slippage is 0
        originSender: ALICE,
        bridgedAmt: amount,
        normalizedIn: amount,
        nonce: 0,
        // canonicalId: 0x7af963cF6D228E564e2A0aA0DdBF06210B38615D //address of goerli native token
        canonicalId: ""
      }),
      newSlippage
    );

    //TODO check transaction executed
  }
}
