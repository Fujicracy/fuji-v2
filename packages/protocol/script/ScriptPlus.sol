// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "forge-std/console.sol";

contract ScriptPlus is Script {
  function saveAddress(string memory path, address addr) internal {
    try vm.removeFile(path) {}
    catch {
      console.log(string(abi.encodePacked("Creating a new record at ", path)));
    }
    vm.writeLine(path, vm.toString(addr));
  }

  function saveAddressEncoded(string memory path, address addr) internal {
    try vm.removeFile(path) {}
    catch {
      console.log(string(abi.encodePacked("Creating a new encoded record at ", path)));
    }
    vm.writeLine(path, vm.toString(abi.encode(addr)));
  }

  function getAddress(string memory path) internal returns (address addr) {
    string[] memory inputs = new string[](2);
    inputs[0] = "cat";
    inputs[1] = path;
    bytes memory res = vm.ffi(inputs);

    addr = abi.decode(res, (address));
  }

  function getPrivKey() internal returns (uint256 key) {
    bytes32 k = vm.envBytes32("PRIVATE_KEY");
    key = uint256(k);
  }
}
