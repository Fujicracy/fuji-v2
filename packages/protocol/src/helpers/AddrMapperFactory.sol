// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.15;

import {AddrMapper} from "./AddrMapper.sol";

contract AddrMapperFactory {
  function deployAddrMapper(string calldata providerName_) external returns (address mapper) {
    // TODO add access restriction
    bytes32 salt = keccak256(bytes(providerName_));
    AddrMapper Mapper = new AddrMapper{salt: salt}(providerName_);
    Mapper.transferOwnership(msg.sender);
    mapper = address(Mapper);
  }
}
