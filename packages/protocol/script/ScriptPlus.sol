// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/Script.sol";
import "forge-std/console.sol";

import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {IWETH9} from "../src/abstracts/WETH9.sol";
import {IConnext} from "../src/interfaces/connext/IConnext.sol";
import {BorrowingVaultFactory} from "../src/vaults/borrowing/BorrowingVaultFactory.sol";
import {FujiOracle} from "../src/FujiOracle.sol";
import {Chief} from "../src/Chief.sol";
import {ConnextRouter} from "../src/routers/ConnextRouter.sol";

contract ScriptPlus is Script {
  Chief chief;
  TimelockController timelock;
  BorrowingVaultFactory factory;
  FujiOracle oracle;
  ConnextRouter connextRouter;

  // https://docs.connext.network/resources/deployments
  uint32 public constant MAINNET_DOMAIN = 6648936;
  uint32 public constant OPTIMISM_DOMAIN = 1869640809;
  uint32 public constant ARBITRUM_DOMAIN = 1634886255;
  uint32 public constant POLYGON_DOMAIN = 1886350457;
  uint32 public constant GNOSIS_DOMAIN = 6778479;

  address deployer;
  string configJson;
  string chainName;

  function setUpOn(string memory chain) internal {
    chainName = chain;

    string memory path = string.concat("deploy-configs/", chainName, ".json");
    configJson = vm.readFile(path);

    uint256 pvk = vm.envUint("DEPLOYER_PRIVATE_KEY");
    deployer = vm.addr(pvk);
  }

  function setOrDeployChief(bool deploy) internal {
    if (deploy) {
      chief = new Chief(true, false);
      saveAddress("Chief", address(chief));
    } else {
      chief = Chief(getAddress("Chief"));
    }
    timelock = TimelockController(payable(chief.timelock()));
  }

  function setOrDeployConnextRouter(bool deploy) internal {
    if (deploy) {
      address connext = getAddress("Connext");
      address weth = readAddrFromConfig("WETH");

      connextRouter = new ConnextRouter(IWETH9(weth), IConnext(connext), Chief(chief));
      saveAddress("ConnextRouter", address(connextRouter));
      saveAddress("ConnextHandler", address(connextRouter.handler()));
    } else {
      connextRouter = ConnextRouter(payable(getAddress("ConnextRouter")));
    }
  }

  function setOrDeployFujiOracle(bool deploy, string[] memory assets) internal {
    if (deploy) {
      uint256 len = assets.length;
      address[] memory addrs = new address[](len);
      address[] memory feeds = new address[](len);
      for (uint256 i; i < len; i++) {
        addrs[i] = readAddrFromConfig(assets[i]);
        feeds[i] = readAddrFromConfig(string.concat(assets[i], "-price-feed"));
      }
      oracle = new FujiOracle(addrs, feeds, address(chief));
      saveAddress("FujiOracle", address(oracle));
    } else {
      oracle = FujiOracle(getAddress("FujiOracle"));
    }
  }

  function setOrDeployBorrowingVaultFactory(bool deploy) internal {
    if (deploy) {
      factory = new BorrowingVaultFactory(address(chief));
      saveAddress("BorrowingVaultFactory", address(factory));
    } else {
      factory = BorrowingVaultFactory(getAddress("BorrowingVaultFactory"));
    }
  }

  function scheduleWithTimelock(address target, bytes memory callData) internal {
    timelock.schedule(target, 0, callData, 0x00, 0x00, 1 seconds);
  }

  function executeWithTimelock(address target, bytes memory callData) internal {
    timelock.execute(target, 0, callData, 0x00, 0x00);
  }

  /* UTILITIES */

  function readAddrFromConfig(string memory key) internal returns (address) {
    return vm.parseJsonAddress(configJson, string.concat(".", key));
  }

  function saveAddress(string memory contractName, address addr) internal {
    require(bytes(chainName).length != 0, "Set 'chainName' in setUp()");

    string memory path = string.concat("deployments/", chainName, "/", contractName);

    _saveAddress(path, addr);
  }

  function _saveAddress(string memory path, address addr) internal {
    try vm.removeFile(path) {}
    catch {
      console.log(string(abi.encodePacked("Creating a new record at ", path)));
    }
    vm.writeLine(path, vm.toString(addr));
  }

  function getAddress(string memory contractName) internal view returns (address addr) {
    require(bytes(chainName).length != 0, "Set 'chainName' in setUp()");

    addr = _getAddress(string.concat("deployments/", chainName, "/", contractName));
  }

  function getAddressAt(
    string memory contractName,
    string memory _chainName
  )
    internal
    view
    returns (address addr)
  {
    addr = _getAddress(string.concat("deployments/", _chainName, "/", contractName));
  }

  function _getAddress(string memory path) internal view returns (address addr) {
    string memory content = vm.readFile(path);
    addr = vm.parseAddress(content);
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
