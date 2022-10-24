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
  error SystemAccessControl__hasRole_missingRole(address caller, bytes32 role);
  error SystemAccessControl__onlyTimelock_callerIsNotTimelock();

  IChief public immutable chief;

  modifier hasRole(address caller, bytes32 role) {
    if (!chief.hasRole(role, caller)) {
      revert SystemAccessControl__hasRole_missingRole(caller, role);
    }
    _;
  }

  modifier onlyTimelock() {
    if (msg.sender != chief.timelock()) {
      revert SystemAccessControl__onlyTimelock_callerIsNotTimelock();
    }
    _;
  }

  constructor(address chief_) {
    chief = IChief(chief_);
  }
}
