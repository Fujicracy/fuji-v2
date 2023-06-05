// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/Script.sol";
import "forge-std/console.sol";

contract ScriptPlus is Script {
  // https://docs.connext.network/resources/deployments
  uint32 public constant MAINNET_DOMAIN = 6648936;
  uint32 public constant OPTIMISM_DOMAIN = 1869640809;
  uint32 public constant ARBITRUM_DOMAIN = 1634886255;
  uint32 public constant POLYGON_DOMAIN = 1886350457;
  uint32 public constant GNOSIS_DOMAIN = 6778479;

  string chainName;

  function saveAddress(string memory contractName, address addr) internal {
    require(bytes(chainName).length != 0, "Set 'chainName' in setUp()");

    _saveAddress(
      string(abi.encodePacked(".local/", chainName, "/", contractName, ".address")), addr
    );
    _saveAddressEncoded(
      string(abi.encodePacked(".local/", chainName, "/", contractName, ".e.address")), addr
    );
  }

  function _saveAddress(string memory path, address addr) internal {
    try vm.removeFile(path) {}
    catch {
      console.log(string(abi.encodePacked("Creating a new record at ", path)));
    }
    vm.writeLine(path, vm.toString(addr));
  }

  function _saveAddressEncoded(string memory path, address addr) internal {
    try vm.removeFile(path) {}
    catch {
      console.log(string(abi.encodePacked("Creating a new encoded record at ", path)));
    }
    vm.writeLine(path, vm.toString(abi.encode(addr)));
  }

  function getAddress(string memory contractName) internal returns (address addr) {
    require(bytes(chainName).length != 0, "Set 'chainName' in setUp()");

    addr =
      _getAddress(string(abi.encodePacked(".local/", chainName, "/", contractName, ".e.address")));
  }

  function getAddressAt(
    string memory contractName,
    string memory _chainName
  )
    internal
    returns (address addr)
  {
    addr =
      _getAddress(string(abi.encodePacked(".local/", _chainName, "/", contractName, ".e.address")));
  }

  function _getAddress(string memory path) internal returns (address addr) {
    string[] memory inputs = new string[](2);
    inputs[0] = "cat";
    inputs[1] = path;
    bytes memory res = vm.ffi(inputs);

    addr = abi.decode(res, (address));
  }

  function getPrivKey() internal view returns (uint256 key) {
    bytes32 k = vm.envBytes32("PRIVATE_KEY");
    key = uint256(k);
  }

  function saveSig(string memory sigName, uint256 deadline, uint8 v, bytes32 r, bytes32 s) internal {
    require(bytes(chainName).length != 0, "Set 'chainName' in setUp()");

    string memory path = string(abi.encodePacked(".local/", chainName, "/sig_", sigName));

    string memory deadline_path = string(abi.encodePacked(path, "_deadline"));
    try vm.removeFile(deadline_path) {} catch {}
    vm.writeLine(deadline_path, vm.toString(deadline));

    string memory v_path = string(abi.encodePacked(path, "_v"));
    try vm.removeFile(v_path) {} catch {}
    vm.writeLine(v_path, vm.toString(v));

    string memory r_path = string(abi.encodePacked(path, "_r"));
    try vm.removeFile(r_path) {} catch {}
    vm.writeLine(r_path, vm.toString(uint256(r)));

    string memory s_path = string(abi.encodePacked(path, "_s"));
    try vm.removeFile(s_path) {} catch {}
    vm.writeLine(s_path, vm.toString(uint256(s)));
  }

  function getSigAt(
    string memory sigName,
    string memory _chainName
  )
    internal
    view
    returns (uint256 deadline, uint8 v, bytes32 r, bytes32 s)
  {
    string memory path = string(abi.encodePacked(".local/", _chainName, "/sig_", sigName));

    string memory deadline_path = string(abi.encodePacked(path, "_deadline"));
    string memory v_path = string(abi.encodePacked(path, "_v"));
    string memory r_path = string(abi.encodePacked(path, "_r"));
    string memory s_path = string(abi.encodePacked(path, "_s"));

    string memory _deadline = vm.readLine(deadline_path);
    string memory _v = vm.readLine(v_path);
    string memory _r = vm.readLine(r_path);
    string memory _s = vm.readLine(s_path);

    deadline = strToUint(_deadline);
    v = uint8(strToUint(_v));
    r = bytes32(strToUint(_r));
    s = bytes32(strToUint(_s));
  }

  function strToUint(string memory _str) public pure returns (uint256 res) {
    for (uint256 i = 0; i < bytes(_str).length; i++) {
      if ((uint8(bytes(_str)[i]) - 48) < 0 || (uint8(bytes(_str)[i]) - 48) > 9) {
        return 0;
      }
      res += (uint8(bytes(_str)[i]) - 48) * 10 ** (bytes(_str).length - i - 1);
    }

    return res;
  }
}
