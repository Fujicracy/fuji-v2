// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title SystemAccessControl.
 * @author Fujidao Labs
 * @notice Helper contract that should be inherited by contract implementations that
 * should call {Chief} for access control checks.
 */

import {IChief} from "../interfaces/IChief.sol";
import {CoreRoles} from "./CoreRoles.sol";

contract SystemAccessControl is CoreRoles {
  error SystemAccessControl__missingRole(address caller, bytes32 role);
  error SystemAccessControl__callerIsNotTimeLock();

  IChief public immutable chief;

  modifier hasRole(address caller, bytes32 role) {
    if (!chief.hasRole(role, caller)) {
      revert SystemAccessControl__missingRole(caller, role);
    }
    _;
  }

  modifier onlyTimeLock() {
    if (msg.sender != chief.timelock()) {
      revert SystemAccessControl__callerIsNotTimeLock();
    }
    _;
  }

  constructor(address chief_) {
    chief = IChief(chief_);
  }
}
