// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import "forge-std/Script.sol";
import "forge-std/console.sol";

import {ScriptUtilities} from "./ScriptUtilities.s.sol";
import {TimelockController} from
  "openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from
  "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IWETH9} from "../src/abstracts/WETH9.sol";
import {IConnext} from "../src/interfaces/connext/IConnext.sol";
import {IVault} from "../src/interfaces/IVault.sol";
import {ILendingProvider} from "../src/interfaces/ILendingProvider.sol";
import {BorrowingVaultFactory2} from "../src/vaults/borrowing/BorrowingVaultFactory2.sol";
import {BorrowingVault} from "../src/vaults/borrowing/BorrowingVault.sol";
import {BorrowingVault2} from "../src/vaults/borrowing/BorrowingVault2.sol";
import {AddrMapper} from "../src/helpers/AddrMapper.sol";
import {FujiOracle} from "../src/FujiOracle.sol";
import {Chief} from "../src/Chief.sol";
import {ConnextRouter} from "../src/routers/ConnextRouter.sol";
import {CoreRoles} from "../src/access/CoreRoles.sol";
import {RebalancerManager} from "../src/RebalancerManager.sol";
import {FlasherBalancer} from "../src/flashloans/FlasherBalancer.sol";

contract ScriptPlus is ScriptUtilities, CoreRoles {
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
  RebalancerManager rebalancer;
  FlasherBalancer flasherBalancer;

  address deployer;

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

    address caller = readAddrFromConfig("FujiRelayer");
    if (!connextRouter.isAllowedCaller(caller)) {
      console.log("Allowing caller for ConnextRouter ...");
      bytes memory data = abi.encodeWithSelector(connextRouter.allowCaller.selector, caller, true);
      callWithTimelock(address(connextRouter), data);
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
        console.log(string.concat("Setting oracle for ", name, "..."));
        timelockTargets.push(address(vault));
        timelockDatas.push(abi.encodeWithSelector(vault.setOracle.selector, address(oracle)));
        timelockValues.push(0);
      }
      if (vault.getProviders().length == 0) {
        console.log(string.concat("Setting providers for ", name, "..."));
        timelockTargets.push(address(vault));
        timelockDatas.push(abi.encodeWithSelector(vault.setProviders.selector, providers));
        timelockValues.push(0);
      }
      if (address(vault.activeProvider()) == address(0)) {
        console.log(string.concat("Setting activeProvider for ", name, "..."));
        timelockTargets.push(address(vault));
        timelockDatas.push(abi.encodeWithSelector(vault.setActiveProvider.selector, providers[0]));
        timelockValues.push(0);
      }
      if (vault.maxLtv() != maxLtv || vault.liqRatio() != liqRatio) {
        console.log(string.concat("Setting ltv factors for ", name, "..."));
        timelockTargets.push(address(vault));
        timelockDatas.push(abi.encodeWithSelector(vault.setLtvFactors.selector, maxLtv, liqRatio));
        timelockValues.push(0);
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

      if (!vault.initialized() && address(vault.oracle()) != address(0)) {
        console.log(string.concat("Initializing: ", name, " ..."));

        uint256 minCollateral = 0.0025 ether;

        SafeERC20.safeIncreaseAllowance(IERC20(collateral), address(vault), minCollateral);
        vault.initializeVaultShares(minCollateral);
      } else {
        console.log(string.concat("Skip initializing ", name));
      }
      console.log("============");
    }

    callBatchWithTimelock();
  }

  function setOrDeployFlasherBalancer(bool deploy) internal {
    if (deploy) {
      flasherBalancer = new FlasherBalancer(readAddrFromConfig("Balancer"));
      saveAddress("FlasherBalancer", address(flasherBalancer));
    } else {
      flasherBalancer = FlasherBalancer(getAddress("FlasherBalancer"));
    }
  }

  function setOrDeployRebalancer(bool deploy) internal {
    if (deploy) {
      rebalancer = new RebalancerManager(address(chief));
      saveAddress("RebalancerManager", address(rebalancer));
    } else {
      rebalancer = RebalancerManager(getAddress("RebalancerManager"));
    }

    if (!chief.hasRole(REBALANCER_ROLE, address(rebalancer))) {
      timelockTargets.push(address(chief));
      timelockDatas.push(
        abi.encodeWithSelector(chief.grantRole.selector, REBALANCER_ROLE, address(rebalancer))
      );
      timelockValues.push(0);
    }
    if (!rebalancer.allowedExecutor(deployer)) {
      timelockTargets.push(address(rebalancer));
      timelockDatas.push(abi.encodeWithSelector(rebalancer.allowExecutor.selector, deployer, true));
      timelockValues.push(0);
    }
    if (!chief.allowedFlasher(address(flasherBalancer))) {
      timelockTargets.push(address(chief));
      timelockDatas.push(
        abi.encodeWithSelector(chief.allowFlasher.selector, address(flasherBalancer), true)
      );
      timelockValues.push(0);
    }

    callBatchWithTimelock();
  }

  /**
   * VAULTS MANAGEMENT ****************************
   */

  function rebalanceVault(
    string memory vaultName,
    ILendingProvider from,
    ILendingProvider to
  )
    internal
  {
    address vault = getAddress(vaultName);

    // leave a small amount if there's any debt left
    uint256 assets = from.getDepositBalance(vault, IVault(vault)) - 0.001 ether;
    uint256 debt = from.getBorrowBalance(vault, IVault(vault));
    console.log(string.concat("Rebalancing: ", vaultName));
    console.log(assets);
    console.log(debt);

    rebalancer.rebalanceVault(IVault(vault), assets, debt, from, to, flasherBalancer, true);
  }

  function setVaultNewRating(string memory vaultName, uint256 rating) internal {
    bytes memory callData =
      abi.encodeWithSelector(chief.setSafetyRating.selector, getAddress(vaultName), rating);
    callWithTimelock(address(chief), callData);
  }

  /**
   * TIMELOCK ****************************
   */

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
}
