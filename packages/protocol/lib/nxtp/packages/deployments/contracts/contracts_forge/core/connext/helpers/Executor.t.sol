// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../../../utils/ForgeHelper.sol";
import "../../../../contracts/test/TestERC20.sol";
import "../../../../contracts/core/connext/interfaces/IExecutor.sol";
import "../../../../contracts/core/connext/helpers/Executor.sol";

// Mock contract
contract MockStaking {
  uint256 public nonce = 0;
  mapping(address => uint256) public staked;

  function increaseNonce() public returns (uint256) {
    nonce++;
    return nonce;
  }

  function descreaseNonce() public returns (uint256) {
    require(nonce != 0, "!underflow");
    nonce--;
    return nonce;
  }

  function stake(address asset, uint256 amount) public payable returns (uint256) {
    if (asset == address(0)) {
      require(msg.value == amount, "!amount");
    } else {
      IERC20(asset).transferFrom(msg.sender, address(this), amount);
    }

    staked[msg.sender] += amount;
    return amount;
  }
}

// Helper to query properties via reentrancy
contract PropertyQuery is ForgeHelper {
  address public originSender;
  uint32 public origin;
  uint256 public amt;

  function setOriginSender() public returns (address) {
    originSender = IExecutor(msg.sender).originSender();
    return originSender;
  }

  function setOrigin() public returns (uint32) {
    origin = IExecutor(msg.sender).origin();
    return origin;
  }

  function setAmount() public payable returns (uint256) {
    amt = IExecutor(msg.sender).amount();
    return amt;
  }

  receive() external payable {}
}

contract ExecutorTest is ForgeHelper {
  // ============ Libraries ============

  using stdStorage for StdStorage;
  using TypedMemView for bytes29;
  using TypedMemView for bytes;

  // ============ Event ============
  event Executed(
    bytes32 indexed transferId,
    address indexed to,
    address indexed recovery,
    address assetId,
    uint256 amount,
    bytes _properties,
    bytes callData,
    bytes returnData,
    bool success
  );

  // ============ Storage ============

  Executor executor;
  PropertyQuery query;
  TestERC20 asset;
  MockStaking mockStaking;

  address connext = address(this);
  address originSender = address(2);
  address recovery = address(3);
  uint32 origin = uint32(1000);
  bytes32 transferId = keccak256(abi.encode(1));

  // ============ Test set up ============

  function setUp() public {
    executor = new Executor(connext);
    query = new PropertyQuery();
    asset = new TestERC20("Test Token", "TEST");
    mockStaking = new MockStaking();

    // fund executor
    asset.mint(address(executor), 10 ether);
  }

  // ============ getConnext ============

  // Should work
  function test_Executor__getConnext_works() public {
    address c = executor.getConnext();
    assertEq(c, connext);
  }

  // ============ originSender ============

  // Should fail if properties are not set
  function test_Executor__originSender_revertOnEmpty() public {
    // Get the calldata
    bytes memory data = abi.encodeWithSelector(PropertyQuery.setOriginSender.selector, "");
    // send tx
    (bool success, ) = executor.execute(
      IExecutor.ExecutorArgs(
        transferId,
        0,
        payable(address(query)),
        payable(recovery),
        NATIVE_ASSET,
        LibCrossDomainProperty.EMPTY_BYTES,
        data
      )
    );
    assertTrue(!success);
  }

  // Should work
  function test_Executor__originSender_works() public {
    // Get the calldata
    bytes memory data = abi.encodeWithSelector(PropertyQuery.setOriginSender.selector, "");
    bytes memory property = LibCrossDomainProperty.formatDomainAndSenderBytes(origin, originSender);

    // send tx
    (bool success, ) = executor.execute(
      IExecutor.ExecutorArgs(transferId, 0, payable(address(query)), payable(recovery), NATIVE_ASSET, property, data)
    );
    assertTrue(success);
    assertEq(query.originSender(), originSender);
  }

  // ============ origin ============

  // Should fail if properties are not set
  function test_Executor__origin_revertOnEmpty() public {
    // Get the calldata
    bytes memory data = abi.encodeWithSelector(PropertyQuery.setOrigin.selector, "");
    // send tx
    (bool success, ) = executor.execute(
      IExecutor.ExecutorArgs(
        transferId,
        0,
        payable(address(query)),
        payable(recovery),
        NATIVE_ASSET,
        LibCrossDomainProperty.EMPTY_BYTES,
        data
      )
    );
    assertTrue(!success);
  }

  // Should work
  function test_Executor__origin_works() public {
    // Get the calldata
    bytes memory data = abi.encodeWithSelector(PropertyQuery.setOrigin.selector, "");
    bytes memory property = LibCrossDomainProperty.formatDomainAndSenderBytes(origin, originSender);

    // send tx
    (bool success, ) = executor.execute(
      IExecutor.ExecutorArgs(transferId, 0, payable(address(query)), payable(recovery), NATIVE_ASSET, property, data)
    );
    assertTrue(success);
    assertEq(query.origin(), origin);
  }

  // ============ amount ============

  // Should work
  function test_Executor__amount_works() public {
    // Get the calldata
    bytes memory data = abi.encodeWithSelector(PropertyQuery.setAmount.selector, "");
    bytes memory property = LibCrossDomainProperty.EMPTY_BYTES;

    // send tx
    uint256 amount = 1200;
    (bool success, ) = executor.execute(
      IExecutor.ExecutorArgs(
        transferId,
        amount,
        payable(address(query)),
        payable(recovery),
        address(asset),
        property,
        data
      )
    );
    assertTrue(success);
    assertEq(query.amt(), amount);
    assertEq(executor.amount(), 0);
  }

  // ============ execute ============

  // Fails if not called by connext
  function test_Executor__execute_revertIfNotConnext() public {
    // Get the calldata
    bytes memory data = abi.encodeWithSelector(PropertyQuery.setAmount.selector, "");
    bytes memory property = LibCrossDomainProperty.EMPTY_BYTES;

    // Get starting recovery balance
    uint256 initRecovery = asset.balanceOf(recovery);

    // send tx
    uint256 amount = 1200;
    vm.expectRevert(bytes("!connext"));
    vm.prank(address(12345));
    (bool success, ) = executor.execute(
      IExecutor.ExecutorArgs(
        transferId,
        amount,
        payable(address(12344321)),
        payable(recovery),
        address(asset),
        property,
        data
      )
    );
  }

  // Should gracefully handle failures if value != amount
  function test_Executor__execute_handlesIfValueIsNotAmount() public {
    // Get the calldata
    bytes memory data = abi.encodeWithSelector(MockStaking.stake.selector, address(0), 100);
    bytes memory property = LibCrossDomainProperty.EMPTY_BYTES;

    uint256 amount = 100;
    address to = address(mockStaking);

    uint256 initRecovery = recovery.balance;
    uint256 initTo = to.balance;

    vm.expectEmit(true, true, true, true);
    emit Executed(transferId, to, recovery, address(0), 99, property, data, bytes(""), false);

    (bool success, ) = executor.execute{value: 99}(
      IExecutor.ExecutorArgs(transferId, amount, address(mockStaking), payable(recovery), address(0), property, data)
    );
    assertTrue(!success);

    assertEq(to.balance, initTo);
    assertEq(recovery.balance, initRecovery + 99);
  }

  // Should gracefully handle failure of no code at to
  function test_Executor__execute_handlesNoCodeFailure() public {
    // Get the calldata
    bytes memory data = abi.encodeWithSelector(PropertyQuery.setAmount.selector, "");
    bytes memory property = LibCrossDomainProperty.EMPTY_BYTES;

    // Get starting recovery balance
    uint256 initRecovery = asset.balanceOf(recovery);

    // send tx
    uint256 amount = 1200;
    address to = payable(address(12344321));

    // expect the call to transfer to recovery
    vm.expectCall(address(asset), abi.encodeWithSelector(IERC20.transfer.selector, recovery, amount));

    vm.expectEmit(true, true, true, true);
    emit Executed(transferId, to, recovery, address(asset), amount, property, data, bytes(""), false);

    (bool success, ) = executor.execute(
      IExecutor.ExecutorArgs(transferId, amount, to, payable(recovery), address(asset), property, data)
    );
    assertTrue(!success);

    // should have transferred funds to recovery address
    assertEq(asset.balanceOf(recovery), initRecovery + amount);
  }

  // Should gracefully handle failure of no code at to if using native
  function test_Executor__execute_handlesNoCodeFailureWithNative() public {
    // Get the calldata
    bytes memory data = abi.encodeWithSelector(PropertyQuery.setAmount.selector, "");
    bytes memory property = LibCrossDomainProperty.EMPTY_BYTES;

    // Get starting recovery balance
    uint256 initRecovery = recovery.balance;

    // send tx
    uint256 amount = 1200;
    address to = payable(address(12344321));

    vm.expectEmit(true, true, true, true);
    emit Executed(transferId, to, recovery, address(0), amount, property, data, bytes(""), false);

    (bool success, ) = executor.execute{value: amount}(
      IExecutor.ExecutorArgs(transferId, amount, to, payable(recovery), address(0), property, data)
    );
    assertTrue(!success);

    // should have transferred funds to recovery address
    assertEq(recovery.balance, initRecovery + amount);
  }

  // Should hande the case if excessivlySafeCall fails
  function test_Executor__execute_handlesExcessivelySafeCallFailure() public {
    // Get the calldata
    bytes memory data = abi.encodeWithSelector(MockStaking.descreaseNonce.selector, "");
    bytes memory property = LibCrossDomainProperty.EMPTY_BYTES;

    // Get starting recovery balance
    uint256 initRecovery = asset.balanceOf(recovery);

    uint256 amount = 10000;
    address to = address(mockStaking);

    // Get the expected return results
    (, bytes memory ret) = to.call(data);

    // expect the call to the increase allowance
    vm.expectCall(address(asset), abi.encodeWithSelector(IERC20.approve.selector, to, amount));

    // expect the call to decrease allowance
    vm.expectCall(address(asset), abi.encodeWithSelector(IERC20.approve.selector, to, 0));

    // expect the call to transfer to recovery
    vm.expectCall(address(asset), abi.encodeWithSelector(IERC20.transfer.selector, recovery, amount));

    vm.expectEmit(true, true, true, true);
    emit Executed(transferId, to, recovery, address(asset), amount, property, data, ret, false);

    (bool success, ) = executor.execute(
      IExecutor.ExecutorArgs(transferId, amount, to, payable(recovery), address(asset), property, data)
    );

    assertTrue(!success);
    assertEq(asset.balanceOf(recovery), initRecovery + amount);
  }

  // Should hande the case if excessivlySafeCall fails
  function test_Executor__execute_handlesExcessivelySafeCallFailure0Value() public {
    // Get the calldata
    bytes memory data = abi.encodeWithSelector(MockStaking.descreaseNonce.selector, "");
    bytes memory property = LibCrossDomainProperty.EMPTY_BYTES;

    // Get starting recovery balance
    uint256 initRecovery = asset.balanceOf(recovery);

    uint256 amount = 0;
    address to = address(mockStaking);

    // Get the expected return results
    (, bytes memory ret) = to.call(data);

    // no calls because no amount

    vm.expectEmit(true, true, true, true);
    emit Executed(transferId, to, recovery, address(asset), amount, property, data, ret, false);

    (bool success, ) = executor.execute(
      IExecutor.ExecutorArgs(transferId, amount, to, payable(recovery), address(asset), property, data)
    );

    assertTrue(!success);
    assertEq(asset.balanceOf(recovery), initRecovery);
  }

  // Should work with native asset
  function test_Executor__execute_worksWithNativeAsset() public {
    // Get the calldata
    bytes memory data = abi.encodeWithSelector(MockStaking.stake.selector, address(0), 100);
    bytes memory property = LibCrossDomainProperty.EMPTY_BYTES;

    uint256 amount = 100;
    address to = address(mockStaking);

    vm.expectEmit(true, true, true, true);
    emit Executed(transferId, to, recovery, address(0), amount, property, data, abi.encodePacked(amount), true);

    (bool success, ) = executor.execute{value: 100}(
      IExecutor.ExecutorArgs(transferId, amount, to, payable(recovery), address(0), property, data)
    );

    assertTrue(success);
  }

  // Should work with tokens
  function test_Executor__execute_worksWithToken() public {
    // Get the calldata
    bytes memory data = abi.encodeWithSelector(MockStaking.stake.selector, address(asset), 100);
    bytes memory property = LibCrossDomainProperty.EMPTY_BYTES;

    uint256 amount = 100;
    asset.mint(address(executor), amount);
    uint256 initBalance = asset.balanceOf(address(mockStaking));

    address to = address(mockStaking);

    // expect the call to the increase allowance
    vm.expectCall(address(asset), abi.encodeWithSelector(IERC20.approve.selector, address(mockStaking), amount));

    vm.expectEmit(true, true, true, true);
    emit Executed(transferId, to, recovery, address(asset), amount, property, data, abi.encodePacked(amount), true);

    (bool success, ) = executor.execute{value: 100}(
      IExecutor.ExecutorArgs(transferId, amount, to, payable(recovery), address(asset), property, data)
    );

    assertTrue(success);
    assertEq(asset.balanceOf(address(mockStaking)), initBalance + amount);
  }
}
