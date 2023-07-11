// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import {BeaconProxy} from "openzeppelin-contracts/contracts/proxy/beacon/BeaconProxy.sol";
import {IChief} from "../interfaces/IChief.sol";

contract VaultBeaconProxy is BeaconProxy {
  /// @dev Custom Errors
  error VaultBeaconProxy__onlyTimelock_callerIsNotTimelock();

  IChief public chief;

  /**
   * @dev Modifier that checks `msg.sender` is the defined `timelock` in {Chief}
   * contract.
   */
  modifier onlyTimelock() {
    if (msg.sender != chief.timelock()) {
      revert VaultBeaconProxy__onlyTimelock_callerIsNotTimelock();
    }
    _;
  }

  constructor(address beacon, bytes memory data, address chief_) BeaconProxy(beacon, data) {
    chief = IChief(chief_);
  }

  /**
   * @dev Perform beacon upgrade with additional setup call. Note: This upgrades the address of the beacon, it does
   * not upgrade the implementation contained in the beacon (see {UpgradeableBeacon-_setImplementation} for that).
   *
   * Emits a {BeaconUpgraded} event.
   */
  function upgradeBeaconAndCall(
    address newBeacon,
    bytes memory data,
    bool forceCall
  )
    external
    onlyTimelock
  {
    _upgradeBeaconToAndCall(newBeacon, data, forceCall);
  }
}
