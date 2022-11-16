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
import {ConnextRouter} from "../../../src/routers/ConnextRouter.sol";
import {IWETH9} from "../../../src/abstracts/WETH9.sol";
import {LibSigUtils} from "../../../src/libraries/LibSigUtils.sol";

contract ConnextRouterTest is Routines, ForkingSetup {
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

  function setUp() public {
    uint32 domain = OPTIMISM_GOERLI_DOMAIN;
    deploy(domain);

    connextRouter = new ConnextRouter(
      IWETH9(collateralAsset),
      IConnext(registry[domain].connext),
      chief
    );

    // addresses are supposed to be the same across different chains
    /*connextRouter.setRouter(GOERLI_DOMAIN, address(connextRouter));*/
    bytes memory callData = abi.encodeWithSelector(
      ConnextRouter.setRouter.selector, GOERLI_DOMAIN, address(connextRouter)
    );
    _callWithTimelock(callData, address(connextRouter));

    /*connextRouter.setRouter(MUMBAI_DOMAIN, address(connextRouter));*/
    callData = abi.encodeWithSelector(
      ConnextRouter.setRouter.selector, MUMBAI_DOMAIN, address(connextRouter)
    );
    _callWithTimelock(callData, address(connextRouter));

    // test with a mock provider because Connext's and Aave's WETH mismatch
    MockProviderV0 mockProvider = new MockProviderV0();
    ILendingProvider[] memory providers = new ILendingProvider[](1);
    providers[0] = mockProvider;

    _setVaultProviders(vault, providers);
    vault.setActiveProvider(mockProvider);
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
    bytes memory randomData = abi.encode(keccak256("data_data"));
    args[0] = abi.encode(destDomain, 30, collateralAsset, amount, randomData);

    /*bytes4 selector =*/
    /*bytes4(keccak256("xCall(uint32,address,address,address,uint256,uint256,bytes)"));*/
    /*bytes memory callData = abi.encodeWithSelector(*/
    /*selector,*/
    /*destDomain,*/
    /*connextRouter.routerByDomain(destDomain),*/
    /*collateralAsset,*/
    /*ALICE,*/
    /*amount,*/
    /*30,*/
    /*randomData*/
    /*);*/

    /*vm.expectCall(address(connext), "");*/

    vm.expectEmit(false, false, false, false);
    emit Dispatch("", 1, "", "");

    connextRouter.xBundle(actions, args);
  }

  function test_bridgeInbound() public {
    uint256 amount = 0.2 ether;
    uint256 borrowAmount = 100e6;

    bytes memory callData =
      _getDepositAndBorrowCallData(amount, borrowAmount, address(connextRouter), address(vault));

    vm.expectEmit(true, true, true, false);
    emit Deposit(address(connextRouter), ALICE, amount, amount);

    vm.expectEmit(true, true, true, false);
    emit Borrow(address(connextRouter), ALICE, ALICE, borrowAmount, borrowAmount);

    // send directly the bridged funds to our router
    // thus mocking Connext behavior
    deal(collateralAsset, address(connextRouter), amount);

    vm.startPrank(registry[originDomain].connext);
    connextRouter.xReceive("", 0, address(0), address(0), originDomain, callData);

    assertEq(vault.balanceOf(ALICE), amount);
    assertEq(IERC20(collateralAsset).balanceOf(address(connextRouter)), 0);
  }

  function test_bridgeInboundXBundleFails() public {
    uint256 amount = 2 ether;
    uint256 borrowAmount = 1000e6;

    // make the callData to fail
    bytes memory callData =
      _getDepositAndBorrowCallData(amount, borrowAmount, address(0), address(vault));

    // send directly the bridged funds to our router
    // thus mocking Connext behavior
    deal(collateralAsset, address(connextRouter), amount);

    connextRouter.xReceive("", 0, address(0), address(0), originDomain, callData);

    assertEq(vault.balanceOf(ALICE), 0);
    // funds are kept at the Router
    assertEq(IERC20(collateralAsset).balanceOf(address(connextRouter)), amount);
  }
}
