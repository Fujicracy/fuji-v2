// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/Script.sol";
import "forge-std/console.sol";

import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IWETH9} from "../src/abstracts/WETH9.sol";
import {IConnext} from "../src/interfaces/connext/IConnext.sol";
import {ILendingProvider} from "../src/interfaces/ILendingProvider.sol";
import {BorrowingVaultFactory2} from "../src/vaults/borrowing/BorrowingVaultFactory2.sol";
import {BorrowingVault} from "../src/vaults/borrowing/BorrowingVault.sol";
import {BorrowingVault2} from "../src/vaults/borrowing/BorrowingVault2.sol";
import {AddrMapper} from "../src/helpers/AddrMapper.sol";
import {FujiOracle} from "../src/FujiOracle.sol";
import {Chief} from "../src/Chief.sol";
import {ConnextRouter} from "../src/routers/ConnextRouter.sol";

contract ScriptPlus is Script {
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

  AddrMapper mapper;
  Chief chief;
  TimelockController timelock;
  BorrowingVaultFactory2 factory;
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

  address[] timelockTargets;
  bytes[] timelockDatas;
  uint256[] timelockValues;
  string[] chainNames;

  constructor() {
    chainNames.push("polygon");
    chainNames.push("optimism");
    chainNames.push("arbitrum");
    chainNames.push("gnosis");
  }

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
      address connext = readAddrFromConfig("ConnextCore");
      address weth = readAddrFromConfig("WETH");

      connextRouter = new ConnextRouter(IWETH9(weth), IConnext(connext), Chief(chief));
      saveAddress("ConnextRouter", address(connextRouter));
      saveAddress("ConnextHandler", address(connextRouter.handler()));
    } else {
      connextRouter = ConnextRouter(payable(getAddress("ConnextRouter")));
    }
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
        feeds[i] = list[i].chainlink;
      }
      oracle = new FujiOracle(addrs, feeds, address(chief));
      saveAddress("FujiOracle", address(oracle));
    } else {
      oracle = FujiOracle(getAddress("FujiOracle"));
      address asset;
      address feed;
      // set new feeds
      for (uint256 i; i < len; i++) {
        asset = readAddrFromConfig(list[i].asset);
        feed = list[i].chainlink;
        if (oracle.usdPriceFeeds(asset) != feed) {
          console.log(string.concat("Setting price feed for: ", list[i].asset));
          timelockTargets.push(address(oracle));
          timelockDatas.push(abi.encodeWithSelector(oracle.setPriceFeed.selector, asset, feed));
          timelockValues.push(0);
        }
      }
      callBatchWithTimelock();
    }
  }

  function setOrDeployBorrowingVaultFactory2(bool deploy, bool setContractCode) internal {
    if (deploy) {
      factory = new BorrowingVaultFactory2(address(chief));
      saveAddress("BorrowingVaultFactory2", address(factory));
    } else {
      factory = BorrowingVaultFactory2(getAddress("BorrowingVaultFactory2"));
    }

    if (setContractCode) {
      console.log("Setting BorrowingVault2 contract code ...");
      bytes memory data1 = abi.encodeWithSelector(
        factory.setContractCode.selector, vm.getCode("BorrowingVault2.sol:BorrowingVault2")
      );
      callWithTimelock(address(factory), data1);
    }
    if (!chief.allowedVaultFactory(address(factory))) {
      bytes memory data2 =
        abi.encodeWithSelector(chief.allowVaultFactory.selector, address(factory), true);
      callWithTimelock(address(chief), data2);
    }
  }

  function setOrDeployAddrMapper(bool deploy) internal {
    if (deploy) {
      mapper = new AddrMapper(address(chief));
      saveAddress("AddrMapper", address(mapper));
    } else {
      mapper = AddrMapper(getAddress("AddrMapper"));
    }
    setSimpleMappings();
    setNestedMappings();

    callBatchWithTimelock();
  }

  function setSimpleMappings() internal {
    bytes memory raw = vm.parseJson(configJson, ".simple-mappings");
    SimpleMapping[] memory simple = abi.decode(raw, (SimpleMapping[]));

    uint256 len = simple.length;
    address asset;
    address market;
    string memory name;
    bytes memory data;
    for (uint256 i; i < len; i++) {
      asset = readAddrFromConfig(simple[i].asset);
      market = simple[i].market;
      name = simple[i].name;

      if (mapper.getAddressMapping(name, asset) != market) {
        data = abi.encodeWithSelector(mapper.setMapping.selector, name, asset, market);
        timelockTargets.push(address(mapper));
        timelockDatas.push(data);
        timelockValues.push(0);
      }
    }
  }

  function setNestedMappings() internal {
    bytes memory raw = vm.parseJson(configJson, ".nested-mappings");
    NestedMapping[] memory nested = abi.decode(raw, (NestedMapping[]));

    uint256 len = nested.length;
    address asset1;
    address asset2;
    address market;
    string memory name;
    bytes memory data;
    for (uint256 i; i < len; i++) {
      asset1 = readAddrFromConfig(nested[i].asset1);
      asset2 = readAddrFromConfig(nested[i].asset2);
      market = nested[i].market;
      name = nested[i].name;

      if (mapper.getAddressNestedMapping(name, asset1, asset2) != market) {
        data =
          abi.encodeWithSelector(mapper.setNestedMapping.selector, name, asset1, asset2, market);
        timelockTargets.push(address(mapper));
        timelockDatas.push(data);
        timelockValues.push(0);
      }
    }
  }

  function setRouters() internal {
    uint256 len = chainNames.length;

    address current = address(connextRouter);

    uint32 domain;
    address router;
    for (uint256 i; i < len; i++) {
      domain = getDomainByChainName(chainNames[i]);
      router = getAddressAt("ConnextRouter", chainNames[i]);
      if (connextRouter.routerByDomain(domain) != router && current != router) {
        timelockTargets.push(current);
        timelockDatas.push(abi.encodeWithSelector(connextRouter.setRouter.selector, domain, router));
        timelockValues.push(0);
      }
    }

    callBatchWithTimelock();
  }

  function deployBorrowingVaults() internal {
    bytes memory raw = vm.parseJson(configJson, ".borrowing-vaults");
    VaultConfig[] memory vaults = abi.decode(raw, (VaultConfig[]));

    uint256 len = vaults.length;
    address collateral;
    address debt;
    string memory name;
    uint256 liqRatio;
    uint256 maxLtv;
    string[] memory providerNames;
    uint256 rating;
    for (uint256 i; i < len; i++) {
      collateral = readAddrFromConfig(vaults[i].collateral);
      debt = readAddrFromConfig(vaults[i].debt);
      name = vaults[i].name;
      liqRatio = vaults[i].liqRatio;
      maxLtv = vaults[i].maxLtv;
      providerNames = vaults[i].providers;
      rating = vaults[i].rating;

      uint256 providersLen = providerNames.length;
      ILendingProvider[] memory providers = new ILendingProvider[](providersLen);
      for (uint256 j; j < providersLen; j++) {
        providers[j] = ILendingProvider(getAddress(providerNames[j]));
      }
      address vault = chief.deployVault(
        address(factory),
        abi.encode(collateral, debt, address(oracle), providers, maxLtv, liqRatio),
        rating
      );
      saveAddress(name, vault);
    }
  }

  function deployBorrowingVaults2() internal {
    bytes memory raw = vm.parseJson(configJson, ".borrowing-vaults");
    VaultConfig[] memory vaults = abi.decode(raw, (VaultConfig[]));

    uint256 len = vaults.length;
    address collateral;
    address debt;
    string memory name;
    uint256 rating;
    for (uint256 i; i < len; i++) {
      collateral = readAddrFromConfig(vaults[i].collateral);
      debt = readAddrFromConfig(vaults[i].debt);
      name = vaults[i].name;
      rating = vaults[i].rating;

      try vm.readFile(string.concat("deployments/", chainName, "/", name)) {
        console.log(string.concat("Skip deploying: ", name));
      } catch {
        console.log(string.concat("Deploying: ", name, " ..."));
        address vault = chief.deployVault(address(factory), abi.encode(collateral, debt), rating);
        saveAddress(name, vault);
      }
    }
  }

  function setBorrowingVaults2() internal {
    bytes memory raw = vm.parseJson(configJson, ".borrowing-vaults");
    VaultConfig[] memory vaults = abi.decode(raw, (VaultConfig[]));

    uint256 len = vaults.length;
    BorrowingVault2 vault;
    string memory name;
    uint256 liqRatio;
    uint256 maxLtv;
    string[] memory providerNames;
    for (uint256 i; i < len; i++) {
      name = vaults[i].name;
      liqRatio = vaults[i].liqRatio;
      maxLtv = vaults[i].maxLtv;
      providerNames = vaults[i].providers;

      uint256 providersLen = providerNames.length;
      ILendingProvider[] memory providers = new ILendingProvider[](providersLen);
      for (uint256 j; j < providersLen; j++) {
        providers[j] = ILendingProvider(getAddress(providerNames[j]));
      }
      vault = BorrowingVault2(payable(getAddress(name)));

      if (address(vault.oracle()) == address(0)) {
        console.log(string.concat("Setting ", name, "..."));
        timelockTargets.push(address(vault));
        timelockDatas.push(abi.encodeWithSelector(vault.setOracle.selector, address(oracle)));
        timelockValues.push(0);
        timelockTargets.push(address(vault));
        timelockDatas.push(abi.encodeWithSelector(vault.setProviders.selector, providers));
        timelockValues.push(0);
        timelockTargets.push(address(vault));
        timelockDatas.push(abi.encodeWithSelector(vault.setActiveProvider.selector, providers[0]));
        timelockValues.push(0);
        timelockTargets.push(address(vault));
        timelockDatas.push(abi.encodeWithSelector(vault.setLtvFactors.selector, maxLtv, liqRatio));
        timelockValues.push(0);
      } else {
        console.log(string.concat(name, " already set."));
      }
      console.log("============");
    }

    callBatchWithTimelock();
  }

  function initBorrowingVaults2() internal {
    bytes memory raw = vm.parseJson(configJson, ".borrowing-vaults");
    VaultConfig[] memory vaults = abi.decode(raw, (VaultConfig[]));

    uint256 len = vaults.length;
    BorrowingVault2 vault;
    address collateral;
    address debt;
    uint256 maxLtv;
    string memory name;
    for (uint256 i; i < len; i++) {
      name = vaults[i].name;
      maxLtv = vaults[i].maxLtv;

      collateral = readAddrFromConfig(vaults[i].collateral);
      debt = readAddrFromConfig(vaults[i].debt);

      vault = BorrowingVault2(payable(getAddress(name)));

      if (!vault.initialized()) {
        console.log(string.concat("Initializing: ", name, " ..."));
        uint256 debtShares = 1e6;
        uint256 price = oracle.getPriceOf(debt, collateral, vault.debtDecimals());
        uint256 minCollateral = (debtShares * 1e18 * 10 ** vault.decimals()) / (maxLtv * price) + 1;
        uint256 colShares = minCollateral < debtShares ? debtShares : minCollateral;

        SafeERC20.safeIncreaseAllowance(IERC20(collateral), address(vault), colShares);
        vault.initializeVaultShares(colShares, debtShares);
      } else {
        console.log(string.concat(name, " already initialized."));
      }
      console.log("============");
    }

    callBatchWithTimelock();
  }

  function callWithTimelock(address target, bytes memory callData) internal {
    bytes32 hash = timelock.hashOperation(target, 0, callData, 0x00, 0x00);

    if (timelock.isOperationReady(hash) && timelock.isOperationPending(hash)) {
      console.log("Execute:");
      timelock.execute(target, 0, callData, 0x00, 0x00);
    } else if (!timelock.isOperation(hash) && !timelock.isOperationDone(hash)) {
      console.log("Schedule:");
      timelock.schedule(target, 0, callData, 0x00, 0x00, 3 seconds);
    } else {
      console.log("Already scheduled and executed:");
    }
    console.logBytes32(hash);
    console.log("============");
  }

  function callBatchWithTimelock() internal {
    if (timelockTargets.length == 0) return;

    bytes32 hash =
      timelock.hashOperationBatch(timelockTargets, timelockValues, timelockDatas, 0x00, 0x00);

    if (timelock.isOperationReady(hash) && timelock.isOperationPending(hash)) {
      console.log("Execute:");
      timelock.executeBatch(timelockTargets, timelockValues, timelockDatas, 0x00, 0x00);
    } else if (!timelock.isOperation(hash) && !timelock.isOperationDone(hash)) {
      console.log("Schedule:");
      timelock.scheduleBatch(timelockTargets, timelockValues, timelockDatas, 0x00, 0x00, 3 seconds);
    } else {
      console.log("Already scheduled and executed:");
    }
    console.logBytes32(hash);
    console.log("============");

    // clear storage
    delete timelockTargets;
    delete timelockDatas;
    delete timelockValues;
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

  function getDomainByChainName(string memory name) internal pure returns (uint32 domain) {
    if (areEq(name, "gnosis")) {
      domain = GNOSIS_DOMAIN;
    } else if (areEq(name, "polygon")) {
      domain = POLYGON_DOMAIN;
    } else if (areEq(name, "optimism")) {
      domain = OPTIMISM_DOMAIN;
    } else if (areEq(name, "arbitrum")) {
      domain = ARBITRUM_DOMAIN;
    } else {
      revert("Unsupported chain!");
    }
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

  function areEq(string memory a, string memory b) internal pure returns (bool) {
    if (bytes(a).length != bytes(b).length) {
      return false;
    } else {
      return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }
  }
}
