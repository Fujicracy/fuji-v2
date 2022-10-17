// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {IAccessControl} from "openzeppelin-contracts/contracts/access/IAccessControl.sol";

contract SystemAccessControl {
  error SystemAccessControl__missingRole(address caller, bytes32 role);

  IAccessControl public immutable chief;

  modifier hasRole(address caller, bytes32 role) {
    if (!chief.hasRole(role, caller)) {
      revert SystemAccessControl__missingRole(caller, role);
    }
    _;
  }

  constructor(address chief_) {
    chief = IAccessControl(chief_);
  }
}
