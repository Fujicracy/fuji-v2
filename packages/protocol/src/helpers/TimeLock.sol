// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title TimeLock.
 * @author Fujidao Labs
 * @notice Enforce a time lock in Fuji-V2 risk parameter change operations. This contract is
 * based on OpenZeppelin-TimelockController; however, all access control calls
 * are delegated to {Chief}.
 * Changes are indicated through documentation
 * `SupportsInterface` and `onReceived` token functions were removed from the OZ implementation.
 */

import {SystemAccessControl} from "./SystemAccessControl.sol";

contract TimeLock is SystemAccessControl {
  /**
   * @dev Refer to OpenZeppelin-TimelockController
   * https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/governance/TimelockController.sol
   */
  event CallScheduled(
    bytes32 indexed id,
    uint256 indexed index,
    address target,
    uint256 value,
    bytes data,
    bytes32 predecessor,
    uint256 delay
  );

  /**
   * @dev Refer to OpenZeppelin-TimelockController
   * https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/governance/TimelockController.sol
   */
  event CallExecuted(
    bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data
  );

  /**
   * @dev Refer to OpenZeppelin-TimelockController
   * https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/governance/TimelockController.sol
   */
  event Cancelled(bytes32 indexed id);

  /**
   * @dev Refer to OpenZeppelin-TimelockController
   * https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/governance/TimelockController.sol
   */
  event MinDelayChange(uint256 oldDuration, uint256 newDuration);

  bytes32 public constant TIMELOCK_ADMIN_ROLE = keccak256("TIMELOCK_ADMIN_ROLE");
  bytes32 public constant TIMELOCK_PROPOSER_ROLE = keccak256("TIMELOCK_PROPOSER_ROLE");
  bytes32 public constant TIMELOCK_EXECUTOR_ROLE = keccak256("TIMELOCK_EXECUTOR_ROLE");
  bytes32 public constant TIMELOCK_CANCELLER_ROLE = keccak256("TIMELOCK_CANCELLER_ROLE");

  uint256 internal constant _DONE_TIMESTAMP = uint256(1);

  mapping(bytes32 => uint256) private _timestamps;

  uint256 private _minDelay;

  /**
   * @dev Initializes the contract with the minimum `minDelay` and the `chief` contract
   * that handles access control roles.
   */
  constructor(address chief_, uint256 minDelay) SystemAccessControl(chief_) {
    _minDelay = minDelay;
    emit MinDelayChange(0, minDelay);
  }

  /**
   * @dev Refer to OpenZeppelin-TimelockController
   * https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/governance/TimelockController.sol
   */
  receive() external payable {}

  /**
   * @dev Refer to OpenZeppelin-TimelockController
   * https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/governance/TimelockController.sol
   */
  function isOperation(bytes32 id) public view virtual returns (bool registered) {
    return getTimestamp(id) > 0;
  }

  /**
   * @dev Refer to OpenZeppelin-TimelockController
   * https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/governance/TimelockController.sol
   */
  function isOperationPending(bytes32 id) public view virtual returns (bool pending) {
    return getTimestamp(id) > _DONE_TIMESTAMP;
  }

  /**
   * @dev Refer to OpenZeppelin-TimelockController
   * https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/governance/TimelockController.sol
   */
  function isOperationReady(bytes32 id) public view virtual returns (bool ready) {
    uint256 timestamp = getTimestamp(id);
    return timestamp > _DONE_TIMESTAMP && timestamp <= block.timestamp;
  }

  /**
   * @dev Refer to OpenZeppelin-TimelockController
   * https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/governance/TimelockController.sol
   */
  function isOperationDone(bytes32 id) public view virtual returns (bool done) {
    return getTimestamp(id) == _DONE_TIMESTAMP;
  }

  /**
   * @dev Refer to OpenZeppelin-TimelockController
   * https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/governance/TimelockController.sol
   */
  function getTimestamp(bytes32 id) public view virtual returns (uint256 timestamp) {
    return _timestamps[id];
  }

  /**
   * @dev Refer to OpenZeppelin-TimelockController
   * https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/governance/TimelockController.sol
   */
  function getMinDelay() public view virtual returns (uint256 duration) {
    return _minDelay;
  }

  /**
   * @dev Refer to OpenZeppelin-TimelockController
   * https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/governance/TimelockController.sol
   */
  function hashOperation(
    address target,
    uint256 value,
    bytes calldata data,
    bytes32 predecessor,
    bytes32 salt
  )
    public
    pure
    virtual
    returns (bytes32 hash)
  {
    return keccak256(abi.encode(target, value, data, predecessor, salt));
  }

  /**
   * @dev Refer to OpenZeppelin-TimelockController
   * https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/governance/TimelockController.sol
   */
  function hashOperationBatch(
    address[] calldata targets,
    uint256[] calldata values,
    bytes[] calldata payloads,
    bytes32 predecessor,
    bytes32 salt
  )
    public
    pure
    virtual
    returns (bytes32 hash)
  {
    return keccak256(abi.encode(targets, values, payloads, predecessor, salt));
  }

  /**
   * @dev Schedule an operation containing a single transaction.
   * Emits a {CallScheduled} event.
   *
   * Requirements:
   * - the caller must have the 'TIMELOCK_PROPOSER_ROLE' role in {Chief}.
   */
  function schedule(
    address target,
    uint256 value,
    bytes calldata data,
    bytes32 predecessor,
    bytes32 salt,
    uint256 delay
  )
    public
    hasRole(msg.sender, TIMELOCK_PROPOSER_ROLE)
  {
    bytes32 id = hashOperation(target, value, data, predecessor, salt);
    _schedule(id, delay);
    emit CallScheduled(id, 0, target, value, data, predecessor, delay);
  }

  /**
   * @dev Schedule an operation containing a batch of transactions.
   * Emits one {CallScheduled} event per transaction in the batch.
   *
   * Requirements:
   * - the caller must have the 'TIMELOCK_PROPOSER_ROLE' role in {Chief}.
   */
  function scheduleBatch(
    address[] calldata targets,
    uint256[] calldata values,
    bytes[] calldata payloads,
    bytes32 predecessor,
    bytes32 salt,
    uint256 delay
  )
    public
    hasRole(msg.sender, TIMELOCK_PROPOSER_ROLE)
  {
    require(targets.length == values.length, "TimelockController: length mismatch");
    require(targets.length == payloads.length, "TimelockController: length mismatch");

    bytes32 id = hashOperationBatch(targets, values, payloads, predecessor, salt);
    _schedule(id, delay);
    for (uint256 i = 0; i < targets.length; ++i) {
      emit CallScheduled(id, i, targets[i], values[i], payloads[i], predecessor, delay);
    }
  }

  /**
   * @dev Refer to OpenZeppelin-TimelockController
   * https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/governance/TimelockController.sol
   */
  function _schedule(bytes32 id, uint256 delay) private {
    require(!isOperation(id), "TimelockController: operation already scheduled");
    require(delay >= getMinDelay(), "TimelockController: insufficient delay");
    _timestamps[id] = block.timestamp + delay;
  }

  /**
   * @dev Cancel an operation.
   * Requirements:
   * - the caller must have the 'TIMELOCK_CANCELLER_ROLE' role in {Chief}.
   */
  function cancel(bytes32 id) public hasRole(msg.sender, TIMELOCK_CANCELLER_ROLE) {
    require(isOperationPending(id), "TimelockController: operation cannot be cancelled");
    delete _timestamps[id];

    emit Cancelled(id);
  }

  /**
   * @dev Execute an (ready) operation containing a single transaction.
   * Emits a {CallExecuted} event.
   *
   * Requirements:
   * - the caller must have the 'TIMELOCK_EXECUTOR_ROLE' role in {Chief}.
   */
  function execute(
    address target,
    uint256 value,
    bytes calldata payload,
    bytes32 predecessor,
    bytes32 salt
  )
    public
    payable
    hasRole(msg.sender, TIMELOCK_EXECUTOR_ROLE)
  {
    bytes32 id = hashOperation(target, value, payload, predecessor, salt);

    _beforeCall(id, predecessor);
    _execute(target, value, payload);
    emit CallExecuted(id, 0, target, value, payload);
    _afterCall(id);
  }

  /**
   * @dev Execute an (ready) operation containing a batch of transactions.
   * Emits one {CallExecuted} event per transaction in the batch.
   *
   * Requirements:
   * - the caller must have the 'TIMELOCK_EXECUTOR_ROLE' role in {Chief}.
   */
  function executeBatch(
    address[] calldata targets,
    uint256[] calldata values,
    bytes[] calldata payloads,
    bytes32 predecessor,
    bytes32 salt
  )
    public
    payable
    hasRole(msg.sender, TIMELOCK_EXECUTOR_ROLE)
  {
    require(targets.length == values.length, "TimelockController: length mismatch");
    require(targets.length == payloads.length, "TimelockController: length mismatch");

    bytes32 id = hashOperationBatch(targets, values, payloads, predecessor, salt);

    _beforeCall(id, predecessor);
    for (uint256 i = 0; i < targets.length; ++i) {
      address target = targets[i];
      uint256 value = values[i];
      bytes calldata payload = payloads[i];
      _execute(target, value, payload);
      emit CallExecuted(id, i, target, value, payload);
    }
    _afterCall(id);
  }

  /**
   * @dev Refer to OpenZeppelin-TimelockController
   * https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/governance/TimelockController.sol
   */
  function _execute(address target, uint256 value, bytes calldata data) internal virtual {
    (bool success,) = target.call{value: value}(data);
    require(success, "TimelockController: underlying transaction reverted");
  }

  /**
   * @dev Refer to OpenZeppelin-TimelockController
   * https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/governance/TimelockController.sol
   */
  function _beforeCall(bytes32 id, bytes32 predecessor) private view {
    require(isOperationReady(id), "TimelockController: operation is not ready");
    require(
      predecessor == bytes32(0) || isOperationDone(predecessor),
      "TimelockController: missing dependency"
    );
  }

  /**
   * @dev Refer to OpenZeppelin-TimelockController
   * https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/governance/TimelockController.sol
   */
  function _afterCall(bytes32 id) private {
    require(isOperationReady(id), "TimelockController: operation is not ready");
    _timestamps[id] = _DONE_TIMESTAMP;
  }

  /**
   * @dev Refer to OpenZeppelin-TimelockController
   * https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/governance/TimelockController.sol
   */
  function updateDelay(uint256 newDelay) external hasRole(msg.sender, TIMELOCK_ADMIN_ROLE) {
    emit MinDelayChange(_minDelay, newDelay);
    _minDelay = newDelay;
  }
}
