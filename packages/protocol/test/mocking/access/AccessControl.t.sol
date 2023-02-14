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

  function test_stale_data_chainlink() public {
    /// chainlink of KNC / USDC 
    MockERC20 knc = new MockERC20("KNC", "knc");
    MockChainlinkPriceFeed kncPriceFeed = new MockChainlinkPriceFeed(
      "KNC / USD",
      8,
      1000
    );

    /// set price feed for knc 
    _callWithTimelock(
      address(fujiOracle),
      abi.encodeWithSelector(
        FujiOracle.setPriceFeed.selector, 
        address(knc),
        address(kncPriceFeed)
      )
    );
    assertEq(fujiOracle.usdPriceFeeds(address(knc)), address(kncPriceFeed));
    
    // knc price feed has met a problem (the one described in chainlink docs) which made data stale
    kncPriceFeed.toggleStaleData(true);
    (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) 
      = kncPriceFeed.latestRoundData();
    
    /// stale data 
    assertLt(answeredInRound, roundId);
    
    /// this should revert since the data is stale, but this function still return the price 
    uint price = fujiOracle.getPriceOf(address(knc), address(asset), 8);
  }
}
