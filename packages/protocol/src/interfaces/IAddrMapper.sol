// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

interface IAddrMapper {
  /**
   * @dev Log a change in address mapping
   */
  event MappingChanged(address[] keyAddress, address mappedAddress);

  function addressMapping(address) external view returns (address);

  function addressMapping(address, address) external view returns (address);
}
