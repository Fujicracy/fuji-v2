// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

/**
 * @title Chief helper interface.
 * @author Fujidao Labs
 * @notice Defines interface for {Chief} access control operations.
 */

import {IAccessControl} from "openzeppelin-contracts/contracts/access/IAccessControl.sol";

interface IChief is IAccessControl {
  function timelock() external view returns (address);

  function addrMapper() external view returns (address);

  function allowedFlasher(address flasher) external view returns (bool);
}
