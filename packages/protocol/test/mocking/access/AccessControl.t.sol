// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {MockingSetup} from "../MockingSetup.sol";
import {Chief} from "../../../src/Chief.sol";
import {FujiOracle} from "../../../src/FujiOracle.sol";
import {AddrMapper} from "../../../src/helpers/AddrMapper.sol";
import {SystemAccessControl} from "../../../src/access/SystemAccessControl.sol";
import {MockERC20} from "../../../src/mocks/MockERC20.sol";
import {MockChainlinkPriceFeed} from "../../../src/mocks/MockChainlinkPriceFeed.sol";

contract AccessControlUnitTests is MockingSetup {
  FujiOracle public fujiOracle;
  AddrMapper public addrMapper;

  MockERC20 public asset;
  MockChainlinkPriceFeed public mockPriceFeed;

  function setUp() public {
    asset = MockERC20(collateralAsset);

    mockPriceFeed = new MockChainlinkPriceFeed(
      "ETH / USD",
      8,
      200000000000
    );

    addrMapper = AddrMapper(chief.addrMapper());

    address[] memory assets = new address[](1);
    assets[0] = address(asset);
    address[] memory priceFeeds = new address[](1);
    priceFeeds[0] = address(mockPriceFeed);

    fujiOracle = new FujiOracle(assets, priceFeeds, address(chief));
  }

  /// FujiOracle access control tests

  function test_tryFoeSetPriceFeed(address foe) public {
    vm.assume(
      foe != address(timelock) && foe != address(0) && foe != address(this) && foe != address(chief)
    );
    MockChainlinkPriceFeed maliciousPriceFeed = new MockChainlinkPriceFeed("FakeETH / USD", 8, 1);
    vm.expectRevert(
      SystemAccessControl.SystemAccessControl__onlyTimelock_callerIsNotTimelock.selector
    );
    vm.prank(foe);
    fujiOracle.setPriceFeed(address(asset), address(maliciousPriceFeed));
    vm.stopPrank();
  }

  /// AddrMapper access control tests

  function test_tryFoeSetMapping(
    address foe,
    address keyAddr1,
    address keyAddr2,
    address returnedAddr
  )
    public
  {
    vm.assume(
      foe != address(timelock) && foe != address(0) && foe != address(this) && foe != address(chief)
    );
    vm.expectRevert(
      SystemAccessControl.SystemAccessControl__onlyTimelock_callerIsNotTimelock.selector
    );
    vm.prank(foe);
    addrMapper.setMapping("MockProvider_V1", keyAddr1, returnedAddr);
    vm.stopPrank();

    vm.expectRevert(
      SystemAccessControl.SystemAccessControl__onlyTimelock_callerIsNotTimelock.selector
    );
    vm.prank(foe);
    addrMapper.setNestedMapping("MockProvider_V2", keyAddr1, keyAddr2, returnedAddr);
    vm.stopPrank();
  }
}
