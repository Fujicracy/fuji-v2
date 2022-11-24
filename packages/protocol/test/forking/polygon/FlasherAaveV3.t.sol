// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Routines} from "../../utils/Routines.sol";
import {ForkingSetup} from "../ForkingSetup.sol";

import {AaveV3Polygon} from "../../../src/providers/polygon/AaveV3Polygon.sol";
import {AaveV2Polygon} from "../../../src/providers/polygon/AaveV2Polygon.sol";
import {ILendingProvider} from "../../../src/interfaces/ILendingProvider.sol";
// import {CompoundV3Polygon} from "../../../src/providers/polygon/CompoundV3Polygon.sol";
import {IVault} from "../../../src/interfaces/IVault.sol";
import {FlasherAaveV3} from "../../../src/flashloans/FlasherAaveV3.sol";
import {IFlasher} from "../../../src/interfaces/IFlasher.sol";
import {MockRebalancerManager} from "../../../src/mocks/MockRebalancerManager.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IV3Pool} from "../../../src/interfaces/aaveV3/IV3Pool.sol";
import {IFlashLoanSimpleReceiver} from "../../../src/interfaces/aaveV3/IFlashLoanSimpleReceiver.sol";

contract FlasherAaveV3Test is Routines, ForkingSetup, IFlashLoanSimpleReceiver {
  ILendingProvider public providerAaveV3;
  ILendingProvider public providerAaveV2;

  IFlasher public flasher;

  MockRebalancerManager public rebalancer;

  uint256 public constant DEPOSIT_AMOUNT = 1 ether;
  uint256 public constant BORROW_AMOUNT = 10e16;

  function setUp() public {
    deploy(POLYGON_DOMAIN);

    providerAaveV3 = new AaveV3Polygon();
    providerAaveV2 = new AaveV2Polygon();

    ILendingProvider[] memory providers = new ILendingProvider[](2);
    providers[0] = providerAaveV3;
    providers[1] = providerAaveV2;

    _setVaultProviders(vault, providers);
    vault.setActiveProvider(providerAaveV3);

    rebalancer = new MockRebalancerManager();
    chief.grantRole(REBALANCER_ROLE, address(rebalancer));

    flasher = new FlasherAaveV3(0x794a61358D6845594F94dc1DB02A252b5b4814aD);

    do_depositAndBorrow(DEPOSIT_AMOUNT, BORROW_AMOUNT, vault, ALICE);
  }

  function executeOperation(
    address asset,
    uint256 amount,
    uint256 premium,
    address initiator,
    bytes calldata data
  )
    external
    override
    returns (bool success)
  {
    (address debtAsset_, uint256 amount_) = abi.decode(data, (address, uint256));

    assertEq(IERC20(debtAsset_).balanceOf(address(this)), amount_);

    success = true;
  }

  function test_flashloan() public {
    bytes memory data = abi.encode(debtAsset, BORROW_AMOUNT);

    IV3Pool(flasher.getFlashloanSourceAddr(debtAsset)).flashLoanSimple(
      address(this), debtAsset, BORROW_AMOUNT, data, 0
    );
    assertEq(IERC20(debtAsset).balanceOf(address(this)), 0);
  }
}
