// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/console.sol";
import {Test} from "forge-std/Test.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {BorrowingVault} from "../../src/vaults/borrowing/BorrowingVault.sol";
import {BorrowingVaultUpgradeable} from "../../src/vaults/borrowing/BorrowingVaultUpgradeable.sol";
import {BorrowingVaultBeaconFactory} from
  "../../src/vaults/borrowing/BorrowingVaultBeaconFactory.sol";
import {FujiOracle} from "../../src/FujiOracle.sol";
import {MockERC20} from "../../src/mocks/MockERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {Chief} from "../../src/Chief.sol";
import {IVault} from "../../src/interfaces/IVault.sol";
import {ILendingProvider} from "../../src/interfaces/ILendingProvider.sol";
import {CoreRoles} from "../../src/access/CoreRoles.sol";
import {IFujiOracle} from "../../src/interfaces/IFujiOracle.sol";

contract ForkingSetup2 is CoreRoles, Test {
  using SafeERC20 for IERC20;

  struct PriceFeed {
    string asset;
    address chainlink;
  }

  struct NestedMapping {
    string asset1;
    string asset2;
    address market;
    string name;
  }

  struct SimpleMapping {
    string asset;
    address market;
    string name;
  }

  struct VaultConfig {
    string collateral;
    string debt;
    uint256 liqRatio;
    uint256 maxLtv;
    string name;
    string[] providers;
    uint256 rating;
  }

  struct YieldVaultConfig {
    string asset;
    string name;
    string[] providers;
    uint256 rating;
  }

  uint32 public constant MAINNET_DOMAIN = 6648936;
  uint32 public constant OPTIMISM_DOMAIN = 1869640809;
  uint32 public constant ARBITRUM_DOMAIN = 1634886255;
  uint32 public constant POLYGON_DOMAIN = 1886350457;
  uint32 public constant GNOSIS_DOMAIN = 6778479;
  uint32 public constant GOERLI_DOMAIN = 1735353714;
  uint32 public constant OPTIMISM_GOERLI_DOMAIN = 1735356532;
  uint32 public constant MUMBAI_DOMAIN = 9991;

  uint256 public constant ALICE_PK = 0xA;
  address public ALICE = vm.addr(ALICE_PK);
  uint256 public constant BOB_PK = 0xB;
  address public BOB = vm.addr(BOB_PK);
  uint256 public constant CHARLIE_PK = 0xC;
  address public CHARLIE = vm.addr(CHARLIE_PK);
  address public INITIALIZER = vm.addr(0x111A13); // arbitrary address

  Chief public chief;
  TimelockController public timelock;
  IFujiOracle oracle;
  BorrowingVaultBeaconFactory factory;
  address implementation;

  uint256 public constant DEFAULT_MAX_LTV = 75e16; // 75%
  uint256 public constant DEFAULT_LIQ_RATIO = 82.5e16; // 82.5%

  string chainName;
  string configJson;

  constructor() {
    vm.label(ALICE, "alice");
    vm.label(BOB, "bob");
    vm.label(CHARLIE, "charlie");
    vm.label(INITIALIZER, "initializer");
  }

  function setUpFork(string memory chain) public {
    chainName = chain;
    vm.createSelectFork(chainName);

    string memory path = string.concat("deploy-configs/", chainName, ".json");
    configJson = vm.readFile(path);
  }

  function setOrDeployChief(bool deploy) internal {
    if (deploy) {
      chief = new Chief(true, false);
    } else {
      chief = Chief(getAddress("Chief"));
    }
    vm.label(address(chief), "Chief");
    timelock = TimelockController(payable(chief.timelock()));
    vm.label(address(timelock), "Timelock");
  }

  function setOrDeployFujiOracle(bool deploy) internal {
    bytes memory raw = vm.parseJson(configJson, ".price-feeds");
    PriceFeed[] memory list = abi.decode(raw, (PriceFeed[]));

    uint256 len = list.length;

    if (deploy) {
      address[] memory addrs = new address[](len);
      address[] memory feeds = new address[](len);
      for (uint256 i; i < len; i++) {
        addrs[i] = readAddrFromConfig(list[i].asset);
        vm.label(addrs[i], list[i].asset);
        feeds[i] = list[i].chainlink;
      }
      oracle = new FujiOracle(addrs, feeds, address(chief));
    } else {
      oracle = FujiOracle(getAddress("FujiOracle"));
    }
    vm.label(address(oracle), "FujiOracle");
  }

  function setOrDeployBorrowingVaultFactory(bool deployFactory, bool deployImplementation) internal {
    if (deployFactory) {
      if (deployImplementation) {
        implementation = address(new BorrowingVaultUpgradeable());
      } else {
        implementation = getAddress("BorrowingVault-Impl");
      }
      factory = new BorrowingVaultBeaconFactory(address(chief), implementation);
    } else {
      factory = BorrowingVaultBeaconFactory(getAddress("BorrowingVaultBeaconFactory"));
    }
    vm.label(address(factory), "BorrowingVaultBeaconFactory");

    if (!chief.allowedVaultFactory(address(factory))) {
      bytes memory data2 =
        abi.encodeWithSelector(chief.allowVaultFactory.selector, address(factory), true);
      _callWithTimelock(address(chief), data2);
    }
  }

  function deployBorrowingVaults() internal returns (address[] memory) {
    bytes memory raw = vm.parseJson(configJson, ".borrowing-vaults");
    VaultConfig[] memory vaults = abi.decode(raw, (VaultConfig[]));

    uint256 minCollateral = 1e6;

    uint256 len = vaults.length;
    address[] memory deployed = new address[](len);
    address collateral;
    address debt;
    string memory name;
    uint256 rating;
    string[] memory providerNames;

    for (uint256 i; i < len; i++) {
      collateral = readAddrFromConfig(vaults[i].collateral);
      debt = readAddrFromConfig(vaults[i].debt);
      name = vaults[i].name;
      rating = vaults[i].rating;
      providerNames = vaults[i].providers;

      uint256 providersLen = providerNames.length;
      ILendingProvider[] memory providers = new ILendingProvider[](providersLen);
      for (uint256 j; j < providersLen; j++) {
        providers[j] = ILendingProvider(getAddress(providerNames[j]));
      }

      if (IERC20(collateral).allowance(msg.sender, address(factory)) < minCollateral) {
        IERC20(collateral).safeIncreaseAllowance(address(factory), minCollateral);
      }
      deal(collateral, msg.sender, minCollateral);
      address v =
        chief.deployVault(address(factory), abi.encode(collateral, debt, providers), rating);
      deployed[i] = v;
    }

    return deployed;
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

  function readAddrFromConfig(string memory key) internal returns (address) {
    return vm.parseJsonAddress(configJson, string.concat(".", key));
  }

  function _getAddress(string memory path) internal view returns (address addr) {
    string memory content = vm.readFile(path);
    addr = vm.parseAddress(content);
  }

  function _callWithTimelock(address target, bytes memory callData) internal {
    timelock.schedule(target, 0, callData, 0x00, 0x00, 1.5 days);
    vm.warp(block.timestamp + 2 days);
    timelock.execute(target, 0, callData, 0x00, 0x00);
    rewind(2 days);
  }

  function _grantRoleChief(bytes32 role, address account) internal {
    bytes memory sendData = abi.encodeWithSelector(chief.grantRole.selector, role, account);
    _callWithTimelock(address(chief), sendData);
  }
}
