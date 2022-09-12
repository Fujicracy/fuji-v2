// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {IAddrMapper} from "../interfaces/IAddrMapper.sol";

/**
 * @dev Contract that stores and returns addresses mappings
 * Required for getting contract addresses for some providers and flashloan providers
 */
contract AddrMapper is IAddrMapper, Ownable {
  // Address input => address output
  // (e.g. public erc20 => protocol Token)
  mapping(address => address) private _addressMappingT1;
  // Address input_1, address input_2 => address output
  mapping(address => mapping(address => address)) private _addressMappingT2;

  function addressMapping(address inputAddr) external view override returns (address) {
    return _addressMappingT1[inputAddr];
  }

  function addressMapping(address inputAddr1, address inputAddr2)
    external
    view
    override
    returns (address)
  {
    return _addressMappingT2[inputAddr1][inputAddr2];
  }

  /**
   * @dev Adds a mapping 1:1
   */
  function setMapping(address _addr, address _resultAddr) public onlyOwner {
    _addressMappingT1[_addr] = _resultAddr;
    address[] memory inputAddresses = new address[](1);
    inputAddresses[0] = _addr;
    emit MappingChanged(inputAddresses, _resultAddr);
  }

  /**
   * @dev Adds a mapping 2:1
   */
  function setMapping(address _addr1, address _addr2, address _resultAddr) public onlyOwner {
    _addressMappingT2[_addr1][_addr2] = _resultAddr;
    address[] memory inputAddresses = new address[](2);
    inputAddresses[0] = _addr1;
    inputAddresses[1] = _addr2;
    emit MappingChanged(inputAddresses, _resultAddr);
  }
}
